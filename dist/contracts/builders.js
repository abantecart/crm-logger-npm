"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAccessItem = buildAccessItem;
exports.buildChangeItem = buildChangeItem;
exports.buildActivityItem = buildActivityItem;
const ulid_1 = require("ulid");
const keys_1 = require("./keys");
const redact_1 = require("./redact");
const hash_1 = require("./hash");
function userAgentTrim(input) {
    if (!input)
        return undefined;
    return input.slice(0, 256);
}
function normalizeStatusCode(value) {
    if (typeof value !== "number" || !Number.isFinite(value))
        return 0;
    return Math.trunc(value);
}
function normalizeDurationMs(value) {
    if (typeof value !== "number" || !Number.isFinite(value))
        return 0;
    return Math.max(0, Math.round(value));
}
function baseCommon(ctx, tsMs, id) {
    return {
        id,
        timestamp: tsMs,
        iso_timestamp: new Date(tsMs).toISOString(),
        actor_id: ctx.actorId,
        actor_type: ctx.actorType,
        tenant_id: ctx.tenantId,
        request_id: ctx.requestId ?? "",
        source: ctx.source ?? "unknown",
    };
}
function buildAccessItem(ctx, input, _config) {
    const tsMs = Date.now();
    const id = (0, ulid_1.ulid)();
    const salt = ctx.tenantId;
    return {
        pk: (0, keys_1.accessPk)(ctx.tenantId, tsMs),
        sk: (0, keys_1.sortKey)(tsMs, id),
        ...baseCommon(ctx, tsMs, id),
        ip_hash: (0, hash_1.safeHash)(ctx.ip, salt) ?? "",
        user_agent: userAgentTrim(ctx.userAgent) ?? "",
        session_id_hash: (0, hash_1.safeHash)(ctx.sessionId, salt) ?? "",
        event_type: input.eventType,
        route: input.route ?? "",
        status_code: normalizeStatusCode(input.statusCode),
        duration_ms: normalizeDurationMs(input.durationMs),
        auth_method: input.authMethod ?? "none",
        outcome: input.outcome,
        geo: input.geo ?? {},
        meta: input.meta ?? {},
    };
}
function buildDiff(before, after) {
    const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    const diff = [];
    for (const field of keys) {
        const prev = before?.[field];
        const next = after?.[field];
        if (prev !== next)
            diff.push({ field, from: prev, to: next });
    }
    return diff;
}
function buildChangeItem(ctx, input, config) {
    const tsMs = Date.now();
    const id = (0, ulid_1.ulid)();
    const before = (0, redact_1.redactPayload)(input.entityType, input.before, config?.redactionRules);
    const after = (0, redact_1.redactPayload)(input.entityType, input.after, config?.redactionRules);
    return {
        pk: (0, keys_1.entityPk)(input.entityType, input.entityId),
        sk: (0, keys_1.sortKey)(tsMs, id),
        ...baseCommon(ctx, tsMs, id),
        change_type: input.changeType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        operation: input.operation,
        before: before ?? {},
        after: after ?? {},
        diff: buildDiff(before, after),
        description: input.changeType === "user" ? input.description : "",
        system_reason: input.changeType === "system" ? input.systemReason : "",
        parent_id: input.parentId ?? "",
        meta: input.meta ?? {},
    };
}
function buildActivityItem(ctx, input, config) {
    const tsMs = Date.now();
    const id = (0, ulid_1.ulid)();
    const meta = (0, redact_1.redactPayload)(input.entityType, input.meta, config?.redactionRules);
    return {
        pk: (0, keys_1.entityPk)(input.entityType, input.entityId),
        sk: (0, keys_1.sortKey)(tsMs, id),
        ...baseCommon(ctx, tsMs, id),
        entity_type: input.entityType,
        entity_id: input.entityId,
        operation: input.operation,
        activity: input.activity,
        category: input.category ?? "",
        meta: meta ?? {},
    };
}
//# sourceMappingURL=builders.js.map