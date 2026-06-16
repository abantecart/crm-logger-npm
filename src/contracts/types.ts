export const ACTOR_TYPE = {
  USER: "user",
  SYSTEM: "system",
  API_CLIENT: "api_client",
  ANONYMOUS: "anonymous",
} as const;
export type ActorType = typeof ACTOR_TYPE[keyof typeof ACTOR_TYPE];

export const AUTH_METHOD = {
  PASSWORD: "password",
  OAUTH: "oauth",
  API_KEY: "api_key",
  SESSION: "session",
  NONE: "none",
} as const;
export type AuthMethod = typeof AUTH_METHOD[keyof typeof AUTH_METHOD];

export const OUTCOME = {
  ALLOWED: "allowed",
  DENIED: "denied",
  ERROR: "error",
} as const;
export type Outcome = typeof OUTCOME[keyof typeof OUTCOME];

export const ACCESS_EVENT_TYPE = {
  API_REQUEST: "api.request",
  LOGIN_SUCCESS: "login.success",
  LOGIN_FAILURE: "login.failure",
  LOGOUT: "logout",
  RESOURCE_READ: "resource.read",
  MFA_CHALLENGE: "mfa.challenge",
  PASSWORD_RESET: "password.reset",
} as const;
export type AccessEventType = typeof ACCESS_EVENT_TYPE[keyof typeof ACCESS_EVENT_TYPE];

export const CHANGE_TYPE = {
  USER: "user",
  SYSTEM: "system",
} as const;
export type ChangeType = typeof CHANGE_TYPE[keyof typeof CHANGE_TYPE];

export const OPERATION = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  RESTORE: "restore",
  BULK_UPDATE: "bulk_update",
} as const;
export type Operation = typeof OPERATION[keyof typeof OPERATION];

export const ACTIVITY_OPERATION = {
  OPEN: "open",
  EXPORT: "export",
  EXPORTED: "exported",
  UPDATE: "update",
  CREATE: "create",
  DELETE: "delete",
  VIEW: "view",
} as const;
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
  operation: string;
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

export const AUDIT_DEFAULTS = {
  ANONYMOUS_ACTOR_ID: "anonymous",
  DEFAULT_RETENTION_DAYS_ACCESS: 365,
  DEFAULT_RETENTION_DAYS_CHANGE: 2555,
  DEFAULT_RETENTION_DAYS_ACTIVITY: 365,
} as const;
