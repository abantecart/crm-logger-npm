import type { AuditContext, ChangeLogInput } from "../contracts/types";
import type { OutboxRow } from "./types";
export interface MappedChange {
    context: AuditContext;
    input: ChangeLogInput;
}
export interface MapOutboxRowOptions {
    /** Tenant used when the row carries none. */
    defaultTenantId?: string;
    /** Source tag recorded on the audit context/meta. */
    source?: string;
}
/**
 * Maps an outbox row into a (context, input) pair for audit-log.
 * Actor present (the write went through the service with SET LOCAL app.user_id)
 * -> change_type=user. No actor (manual SQL, migration, another writer)
 * -> change_type=system.
 */
export declare function mapOutboxRow(row: OutboxRow, options?: MapOutboxRowOptions): MappedChange;
