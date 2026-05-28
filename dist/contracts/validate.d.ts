import type { AccessLogInput, ActivityLogInput, AuditContext, ChangeLogInput } from "./types";
export declare function validateContext(ctx: AuditContext): void;
export declare function validateAccessInput(input: AccessLogInput): void;
export declare function validateChangeInput(ctx: AuditContext, input: ChangeLogInput): void;
export declare function validateActivityInput(input: ActivityLogInput): void;
