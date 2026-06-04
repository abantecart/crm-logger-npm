"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOutboxRow = mapOutboxRow;
/** Maps a Postgres operation keyword onto the audit change operation. */
function mapOperation(op) {
    if (op === "INSERT")
        return "create";
    if (op === "DELETE")
        return "delete";
    return "update";
}
/**
 * Maps an outbox row into a (context, input) pair for audit-log.
 * Actor present (the write went through the service with SET LOCAL app.user_id)
 * -> change_type=user. No actor (manual SQL, migration, another writer)
 * -> change_type=system.
 */
function mapOutboxRow(row, options = {}) {
    const source = options.source ?? "outbox-trigger";
    const operation = mapOperation(row.operation);
    const tenantId = row.tenant_id ||
        options.defaultTenantId ||
        process.env.DEFAULT_TENANT_ID ||
        "default";
    const before = row.before ?? undefined;
    const after = row.after ?? undefined;
    const meta = {
        txid: row.txid,
        traceId: row.trace_id ?? "",
        capturedAt: row.created_at.toISOString(),
        capturedVia: source
    };
    const hasActor = row.actor_id !== "" && row.actor_type === "user";
    if (hasActor) {
        return {
            context: {
                actorId: row.actor_id,
                actorType: "user",
                tenantId,
                requestId: row.request_id,
                source
            },
            input: {
                changeType: "user",
                entityType: row.entity_type,
                entityId: row.entity_id,
                operation,
                before,
                after,
                description: `${operation} ${row.entity_type}#${row.entity_id} by ${row.actor_id}`,
                meta
            }
        };
    }
    return {
        context: {
            actorId: "system",
            actorType: "system",
            tenantId,
            requestId: row.request_id,
            source
        },
        input: {
            changeType: "system",
            entityType: row.entity_type,
            entityId: row.entity_id,
            operation,
            before,
            after,
            systemReason: `db-trigger:${row.operation} ${row.entity_type}#${row.entity_id}`,
            meta
        }
    };
}
//# sourceMappingURL=map-row.js.map