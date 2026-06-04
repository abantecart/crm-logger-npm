# @abantecart/crm-logger

Audit logger SDK package for:

- domain contracts: `@abantecart/crm-logger/contracts`
- backend gRPC client: `@abantecart/crm-logger/client`
- frontend HTTP client: `@abantecart/crm-logger/ui-client`
- DB change capture (transactional outbox): `@abantecart/crm-logger/outbox`
- outbox DB migration SQL: `@abantecart/crm-logger/sql`

> Consumers on `moduleResolution: "node"` (node10) cannot resolve subpath export
> conditions; import via the dist path instead, e.g.
> `@abantecart/crm-logger/dist/outbox/index.js`.

## Contracts

```ts
import type { AuditContext, ActivityLogInput } from "@abantecart/crm-logger/contracts";
```

## Usage

### Microservices (Backend gRPC SDK)

```ts
import {
  ACTIVITY_OPERATION,
  ACCESS_EVENT_TYPE,
  ACTOR_TYPE,
  AUTH_METHOD,
  CHANGE_TYPE,
  OPERATION,
  OUTCOME,
  createAuditGrpcClient,
} from "@abantecart/crm-logger/client";

const audit = createAuditGrpcClient();

audit.logAccess(
  {
    actorId: "u1",
    actorType: ACTOR_TYPE.USER,
    tenantId: "t1",
    requestId: "req-1",
    ip: "127.0.0.1",
    userAgent: "service-a/1.0",
    sessionId: "sess-1",
    source: "service-a",
  },
  {
    eventType: ACCESS_EVENT_TYPE.API_REQUEST,
    route: "GET /v1/orders",
    statusCode: 200,
    durationMs: 42,
    authMethod: AUTH_METHOD.API_KEY,
    outcome: OUTCOME.ALLOWED,
    meta: { module: "orders" },
    geo: { country: "US", region: "CA" },
  }
);

audit.logChange(
  { actorId: "system", actorType: ACTOR_TYPE.SYSTEM, tenantId: "t1", source: "service-a" },
  {
    changeType: CHANGE_TYPE.SYSTEM,
    entityType: "order",
    entityId: "ord-1",
    operation: OPERATION.UPDATE,
    before: { status: "new" },
    after: { status: "paid" },
    systemReason: "payment webhook sync",
    parentId: "evt-1",
    meta: { provider: "stripe" },
  }
);

audit.logActivity(
  { actorId: "u1", actorType: ACTOR_TYPE.USER, tenantId: "t1", source: "service-a" },
  {
    entityType: "order",
    entityId: "ord-1",
    operation: ACTIVITY_OPERATION.EXPORT,
    activity: "Order exported to ERP",
    category: "ops",
    meta: { jobId: "job-1" },
  }
);

```

Env-based setup (no args):

```env
AUDIT_GRPC_TARGET=localhost:50051
AUDIT_GRPC_TIMEOUT_MS=2000
AUDIT_GRPC_MAX_RETRIES=1
```

`createAuditGrpcClient(config?)` options:

| Field | Type | Default / Env | Notes |
|---|---|---|---|
| `target` | `string` | `AUDIT_GRPC_TARGET` | Required via config or env |
| `timeoutMs` | `number` | `AUDIT_GRPC_TIMEOUT_MS` or `2000` | Request timeout in ms |
| `requestTimeoutMs` | `number` | none | Legacy alias for `timeoutMs` (explicit only) |
| `maxRetries` | `number` | `AUDIT_GRPC_MAX_RETRIES` or `1` | Retry count |

### UI (Frontend HTTP SDK)

```ts
import {
  ACTIVITY_OPERATION,
  ACCESS_EVENT_TYPE,
  ACTOR_TYPE,
  AUDIT_API_BASE_PATH,
  AUTH_METHOD,
  CHANGE_TYPE,
  OPERATION,
  OUTCOME,
  createAuditHttpClient,
} from "@abantecart/crm-logger/ui-client";

const audit = createAuditHttpClient();

audit.logAccess(
  {
    actorId: "u1",
    actorType: ACTOR_TYPE.USER,
    tenantId: "t1",
    requestId: "req-ui-1",
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    sessionId: "sess-ui-1",
    source: "web-ui",
  },
  {
    eventType: ACCESS_EVENT_TYPE.API_REQUEST,
    route: "GET /orders",
    statusCode: 200,
    durationMs: 75,
    authMethod: AUTH_METHOD.SESSION,
    outcome: OUTCOME.ALLOWED,
    meta: { page: "orders" },
    geo: { country: "US", region: "CA" },
  }
);

audit.logChange(
  { actorId: "u1", actorType: ACTOR_TYPE.USER, tenantId: "t1", source: "web-ui" },
  {
    changeType: CHANGE_TYPE.USER,
    entityType: "profile",
    entityId: "usr-1",
    operation: OPERATION.UPDATE,
    before: { phone: null },
    after: { phone: "+1-111-222-3333" },
    description: "User updated profile phone",
    parentId: "req-ui-1",
    meta: { section: "settings" },
  }
);

audit.logActivity(
  { actorId: "u1", actorType: ACTOR_TYPE.USER, tenantId: "t1", source: "web-ui" },
  {
    entityType: "order",
    entityId: "ord-1",
    operation: ACTIVITY_OPERATION.OPEN,
    activity: "Opened order details page",
    category: "navigation",
    meta: { page: "order-details" },
  }
);
```

`apiBasePath` is a runtime API-version switch for UI HTTP routes (for example `/v1` or `/v2`).

Env-based setup for UI client:

```env
VITE_AUDIT_LOG_BASE_URL=http://localhost:3011
VITE_AUDIT_API_BASE_PATH=/v1
VITE_AUDIT_HTTP_TIMEOUT_MS=3000
VITE_AUDIT_HTTP_MAX_RETRIES=1
```

`createAuditHttpClient(config?)` options:

| Field | Type | Default / Env | Notes |
|---|---|---|---|
| `baseUrl` | `string` | `VITE_AUDIT_LOG_BASE_URL` or `AUDIT_HTTP_BASE_URL` | Required via config or env |
| `apiBasePath` | `"/v1" \| "/v2" \| \`v${number}\`` | `VITE_AUDIT_API_BASE_PATH` or `AUDIT_HTTP_API_BASE_PATH` or `/v1` | API version prefix |
| `timeoutMs` | `number` | `VITE_AUDIT_HTTP_TIMEOUT_MS` or `AUDIT_HTTP_TIMEOUT_MS` or `3000` | Request timeout in ms |
| `maxRetries` | `number` | `VITE_AUDIT_HTTP_MAX_RETRIES` or `AUDIT_HTTP_MAX_RETRIES` or `1` | Retry count |
| `defaultHeaders` | `Record<string, string>` | `{}` | Headers merged into every request |
| `fetchImpl` | `typeof fetch` | global `fetch` | Override fetch implementation |

### Which one to use

- Use `@abantecart/crm-logger/client` in Node.js microservices (service-to-service via gRPC).
- Use `@abantecart/crm-logger/ui-client` in browser UI (HTTP to audit-log service).

Lifecycle note for backend gRPC client:

- Create one shared client instance per service process.
- Reuse it across handlers.
- Call `audit.close()` only on graceful shutdown.

## DB change capture (outbox)

Capture **every** DB change (INSERT/UPDATE/DELETE) and forward it to `audit-log`
(gRPC → DynamoDB) without putting network calls inside the request transaction.

```
HTTP write request
  → runWithActor(): BEGIN; SET LOCAL app.user_id/...; your writes; COMMIT
       └─ DB trigger writes a row into `audit_outbox` (same transaction)
  → outbox forwarder (separate process): LISTEN/NOTIFY + poll
       └─ drains audit_outbox → AuditLogger.logChange() → audit-log → DynamoDB
```

The actor ("who did it") flows through Postgres `app.*` session variables, so
even changes made by raw SQL/migrations are captured (as `change_type=system`).
Requires `pg` (peer dependency).

### 1. Apply the DB migration

Creates `audit_outbox`, the generic capture trigger, and an event trigger so
**new tables are audited automatically**. Idempotent — safe to re-run.

```ts
import { getOutboxMigrationSql } from "@abantecart/crm-logger/sql";

await pool.query(getOutboxMigrationSql());
```

> The event trigger needs SUPERUSER. In prod with a restricted role, apply the
> `CREATE EVENT TRIGGER` block separately as admin (see the SQL header).

### 2. Wrap your writes in `runWithActor`

Sets `SET LOCAL app.*` so the trigger records who made the change.

```ts
import {
  runWithActor,
  buildActorContext,
  resolveTraceId,
} from "@abantecart/crm-logger/outbox";

app.post("/customers", async (request, reply) => {
  const actor = buildActorContext(request, resolveTraceId(request));
  const created = await runWithActor(pool, actor, async (client) => {
    return client.query("insert into customers ...");
  });
  reply.send(created);
});
```

`buildActorContext` reads `request.authz` (`{ subject, tenantId }`) by default.
If your auth layer attaches the actor under a different shape, pass an extractor:

```ts
const actor = buildActorContext(request, traceId, {
  extractActor: (req) => ({ subject: req.user?.id, tenantId: req.user?.tenant }),
});
```

### 3. Run the outbox forwarder (separate long-lived process)

```ts
import { createOutboxForwarder } from "@abantecart/crm-logger/outbox";
import { createAuditGrpcClient } from "@abantecart/crm-logger/client";

const forwarder = createOutboxForwarder({
  pool,
  grpcClient: createAuditGrpcClient(), // reads AUDIT_GRPC_* env
});
await forwarder.start();
```

Wakes instantly on `pg_notify('audit_outbox')`, polls as a fallback. Delivery is
at-least-once (a crash before COMMIT re-processes the rows). Override the row →
change mapping via the `mapRow` option.

### Fastify wiring

All consumer services run on Fastify. The package stays framework-agnostic — no
Fastify plugin ships with it — so wire change-capture up like this.

> On `moduleResolution: "node"` (node10) the `/outbox` subpath does not resolve;
> import via the dist path instead: `@abantecart/crm-logger/dist/outbox/index.js`.

**Registration order.** Your auth layer must populate `request.authz`
(`{ subject, tenantId }`) before the actor is read, so register auth before the
write routes:

```ts
await app.register(keycloakAuthPlugin); // sets request.authz in a preHandler hook
await app.register(routes);             // handlers below read the actor
```

**Per-route usage.** In each write handler, build the actor and run the writes
inside `runWithActor` so the DB trigger records who made the change:

```ts
import {
  runWithActor,
  buildActorContext,
  resolveTraceId,
} from "@abantecart/crm-logger/outbox";

app.post("/customers", async (request, reply) => {
  const actor = buildActorContext(request, resolveTraceId(request));
  const created = await runWithActor(pool, actor, async (client) => {
    return client.query("insert into customers ...");
  });
  return reply.code(201).send(created);
});
```

**Optional: drop the per-route boilerplate.** If you would rather not repeat the
actor line in every handler, copy this small plugin into your service — it
decorates `request.auditActor` once. Kept in the service (not the package) so the
package does not depend on Fastify:

```ts
// src/plugins/audit-context.ts
import fp from "fastify-plugin";
import {
  buildActorContext,
  resolveTraceId,
  type ActorContext,
} from "@abantecart/crm-logger/outbox";

declare module "fastify" {
  interface FastifyRequest {
    auditActor?: ActorContext;
  }
}

// Register AFTER the auth plugin so request.authz is already set.
export default fp(async (app) => {
  app.decorateRequest("auditActor", null);
  app.addHook("preHandler", async (request) => {
    request.auditActor = buildActorContext(request, resolveTraceId(request));
  });
});
```

Then handlers shrink to:

```ts
const created = await runWithActor(pool, request.auditActor!, async (client) => {
  return client.query("insert into customers ...");
});
```

> The outbox forwarder is a **separate long-lived process** (see above), not a
> Fastify hook — keep it out of the HTTP server.

### Environment variables

Required:

- **`AUDIT_GRPC_TARGET`** — `host:port` of audit-log gRPC (forwarder + `AuditLogger`).

gRPC client tuning (optional):

- **`AUDIT_GRPC_TIMEOUT_MS`** — per-call deadline; keep low so audit never blocks
  the request path (default `2000`).
- **`AUDIT_GRPC_MAX_RETRIES`** — retries on transient gRPC failures (default `1`).

Service-account auth (optional, `client_credentials`). Omit all to send calls
without a Bearer token:

- **`AUDIT_GRPC_CLIENT_ID`** / `KEYCLOAK_CLIENT_ID`, **`AUDIT_GRPC_CLIENT_SECRET`** /
  `KEYCLOAK_CLIENT_SECRET` — service account credentials.
- **`KEYCLOAK_ISSUER_URL`** — token endpoint derived as
  `${issuer}/protocol/openid-connect/token`.
- **`AUDIT_GRPC_TOKEN_ENDPOINT`** / `KEYCLOAK_TOKEN_ENDPOINT` — explicit endpoint
  (overrides the issuer-derived one).
- **`AUDIT_GRPC_SCOPE`**, **`AUDIT_GRPC_AUDIENCE`** / `KEYCLOAK_AUDIENCE` — token
  scope/audience.
- **`KEYCLOAK_ALLOW_SELF_SIGNED_TLS`** — `true` only for local self-signed
  Keycloak. Never in prod.

Outbox forwarder (optional):

- **`OUTBOX_BATCH`** — rows claimed per drain via `FOR UPDATE SKIP LOCKED`
  (default `50`).
- **`OUTBOX_POLL_MS`** — fallback poll interval; primary trigger is LISTEN/NOTIFY
  (default `2000`).
- **`AUDIT_DEBUG_LOGS`** — `true` to log claimed/sent/deleted rows. Verbose.

Actor context (optional):

- **`DEFAULT_TENANT_ID`** — tenant used when the request carries none
  (default `"default"`).

> The forwarder needs a `pg.Pool`; its connection (`POSTGRES_HOST`/`PG*`) is
> configured by **your service**, not by this package.

See [`.env.example`](.env.example) for a copy-paste template.

## Changing Data Types (Contracts/Proto)

This package has two type layers:

- domain contracts: `src/contracts/*` (used by app logic, HTTP, UI)
- gRPC transport types: `src/generated/proto/*` (generated from `.proto`)

Mapping between them is centralized in:

- `src/mappers/grpc.ts`

When you add/remove/change fields, use this flow:

1. Update domain contracts

- Edit `src/contracts/types.ts`
- If needed, update `src/contracts/http-v1.ts`, `src/contracts/validate.ts`, `src/contracts/builders.ts`

2. Update proto schema

- Edit `proto/audit/v1/audit.proto`
- Keep backward compatibility (do not reuse old field numbers)

3. Regenerate and build

```bash
npm run codegen
npm run build
```

4. Update gRPC mapper

- Edit `src/mappers/grpc.ts`
- Update both directions as needed:
  - `toGrpc*` (contracts -> proto)
  - `fromGrpc*` (proto -> contracts)

5. Update/verify tests

- Mapper tests: `src/mappers/grpc.test.ts`
- UI client tests: `src/ui-client/index.test.ts`

Run package tests:

```bash
npm test
```

Notes:

- Do not use `as never` for contracts/proto conversion.
- All conversion logic should stay in `src/mappers/grpc.ts`.
- If a field is added/removed in contracts, mapper tests include compile-time shape locks and should fail until mapping is updated.
