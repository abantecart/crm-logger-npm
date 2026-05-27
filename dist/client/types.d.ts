import type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput } from "../contracts/types";
export type { AccessLogInput, ActivityLogInput, AuditContext, AuditHealth, ChangeLogInput, };
export type AuditClientConfig = {
    target: string;
    timeoutMs?: number;
    /** @deprecated Use timeoutMs */
    requestTimeoutMs?: number;
    maxRetries?: number;
};
