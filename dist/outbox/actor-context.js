"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithActor = runWithActor;
/**
 * Runs fn in a single transaction, first setting the `app.*` variables via
 * SET LOCAL (set_config(..., is_local=true)). The `audit_capture` trigger reads
 * them within the same transaction, so the actor ends up on the outbox row.
 * SET LOCAL only lives until the end of the transaction, so the values do not
 * leak into the next request on the same pooled connection.
 */
async function runWithActor(pool, actor, fn) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`select
         set_config('app.user_id',    $1, true),
         set_config('app.actor_type', $2, true),
         set_config('app.tenant_id',  $3, true),
         set_config('app.request_id', $4, true),
         set_config('app.trace_id',   $5, true)`, [
            actor.userId,
            actor.actorType,
            actor.tenantId,
            actor.requestId,
            actor.traceId ?? ""
        ]);
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=actor-context.js.map