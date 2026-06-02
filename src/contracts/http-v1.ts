import type {
  AccessLogItem,
  AccessLogInput,
  ActivityLogItem,
  ActivityLogInput,
  AuditContext,
  ChangeLogItem,
  ChangeLogInput,
} from "./types";

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

export type AuditListResponseV1<TItem extends Record<string, unknown> = Record<string, unknown>> = {
  items: TItem[];
};

export type GetAccessResponseV1 = AuditListResponseV1<AccessLogItem>;
export type GetChangeResponseV1 = AuditListResponseV1<ChangeLogItem>;
export type GetActivityResponseV1 = AuditListResponseV1<ActivityLogItem>;
