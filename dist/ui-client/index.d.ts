import type { AccessLogItem, AccessLogInput, ActivityLogItem, ActivityLogInput, AuditCountResponse, AuditContext, AuditHealth, AuditReadParams, AuditWriteResponse, AuditListResponse, AuditUiClientConfig, ChangeLogItem, ChangeLogInput } from "./types";
import { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME } from "../contracts/types";
import { AUDIT_API_BASE_PATH } from "./types";
export type { AccessLogInput, AccessLogItem, ActivityLogInput, ActivityLogItem, AuditContext, AuditCountResponse, AuditHealth, AuditListResponse, AuditReadParams, AuditWriteResponse, AuditUiClientConfig, ChangeLogItem, ChangeLogInput, };
export { ACTIVITY_OPERATION, ACCESS_EVENT_TYPE, ACTOR_TYPE, AUTH_METHOD, CHANGE_TYPE, OPERATION, OUTCOME, AUDIT_API_BASE_PATH, };
export declare class AuditUiClient {
    private readonly baseUrl;
    private readonly apiBasePath;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly defaultHeaders;
    private readonly fetchImpl;
    constructor(config: AuditUiClientConfig & {
        baseUrl: string;
    });
    private requestOnce;
    private request;
    logAccess(context: AuditContext, input: AccessLogInput): Promise<AuditWriteResponse>;
    logChange(context: AuditContext, input: ChangeLogInput): Promise<AuditWriteResponse>;
    logActivity(context: AuditContext, input: ActivityLogInput): Promise<AuditWriteResponse>;
    getHealth(): Promise<AuditHealth>;
    getAccess(limit?: number): Promise<AuditListResponse<AccessLogItem>>;
    getChange(limit?: number): Promise<AuditListResponse<ChangeLogItem>>;
    getActivity(limit?: number): Promise<AuditListResponse<ActivityLogItem>>;
    readAccess(params?: AuditReadParams): Promise<AuditListResponse<AccessLogItem>>;
    readChange(params?: AuditReadParams): Promise<AuditListResponse<ChangeLogItem>>;
    readActivity(params?: AuditReadParams): Promise<AuditListResponse<ActivityLogItem>>;
    countAccess(): Promise<AuditCountResponse>;
    countChange(): Promise<AuditCountResponse>;
    countActivity(): Promise<AuditCountResponse>;
}
export declare function createAuditHttpClient(config?: AuditUiClientConfig): AuditUiClient;
/** @deprecated Use createAuditHttpClient */
export declare function initUiClient(config?: AuditUiClientConfig): AuditUiClient;
