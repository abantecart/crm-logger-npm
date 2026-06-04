/**
 * Returns the full SQL that provisions the audit outbox: the `audit_outbox`
 * table, the generic capture trigger, attachment to existing public tables, and
 * an event trigger that auto-audits future tables. Idempotent — safe to re-run.
 */
export declare function getOutboxMigrationSql(): string;
