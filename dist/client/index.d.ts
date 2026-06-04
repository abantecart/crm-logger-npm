import type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput } from "../contracts/types";
import { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUDIT_DEFAULTS, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME } from "../contracts/types";
import type { AuditAuthConfig, AuditClientConfig } from "./types";
export type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput, AuditAuthConfig, AuditClientConfig, };
export { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME, AUDIT_DEFAULTS, };
export declare class AuditLogger {
    private readonly config;
    private readonly client;
    private readonly requestTimeoutMs;
    private readonly maxRetries;
    private readonly getToken?;
    constructor(config: AuditClientConfig & {
        target: string;
    });
    /**
     * gRPC metadata carrying `authorization: Bearer <token>`. Returns empty
     * metadata when no token provider is configured (audit-log without auth),
     * so behaviour matches the previous no-auth path.
     */
    private authMetadata;
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
