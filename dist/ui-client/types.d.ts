import type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput } from "../contracts/types";
export type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput, };
export declare const AUDIT_API_BASE_PATH: {
    readonly V1: "/v1";
    readonly V2: "/v2";
};
export type AuditApiBasePath = typeof AUDIT_API_BASE_PATH[keyof typeof AUDIT_API_BASE_PATH];
export type AuditApiBasePathInput = AuditApiBasePath | `v${number}` | `${AuditApiBasePath}/`;
export type AuditUiClientConfig = {
    baseUrl: string;
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
