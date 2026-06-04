import type { Pool, PoolClient } from "pg";
import type { AuditLogger } from "../client/index";
import { mapOutboxRow, type MappedChange } from "./map-row";
import type { OutboxRow } from "./types";

export interface OutboxForwarderOptions {
  /** Postgres pool that owns `audit_outbox` (and emits NOTIFY 'audit_outbox'). */
  pool: Pool;
  /** Audit gRPC client used to deliver each change to audit-log. */
  grpcClient: AuditLogger;
  /** Rows claimed per drain via FOR UPDATE SKIP LOCKED. Default 50 (env OUTBOX_BATCH). */
  batch?: number;
  /** Fallback poll interval in ms. Default 2000 (env OUTBOX_POLL_MS). */
  pollMs?: number;
  /** Verbose row-level logging. Default false (env AUDIT_DEBUG_LOGS=true). */
  debug?: boolean;
  /** Override the default outbox-row -> change mapping. */
  mapRow?: (row: OutboxRow) => MappedChange;
  /** Register SIGINT/SIGTERM handlers that stop the forwarder. Default true. */
  handleSignals?: boolean;
}

export interface OutboxForwarder {
  /** Begins LISTEN + poll and drains any startup backlog. */
  start(): Promise<void>;
  /** Stops polling, releases the LISTEN client and closes the gRPC client. */
  stop(): Promise<void>;
}

function intFromEnv(name: string, fallback: number): number {
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
export function createOutboxForwarder(options: OutboxForwarderOptions): OutboxForwarder {
  const { pool, grpcClient } = options;
  const batch = options.batch ?? intFromEnv("OUTBOX_BATCH", 50);
  const pollMs = options.pollMs ?? intFromEnv("OUTBOX_POLL_MS", 2000);
  const debug = options.debug ?? process.env.AUDIT_DEBUG_LOGS === "true";
  const mapRow = options.mapRow ?? ((row: OutboxRow): MappedChange => mapOutboxRow(row));
  const handleSignals = options.handleSignals ?? true;

  let draining = false;
  let listenClient: PoolClient | null = null;
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;

  async function drainOnce(): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const res = await client.query<OutboxRow>(
        `select id, entity_type, entity_id, operation, before, after,
                actor_id, actor_type, tenant_id, request_id, trace_id, txid, created_at
           from audit_outbox
          order by id
          limit $1
          for update skip locked`,
        [batch]
      );

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
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  async function drainAll(): Promise<void> {
    for (;;) {
      const n = await drainOnce();
      if (n < batch) {
        return;
      }
    }
  }

  const kick = (): void => {
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

  const setupListen = async (): Promise<void> => {
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
      } catch {
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

  async function stop(): Promise<void> {
    stopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    try {
      listenClient?.release();
    } catch {
      /* ignore */
    }
    listenClient = null;
    grpcClient.close();
  }

  async function start(): Promise<void> {
    await setupListen();

    // Poll fallback: startup backlog and any missed NOTIFY.
    timer = setInterval(kick, pollMs);
    kick();

    if (handleSignals) {
      const shutdown = (): void => {
        void stop().finally(() => process.exit(0));
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    }

    console.log(
      `[outbox-forwarder] started (batch=${batch}, poll=${pollMs}ms)`
    );
  }

  return { start, stop };
}
