import type { ActorContext, ActorRequestLike, HeaderBag } from "./types";

/** Resolved actor identity, before it is shaped into an `ActorContext`. */
export interface ActorIdentity {
  subject?: string;
  tenantId?: string;
}

export interface BuildActorOptions {
  /**
   * Service-specific extractor for the verified actor. Defaults to reading
   * `request.authz` ({ subject, tenantId }). Override when your auth layer
   * attaches the actor under a different shape.
   */
  extractActor?: (request: ActorRequestLike) => ActorIdentity | undefined;
  /** Tenant used when neither the actor nor env carries one. */
  defaultTenantId?: string;
}

function requestIdFromHeader(request: ActorRequestLike): string {
  const headerValue: HeaderBag[string] = request.headers["x-request-id"];
  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue.trim();
  }
  if (Array.isArray(headerValue) && headerValue[0]?.trim()) {
    return headerValue[0].trim();
  }
  return request.id ?? "";
}

function defaultExtractActor(request: ActorRequestLike): ActorIdentity | undefined {
  return request.authz;
}

/**
 * Builds the actor context from a verified request. When there is no actor at
 * all (request without a token, migration, manual SQL) `actorType` is empty,
 * and the outbox forwarder records the change as `change_type=system`.
 */
export function buildActorContext(
  request: ActorRequestLike,
  traceId: string | null,
  options: BuildActorOptions = {}
): ActorContext {
  const extract = options.extractActor ?? defaultExtractActor;
  const identity = extract(request);
  const subject = identity?.subject?.trim() || "";
  const fallbackTenant =
    options.defaultTenantId ?? process.env.DEFAULT_TENANT_ID ?? "default";

  return {
    userId: subject,
    actorType: subject ? "user" : "",
    tenantId: identity?.tenantId?.trim() || fallbackTenant,
    requestId: requestIdFromHeader(request),
    traceId: traceId?.trim() ? traceId.trim() : null
  };
}
