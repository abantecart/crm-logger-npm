"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildActorContext = buildActorContext;
function requestIdFromHeader(request) {
    const headerValue = request.headers["x-request-id"];
    if (typeof headerValue === "string" && headerValue.trim()) {
        return headerValue.trim();
    }
    if (Array.isArray(headerValue) && headerValue[0]?.trim()) {
        return headerValue[0].trim();
    }
    return request.id ?? "";
}
function defaultExtractActor(request) {
    return request.authz;
}
/**
 * Builds the actor context from a verified request. When there is no actor at
 * all (request without a token, migration, manual SQL) `actorType` is empty,
 * and the outbox forwarder records the change as `change_type=system`.
 */
function buildActorContext(request, traceId, options = {}) {
    const extract = options.extractActor ?? defaultExtractActor;
    const identity = extract(request);
    const subject = identity?.subject?.trim() || "";
    const fallbackTenant = options.defaultTenantId ?? process.env.DEFAULT_TENANT_ID ?? "default";
    return {
        userId: subject,
        actorType: subject ? "user" : "",
        tenantId: identity?.tenantId?.trim() || fallbackTenant,
        requestId: requestIdFromHeader(request),
        traceId: traceId?.trim() ? traceId.trim() : null
    };
}
//# sourceMappingURL=actor.js.map