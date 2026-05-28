import type { AccessLogInput, ActivityLogInput, AuditContext, ChangeLogInput } from "./types";
export type PostAccessRequestV1 = {
    context: AuditContext;
    input: AccessLogInput;
};
export type PostChangeRequestV1 = {
    context: AuditContext;
    input: ChangeLogInput;
};
export type PostActivityRequestV1 = {
    context: AuditContext;
    input: ActivityLogInput;
};
