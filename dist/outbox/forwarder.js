"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOutboxForwarder = createOutboxForwarder;
const map_row_1 = require("./map-row");
function intFromEnv(name, fallback) {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}
/**
 * Transactional-outbox forwarder. Claims unprocessed rows with
 * FOR UPDATE SKIP LOCKED (so multiple forwarders never grab the same ones),
 * sends them to audit-log, then deletes them in the same transaction.
 * At-least-once: a crash before COMMIT rolls back the DELETE, so rows are
 * retried later. Woken instantly by pg_notify('audit_outbox'); polling is a
 * fallback for the startup backlog and any missed NOTIFY.
 */
function createOutboxForwarder(options) {
    const { pool, grpcClient } = options;
    const batch = options.batch ?? intFromEnv("OUTBOX_BATCH", 50);
    const pollMs = options.pollMs ?? intFromEnv("OUTBOX_POLL_MS", 2000);
    const debug = options.debug ?? process.env.AUDIT_DEBUG_LOGS === "true";
    const mapRow = options.mapRow ?? ((row) => (0, map_row_1.mapOutboxRow)(row));
    const handleSignals = options.handleSignals ?? true;
    let draining = false;
    let listenClient = null;
    let timer = null;
    let stopped = false;
    async function drainOnce() {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const res = await client.query(`select id, entity_type, entity_id, operation, before, after,
                actor_id, actor_type, tenant_id, request_id, trace_id, txid, created_at
           from audit_outbox
          order by id
          limit $1
          for update skip locked`, [batch]);
            const rows = res.rows;
            if (debug && rows.length > 0) {
                console.log("[outbox-forwarder] claimed rows", rows.map((row) => ({
                    id: row.id,
                    entity_type: row.entity_type,
                    entity_id: row.entity_id,
                    operation: row.operation,
                    request_id: row.request_id,
                    created_at: row.created_at
                })));
            }
            if (rows.length === 0) {
                await client.query("COMMIT");
                return 0;
            }
            for (const row of rows) {
                const { context, input } = mapRow(row);
                if (debug) {
                    console.log("[outbox-forwarder] sending change", {
                        outboxId: row.id,
                        requestId: context.requestId,
                        entityType: input.entityType,
                        entityId: input.entityId,
                        operation: input.operation
                    });
                }
                await grpcClient.logChange(context, input);
            }
            // Delete processed rows in the same transaction: the outbox stays nearly
            // empty, long-term storage lives in DynamoDB. At-least-once still holds:
            // a crash before COMMIT rolls back the DELETE -> rows are picked up next time.
            await client.query("delete from audit_outbox where id = any($1)", [
                rows.map((r) => r.id)
            ]);
            if (debug) {
                console.log("[outbox-forwarder] deleted processed rows", rows.map((row) => row.id));
            }
            await client.query("COMMIT");
            return rows.length;
        }
        catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
        }
        finally {
            client.release();
        }
    }
    async function drainAll() {
        for (;;) {
            const n = await drainOnce();
            if (n < batch) {
                return;
            }
        }
    }
    const kick = () => {
        if (draining || stopped) {
            return;
        }
        draining = true;
        drainAll()
            .catch((err) => {
            console.error("[outbox-forwarder] drain failed", err);
        })
            .finally(() => {
            draining = false;
        });
    };
    const setupListen = async () => {
        if (stopped) {
            return;
        }
        const c = await pool.connect();
        listenClient = c;
        c.on("notification", () => kick());
        c.on("error", (err) => {
            console.error("[outbox-forwarder] LISTEN client error, reconnecting", err);
            try {
                c.release();
            }
            catch {
                /* ignore */
            }
            listenClient = null;
            if (!stopped) {
                setTimeout(() => {
                    void setupListen();
                }, 1000);
            }
        });
        await c.query("LISTEN audit_outbox");
        console.log("[outbox-forwarder] LISTEN audit_outbox active");
    };
    async function stop() {
        stopped = true;
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        try {
            listenClient?.release();
        }
        catch {
            /* ignore */
        }
        listenClient = null;
        grpcClient.close();
    }
    async function start() {
        await setupListen();
        // Poll fallback: startup backlog and any missed NOTIFY.
        timer = setInterval(kick, pollMs);
        kick();
        if (handleSignals) {
            const shutdown = () => {
                void stop().finally(() => process.exit(0));
            };
            process.once("SIGINT", shutdown);
            process.once("SIGTERM", shutdown);
        }
        console.log(`[outbox-forwarder] started (batch=${batch}, poll=${pollMs}ms)`);
    }
    return { start, stop };
}
//# sourceMappingURL=forwarder.js.map