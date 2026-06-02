import type { AccessLogItem, AccessLogInput, ActivityLogItem, ActivityLogInput, AuditContext, AuditHealth, ChangeLogItem, ChangeLogInput } from "../contracts/types";
import type { GetAccessResponseV1, GetActivityResponseV1, GetChangeResponseV1 } from "../contracts/http-v1";
export type { AccessLogInput, AccessLogItem, ActivityLogInput, ActivityLogItem, AuditContext, AuditHealth, ChangeLogInput, ChangeLogItem, GetAccessResponseV1, GetActivityResponseV1, GetChangeResponseV1, };
export declare const AUDIT_API_BASE_PATH: {
    readonly V1: "/v1";
    readonly V2: "/v2";
};
export type AuditApiBasePath = typeof AUDIT_API_BASE_PATH[keyof typeof AUDIT_API_BASE_PATH];
export type AuditApiBasePathInput = AuditApiBasePath | `v${number}` | `${AuditApiBasePath}/`;
export type AuditUiClientConfig = {
    baseUrl?: string;
    apiBasePath?: AuditApiBasePathInput;
    timeoutMs?: number;
    maxRetries?: number;
    defaultHeaders?: Record<string, string>;
    fetchImpl?: typeof fetch;
};
export type AuditWriteResponse = {
    ok: boolean;
    message: string;
};
export type AuditListResponse<TItem extends Record<string, unknown> = Record<string, unknown>> = {
    items: TItem[];
};
