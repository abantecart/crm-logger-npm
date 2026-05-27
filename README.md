# @abantecart/crm-logger

Shared audit library (SDK) for:

- domain contracts: `@abantecart/crm-logger/contracts`
- backend gRPC client: `@abantecart/crm-logger/client`
- frontend HTTP client: `@abantecart/crm-logger/ui-client`

## Build

```bash
npm run build
```

This runs proto generation (`codegen`) and TypeScript build.

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

const audit = createAuditGrpcClient({
  target: "localhost:50051",
  // timeoutMs: 2000, // default value
  // maxRetries: 1, // default value
  // requestTimeoutMs: 2000, // legacy alias for timeoutMs
});

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

const audit = createAuditHttpClient({
  baseUrl: import.meta.env.VITE_AUDIT_LOG_BASE_URL,
  // apiBasePath: AUDIT_API_BASE_PATH.V1, // default value
  // apiBasePath: AUDIT_API_BASE_PATH.V2, // optional runtime override
  // timeoutMs: 3000, // default value
  // maxRetries: 1, // default value
  // defaultHeaders: {
  //   "x-request-source": "ui",
  // },
  // fetchImpl: fetch,
});

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

### Which one to use

- Use `@abantecart/crm-logger/client` in Node.js microservices (service-to-service via gRPC).
- Use `@abantecart/crm-logger/ui-client` in browser UI (HTTP to audit-log service).

Lifecycle note for backend gRPC client:

- Create one shared client instance per service process.
- Reuse it across handlers.
- Call `audit.close()` only on graceful shutdown.

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
- Service tests (transport + routing): `services/audit-log/test/*`

Run:

```bash
# package tests
npm test

# service tests
cd ../../audit-log
npm test
```

Notes:

- Do not use `as never` for contracts/proto conversion.
- All conversion logic should stay in `src/mappers/grpc.ts`.
- If a field is added/removed in contracts, mapper tests include compile-time shape locks and should fail until mapping is updated.
