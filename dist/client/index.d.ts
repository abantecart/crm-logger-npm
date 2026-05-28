import type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput } from "../contracts/types";
import { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUDIT_DEFAULTS, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME } from "../contracts/types";
import type { AuditClientConfig } from "./types";
export type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput, AuditClientConfig, };
export { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME, AUDIT_DEFAULTS, };
export declare class AuditLogger {
    private readonly config;
    private readonly client;
    private readonly requestTimeoutMs;
    private readonly maxRetries;
    constructor(config: AuditClientConfig & {
        target: string;
    });
    private callWithRetry;
    logAccess(ctx: AuditContext, input: AccessLogInput): Promise<void>;
    logChange(ctx: AuditContext, input: ChangeLogInput): Promise<void>;
    logActivity(ctx: AuditContext, input: ActivityLogInput): Promise<void>;
    getAuditHealth(): Promise<AuditHealth>;
    close(): void;
}
export declare function createAuditGrpcClient(config?: AuditClientConfig): AuditLogger;
/** @deprecated Use createAuditGrpcClient */
export declare function init(config?: AuditClientConfig): AuditLogger;
