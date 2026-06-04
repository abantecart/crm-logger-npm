import type { Pool, PoolClient } from "pg";
import type { ActorContext } from "./types";
/**
 * Runs fn in a single transaction, first setting the `app.*` variables via
 * SET LOCAL (set_config(..., is_local=true)). The `audit_capture` trigger reads
 * them within the same transaction, so the actor ends up on the outbox row.
 * SET LOCAL only lives until the end of the transaction, so the values do not
 * leak into the next request on the same pooled connection.
 */
export declare function runWithActor<T>(pool: Pool, actor: ActorContext, fn: (client: PoolClient) => Promise<T>): Promise<T>;
