"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIT_DEFAULTS = exports.ACTIVITY_OPERATION = exports.OPERATION = exports.CHANGE_TYPE = exports.ACCESS_EVENT_TYPE = exports.OUTCOME = exports.AUTH_METHOD = exports.ACTOR_TYPE = void 0;
exports.ACTOR_TYPE = {
    USER: "user",
    SYSTEM: "system",
    API_CLIENT: "api_client",
    ANONYMOUS: "anonymous",
};
exports.AUTH_METHOD = {
    PASSWORD: "password",
    OAUTH: "oauth",
    API_KEY: "api_key",
    SESSION: "session",
    NONE: "none",
};
exports.OUTCOME = {
    ALLOWED: "allowed",
    DENIED: "denied",
    ERROR: "error",
};
exports.ACCESS_EVENT_TYPE = {
    API_REQUEST: "api.request",
    LOGIN_SUCCESS: "login.success",
    LOGIN_FAILURE: "login.failure",
    LOGOUT: "logout",
    RESOURCE_READ: "resource.read",
    MFA_CHALLENGE: "mfa.challenge",
    PASSWORD_RESET: "password.reset",
};
exports.CHANGE_TYPE = {
    USER: "user",
    SYSTEM: "system",
};
exports.OPERATION = {
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    RESTORE: "restore",
    BULK_UPDATE: "bulk_update",
};
exports.ACTIVITY_OPERATION = {
    OPEN: "open",
    EXPORT: "export",
    EXPORTED: "exported",
    UPDATE: "update",
    CREATE: "create",
    DELETE: "delete",
    VIEW: "view",
};
exports.AUDIT_DEFAULTS = {
    ANONYMOUS_ACTOR_ID: "anonymous",
    DEFAULT_RETENTION_DAYS_ACCESS: 365,
    DEFAULT_RETENTION_DAYS_CHANGE: 2555,
    DEFAULT_RETENTION_DAYS_ACTIVITY: 365,
};
//# sourceMappingURL=types.js.map