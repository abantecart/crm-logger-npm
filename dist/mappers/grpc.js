"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toGrpcAuditContext = toGrpcAuditContext;
exports.toGrpcAccessInput = toGrpcAccessInput;
exports.toGrpcChangeInput = toGrpcChangeInput;
exports.toGrpcActivityInput = toGrpcActivityInput;
exports.toGrpcLogAccessRequest = toGrpcLogAccessRequest;
exports.toGrpcLogChangeRequest = toGrpcLogChangeRequest;
exports.toGrpcLogActivityRequest = toGrpcLogActivityRequest;
exports.fromGrpcLogAccessRequest = fromGrpcLogAccessRequest;
exports.fromGrpcLogChangeRequest = fromGrpcLogChangeRequest;
exports.fromGrpcLogActivityRequest = fromGrpcLogActivityRequest;
exports.fromGrpcDriverHealth = fromGrpcDriverHealth;
exports.fromGrpcHealthResponse = fromGrpcHealthResponse;
const types_1 = require("../contracts/types");
function toGrpcAuditContext(ctx) {
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
function toGrpcAccessInput(input) {
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
function toGrpcChangeInput(input) {
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
function toGrpcActivityInput(input) {
    return {
        entityType: input.entityType,
        entityId: input.entityId,
        operation: input.operation,
        activity: input.activity,
        category: input.category ?? "",
        meta: input.meta,
    };
}
function toGrpcLogAccessRequest(ctx, input) {
    return { context: toGrpcAuditContext(ctx), input: toGrpcAccessInput(input) };
}
function toGrpcLogChangeRequest(ctx, input) {
    return { context: toGrpcAuditContext(ctx), input: toGrpcChangeInput(input) };
}
function toGrpcLogActivityRequest(ctx, input) {
    return { context: toGrpcAuditContext(ctx), input: toGrpcActivityInput(input) };
}
function fromGrpcAuditContext(ctx) {
    return {
        actorId: ctx?.actorId ?? "",
        actorType: (ctx?.actorType ?? "anonymous"),
        tenantId: ctx?.tenantId ?? "",
        requestId: ctx?.requestId || undefined,
        ip: ctx?.ip || undefined,
        userAgent: ctx?.userAgent || undefined,
        sessionId: ctx?.sessionId || undefined,
        source: ctx?.source || undefined,
    };
}
function fromGrpcAccessInput(input) {
    return {
        eventType: (input?.eventType ?? "api.request"),
        route: input?.route || undefined,
        statusCode: typeof input?.statusCode === "number" ? input.statusCode : undefined,
        durationMs: typeof input?.durationMs === "number" ? input.durationMs : undefined,
        authMethod: (input?.authMethod || undefined),
        outcome: (input?.outcome ?? "error"),
        meta: input?.meta,
        geo: input?.geo
            ? {
                country: input.geo.country || undefined,
                region: input.geo.region || undefined,
            }
            : undefined,
    };
}
function fromGrpcChangeInput(input) {
    const base = {
        changeType: (input?.changeType ?? "user"),
        entityType: input?.entityType ?? "",
        entityId: input?.entityId ?? "",
        operation: (input?.operation ?? "update"),
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
function fromGrpcActivityInput(input) {
    return {
        entityType: input?.entityType ?? "",
        entityId: input?.entityId ?? "",
        operation: (input?.operation || types_1.ACTIVITY_OPERATION.VIEW),
        activity: input?.activity ?? "",
        category: input?.category || undefined,
        meta: input?.meta,
    };
}
function fromGrpcLogAccessRequest(request) {
    return {
        context: fromGrpcAuditContext(request.context),
        input: fromGrpcAccessInput(request.input),
    };
}
function fromGrpcLogChangeRequest(request) {
    return {
        context: fromGrpcAuditContext(request.context),
        input: fromGrpcChangeInput(request.input),
    };
}
function fromGrpcLogActivityRequest(request) {
    return {
        context: fromGrpcAuditContext(request.context),
        input: fromGrpcActivityInput(request.input),
    };
}
function fromGrpcDriverHealth(input) {
    if (!input) {
        return null;
    }
    const toNum = (value) => {
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
function fromGrpcHealthResponse(response) {
    const toNum = (value) => {
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
//# sourceMappingURL=grpc.js.map