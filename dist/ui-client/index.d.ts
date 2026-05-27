import type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, AuditWriteResponse, AuditUiClientConfig, ChangeLogInput } from "./types";
import { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME } from "../contracts/types";
import { AUDIT_API_BASE_PATH } from "./types";
export type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, AuditWriteResponse, AuditUiClientConfig, ChangeLogInput, };
export { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME, AUDIT_API_BASE_PATH, };
export declare class AuditUiClient {
    private readonly baseUrl;
    private readonly apiBasePath;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly defaultHeaders;
    private readonly fetchImpl;
    constructor(config: AuditUiClientConfig);
    private requestOnce;
    private request;
    logAccess(context: AuditContext, input: AccessLogInput): Promise<AuditWriteResponse>;
    logChange(context: AuditContext, input: ChangeLogInput): Promise<AuditWriteResponse>;
    logActivity(context: AuditContext, input: ActivityLogInput): Promise<AuditWriteResponse>;
    getHealth(): Promise<AuditHealth>;
}
export declare function createAuditHttpClient(config: AuditUiClientConfig): AuditUiClient;
/** @deprecated Use createAuditHttpClient */
export declare function initUiClient(config: AuditUiClientConfig): AuditUiClient;
