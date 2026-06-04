/** HTTP-style header bag (Fastify, Node http, etc.). */
export type HeaderValue = string | string[] | undefined;
export type HeaderBag = Record<string, HeaderValue>;

/** Minimal request shape the actor/trace helpers need (framework-agnostic). */
export interface RequestLike {
  headers: HeaderBag;
  /** Per-request id (e.g. Fastify `request.id`); used as a request_id fallback. */
  id?: string;
}

/** Verified authorization context attached to the request by the auth layer. */
export interface AuthzLike {
  subject?: string;
  tenantId?: string;
}

/** Request carrying an optional verified authorization context. */
export interface ActorRequestLike extends RequestLike {
  authz?: AuthzLike;
}

/**
 * Who initiated the write. Propagated into `audit_outbox` through the `app.*`
 * Postgres session variables (see `runWithActor`).
 */
export interface ActorContext {
  userId: string;
  actorType: string;
  tenantId: string;
  requestId: string;
  traceId: string | null;
}

/** An `audit_outbox` row (bigint columns come back as strings from node-pg). */
export interface OutboxRow {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: string; // INSERT | UPDATE | DELETE
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  actor_id: string;
  actor_type: string;
  tenant_id: string;
  request_id: string;
  trace_id: string | null;
  txid: string;
  created_at: Date;
}
