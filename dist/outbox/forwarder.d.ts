import type { Pool } from "pg";
import type { AuditLogger } from "../client/index";
import { type MappedChange } from "./map-row";
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
/**
 * Transactional-outbox forwarder. Claims unprocessed rows with
 * FOR UPDATE SKIP LOCKED (so multiple forwarders never grab the same ones),
 * sends them to audit-log, then deletes them in the same transaction.
 * At-least-once: a crash before COMMIT rolls back the DELETE, so rows are
 * retried later. Woken instantly by pg_notify('audit_outbox'); polling is a
 * fallback for the startup backlog and any missed NOTIFY.
 */
export declare function createOutboxForwarder(options: OutboxForwarderOptions): OutboxForwarder;
