import { ulid } from "ulid";
import type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditContractConfig,
  ChangeLogInput,
} from "./types";
import { accessPk, entityPk, sortKey } from "./keys";
import { redactPayload } from "./redact";
import { safeHash } from "./hash";

function userAgentTrim(input: string | undefined): string | undefined {
  if (!input)
    return undefined;
  return input.slice(0, 256);
}

function normalizeStatusCode(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    return 0;
  return Math.trunc(value);
}

function normalizeDurationMs(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    return 0;
  return Math.max(0, Math.round(value));
}

function baseCommon(ctx: AuditContext, tsMs: number, id: string): Record<string, unknown> {
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

export function buildAccessItem(
  ctx: AuditContext,
  input: AccessLogInput,
  _config?: AuditContractConfig,
): Record<string, unknown> {
  const tsMs = Date.now();
  const id = ulid();
  const salt = ctx.tenantId;

  return {
    pk: accessPk(ctx.tenantId, tsMs),
    sk: sortKey(tsMs, id),
    ...baseCommon(ctx, tsMs, id),
    ip_hash: safeHash(ctx.ip, salt) ?? "",
    user_agent: userAgentTrim(ctx.userAgent) ?? "",
    session_id_hash: safeHash(ctx.sessionId, salt) ?? "",
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

function buildDiff(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
): Array<{ field: string; from: unknown; to: unknown }> {
  const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const diff: Array<{ field: string; from: unknown; to: unknown }> = [];

  for (const field of keys) {
    const prev = before?.[field];
    const next = after?.[field];
    if (prev !== next)
      diff.push({ field, from: prev, to: next });
  }

  return diff;
}

export function buildChangeItem(
  ctx: AuditContext,
  input: ChangeLogInput,
  config?: AuditContractConfig,
): Record<string, unknown> {
  const tsMs = Date.now();
  const id = ulid();
  const before = redactPayload(input.entityType, input.before, config?.redactionRules);
  const after = redactPayload(input.entityType, input.after, config?.redactionRules);

  return {
    pk: entityPk(input.entityType, input.entityId),
    sk: sortKey(tsMs, id),
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

export function buildActivityItem(
  ctx: AuditContext,
  input: ActivityLogInput,
  config?: AuditContractConfig,
): Record<string, unknown> {
  const tsMs = Date.now();
  const id = ulid();
  const meta = redactPayload(input.entityType, input.meta, config?.redactionRules);

  return {
    pk: entityPk(input.entityType, input.entityId),
    sk: sortKey(tsMs, id),
    ...baseCommon(ctx, tsMs, id),
    entity_type: input.entityType,
    entity_id: input.entityId,
    operation: input.operation,
    activity: input.activity,
    category: input.category ?? "",
    meta: meta ?? {},
  };
}
