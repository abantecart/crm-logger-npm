import type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  ChangeLogInput,
} from "../contracts/types";
import { ACTIVITY_OPERATION } from "../contracts/types";
import type {
  AccessLogInput as GrpcAccessLogInput,
  ActivityLogInput as GrpcActivityLogInput,
  AuditContext as GrpcAuditContext,
  ChangeLogInput as GrpcChangeLogInput,
  DriverHealth as GrpcDriverHealth,
  GetAuditHealthResponse as GrpcGetAuditHealthResponse,
  LogAccessRequest as GrpcLogAccessRequest,
  LogActivityRequest as GrpcLogActivityRequest,
  LogChangeRequest as GrpcLogChangeRequest,
} from "../generated/proto/audit/v1/audit";

export function toGrpcAuditContext(ctx: AuditContext): GrpcAuditContext {
  return {
    actorId: ctx.actorId,
    actorType: ctx.actorType,
    tenantId: ctx.tenantId,
    requestId: ctx.requestId ?? "",
    ip: ctx.ip ?? "",
    userAgent: ctx.userAgent ?? "",
    sessionId: ctx.sessionId ?? "",
    source: ctx.source ?? "",
  };
}

export function toGrpcAccessInput(input: AccessLogInput): GrpcAccessLogInput {
  return {
    eventType: input.eventType,
    route: input.route ?? "",
    statusCode: input.statusCode ?? 0,
    durationMs: input.durationMs ?? 0,
    authMethod: input.authMethod ?? "",
    outcome: input.outcome,
    meta: input.meta,
    geo: input.geo
      ? {
          country: input.geo.country ?? "",
          region: input.geo.region ?? "",
        }
      : undefined,
  };
}

export function toGrpcChangeInput(input: ChangeLogInput): GrpcChangeLogInput {
  return {
    changeType: input.changeType,
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    before: input.before,
    after: input.after,
    description: input.changeType === "user" ? input.description : "",
    systemReason: input.changeType === "system" ? input.systemReason : "",
    parentId: input.parentId ?? "",
    meta: input.meta,
  };
}

export function toGrpcActivityInput(input: ActivityLogInput): GrpcActivityLogInput {
  return {
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    activity: input.activity,
    category: input.category ?? "",
    meta: input.meta,
  };
}

export function toGrpcLogAccessRequest(ctx: AuditContext, input: AccessLogInput): GrpcLogAccessRequest {
  return { context: toGrpcAuditContext(ctx), input: toGrpcAccessInput(input) };
}

export function toGrpcLogChangeRequest(ctx: AuditContext, input: ChangeLogInput): GrpcLogChangeRequest {
  return { context: toGrpcAuditContext(ctx), input: toGrpcChangeInput(input) };
}

export function toGrpcLogActivityRequest(ctx: AuditContext, input: ActivityLogInput): GrpcLogActivityRequest {
  return { context: toGrpcAuditContext(ctx), input: toGrpcActivityInput(input) };
}

function fromGrpcAuditContext(ctx: GrpcAuditContext | undefined): AuditContext {
  return {
    actorId: ctx?.actorId ?? "",
    actorType: (ctx?.actorType ?? "anonymous") as AuditContext["actorType"],
    tenantId: ctx?.tenantId ?? "",
    requestId: ctx?.requestId || undefined,
    ip: ctx?.ip || undefined,
    userAgent: ctx?.userAgent || undefined,
    sessionId: ctx?.sessionId || undefined,
    source: ctx?.source || undefined,
  };
}

function fromGrpcAccessInput(input: GrpcAccessLogInput | undefined): AccessLogInput {
  return {
    eventType: (input?.eventType ?? "api.request") as AccessLogInput["eventType"],
    route: input?.route || undefined,
    statusCode: typeof input?.statusCode === "number" ? input.statusCode : undefined,
    durationMs: typeof input?.durationMs === "number" ? input.durationMs : undefined,
    authMethod: (input?.authMethod || undefined) as AccessLogInput["authMethod"],
    outcome: (input?.outcome ?? "error") as AccessLogInput["outcome"],
    meta: input?.meta,
    geo: input?.geo
      ? {
          country: input.geo.country || undefined,
          region: input.geo.region || undefined,
        }
      : undefined,
  };
}

function fromGrpcChangeInput(input: GrpcChangeLogInput | undefined): ChangeLogInput {
  const base = {
    changeType: (input?.changeType ?? "user") as "user" | "system",
    entityType: input?.entityType ?? "",
    entityId: input?.entityId ?? "",
    operation: (input?.operation ?? "update") as ChangeLogInput["operation"],
    before: input?.before,
    after: input?.after,
    parentId: input?.parentId || undefined,
    meta: input?.meta,
  };

  if (base.changeType === "system") {
    return {
      ...base,
      changeType: "system",
      systemReason: input?.systemReason ?? "",
    };
  }

  return {
    ...base,
    changeType: "user",
    description: input?.description ?? "",
  };
}

function fromGrpcActivityInput(input: GrpcActivityLogInput | undefined): ActivityLogInput {
  return {
    entityType: input?.entityType ?? "",
    entityId: input?.entityId ?? "",
    operation: (input?.operation || ACTIVITY_OPERATION.VIEW) as ActivityLogInput["operation"],
    activity: input?.activity ?? "",
    category: input?.category || undefined,
    meta: input?.meta,
  };
}

export function fromGrpcLogAccessRequest(request: GrpcLogAccessRequest): { context: AuditContext; input: AccessLogInput } {
  return {
    context: fromGrpcAuditContext(request.context),
    input: fromGrpcAccessInput(request.input),
  };
}

export function fromGrpcLogChangeRequest(request: GrpcLogChangeRequest): { context: AuditContext; input: ChangeLogInput } {
  return {
    context: fromGrpcAuditContext(request.context),
    input: fromGrpcChangeInput(request.input),
  };
}

export function fromGrpcLogActivityRequest(
  request: GrpcLogActivityRequest,
): { context: AuditContext; input: ActivityLogInput } {
  return {
    context: fromGrpcAuditContext(request.context),
    input: fromGrpcActivityInput(request.input),
  };
}

export function fromGrpcDriverHealth(input: GrpcDriverHealth | undefined): {
  name: string;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
} | null {
  if (!input) {
    return null;
  }
  const toNum = (value: string): number | null => {
    if (!value)
      return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  return {
    name: input.name,
    lastSuccessAt: toNum(input.lastSuccessAt),
    lastFailureAt: toNum(input.lastFailureAt),
  };
}

export function fromGrpcHealthResponse(response: GrpcGetAuditHealthResponse | null | undefined): {
  lastSuccessAt: number | null;
  failuresTotal: number;
  driver: {
    name: string;
    lastSuccessAt: number | null;
    lastFailureAt: number | null;
  } | null;
} {
  const toNum = (value: string | undefined): number | null => {
    if (!value)
      return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  return {
    lastSuccessAt: toNum(response?.lastSuccessAt),
    failuresTotal: Number(response?.failuresTotal ?? 0),
    driver: fromGrpcDriverHealth(response?.driver),
  };
}
