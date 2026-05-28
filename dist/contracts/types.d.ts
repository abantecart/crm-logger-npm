export declare const ACTOR_TYPE: {
    readonly USER: "user";
    readonly SYSTEM: "system";
    readonly API_CLIENT: "api_client";
    readonly ANONYMOUS: "anonymous";
};
export type ActorType = typeof ACTOR_TYPE[keyof typeof ACTOR_TYPE];
export declare const AUTH_METHOD: {
    readonly PASSWORD: "password";
    readonly OAUTH: "oauth";
    readonly API_KEY: "api_key";
    readonly SESSION: "session";
    readonly NONE: "none";
};
export type AuthMethod = typeof AUTH_METHOD[keyof typeof AUTH_METHOD];
export declare const OUTCOME: {
    readonly ALLOWED: "allowed";
    readonly DENIED: "denied";
    readonly ERROR: "error";
};
export type Outcome = typeof OUTCOME[keyof typeof OUTCOME];
export declare const ACCESS_EVENT_TYPE: {
    readonly API_REQUEST: "api.request";
    readonly LOGIN_SUCCESS: "login.success";
    readonly LOGIN_FAILURE: "login.failure";
    readonly LOGOUT: "logout";
    readonly RESOURCE_READ: "resource.read";
    readonly MFA_CHALLENGE: "mfa.challenge";
    readonly PASSWORD_RESET: "password.reset";
};
export type AccessEventType = typeof ACCESS_EVENT_TYPE[keyof typeof ACCESS_EVENT_TYPE];
export declare const CHANGE_TYPE: {
    readonly USER: "user";
    readonly SYSTEM: "system";
};
export type ChangeType = typeof CHANGE_TYPE[keyof typeof CHANGE_TYPE];
export declare const OPERATION: {
    readonly CREATE: "create";
    readonly UPDATE: "update";
    readonly DELETE: "delete";
    readonly RESTORE: "restore";
    readonly BULK_UPDATE: "bulk_update";
};
export type Operation = typeof OPERATION[keyof typeof OPERATION];
export declare const ACTIVITY_OPERATION: {
    readonly OPEN: "open";
    readonly EXPORT: "export";
    readonly EXPORTED: "exported";
    readonly UPDATE: "update";
    readonly CREATE: "create";
    readonly DELETE: "delete";
    readonly VIEW: "view";
};
export type ActivityOperation = typeof ACTIVITY_OPERATION[keyof typeof ACTIVITY_OPERATION];
export interface AuditContext {
    actorId: string;
    actorType: ActorType;
    tenantId: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    source?: string;
}
export interface AccessLogInput {
    eventType: AccessEventType;
    route?: string;
    statusCode?: number;
    durationMs?: number;
    authMethod?: AuthMethod;
    outcome: Outcome;
    meta?: Record<string, unknown>;
    geo?: {
        country?: string;
        region?: string;
    };
}
export interface UserChangeLogInput {
    changeType: "user";
    entityType: string;
    entityId: string;
    operation: Operation;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    description: string;
    parentId?: string;
    meta?: Record<string, unknown>;
}
export interface SystemChangeLogInput {
    changeType: "system";
    entityType: string;
    entityId: string;
    operation: Operation;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    systemReason: string;
    parentId?: string;
    meta?: Record<string, unknown>;
}
export type ChangeLogInput = UserChangeLogInput | SystemChangeLogInput;
export interface ActivityLogInput {
    entityType: string;
    entityId: string;
    operation: ActivityOperation;
    activity: string;
    category?: string;
    meta?: Record<string, unknown>;
}
export type RedactionRule = {
    entityType?: string;
    allowFields?: string[];
    denyFields?: string[];
};
export interface AuditContractConfig {
    retentionDaysAccess?: number;
    retentionDaysChange?: number;
    retentionDaysActivity?: number;
    redactionRules?: RedactionRule[];
}
export interface AuditHealth {
    lastSuccessAt: number | null;
    failuresTotal: number;
    driver: {
        name: string;
        lastSuccessAt: number | null;
        lastFailureAt: number | null;
    } | null;
}
export type AccessLogItem = Record<string, unknown>;
export type ChangeLogItem = Record<string, unknown>;
export type ActivityLogItem = Record<string, unknown>;
export declare const AUDIT_DEFAULTS: {
    readonly ANONYMOUS_ACTOR_ID: "anonymous";
    readonly DEFAULT_RETENTION_DAYS_ACCESS: 365;
    readonly DEFAULT_RETENTION_DAYS_CHANGE: 2555;
    readonly DEFAULT_RETENTION_DAYS_ACTIVITY: 365;
};
