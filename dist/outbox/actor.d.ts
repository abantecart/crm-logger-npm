import type { ActorContext, ActorRequestLike } from "./types";
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
/**
 * Builds the actor context from a verified request. When there is no actor at
 * all (request without a token, migration, manual SQL) `actorType` is empty,
 * and the outbox forwarder records the change as `change_type=system`.
 */
export declare function buildActorContext(request: ActorRequestLike, traceId: string | null, options?: BuildActorOptions): ActorContext;
