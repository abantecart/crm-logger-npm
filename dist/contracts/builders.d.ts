import type { AccessLogInput, ActivityLogInput, AuditContext, AuditContractConfig, ChangeLogInput } from "./types";
export declare function buildAccessItem(ctx: AuditContext, input: AccessLogInput, _config?: AuditContractConfig): Record<string, unknown>;
export declare function buildChangeItem(ctx: AuditContext, input: ChangeLogInput, config?: AuditContractConfig): Record<string, unknown>;
export declare function buildActivityItem(ctx: AuditContext, input: ActivityLogInput, config?: AuditContractConfig): Record<string, unknown>;
