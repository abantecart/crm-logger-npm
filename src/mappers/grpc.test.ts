import assert from "node:assert/strict";
import test from "node:test";
import type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  ChangeLogInput,
  SystemChangeLogInput,
  UserChangeLogInput,
} from "../contracts/types";
import { ACTIVITY_OPERATION, OPERATION } from "../contracts/types";
import {
  fromGrpcHealthResponse,
  fromGrpcLogAccessRequest,
  fromGrpcLogActivityRequest,
  fromGrpcLogChangeRequest,
  toGrpcLogAccessRequest,
  toGrpcLogActivityRequest,
  toGrpcLogChangeRequest,
} from "./grpc";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type AssertTrue<T extends true> = T;

// Compile-time shape locks for contracts. If a field is added/removed, build fails here.
type _AccessKeysLock = AssertTrue<Equal<
  keyof AccessLogInput,
  "eventType" | "route" | "statusCode" | "durationMs" | "authMethod" | "outcome" | "meta" | "geo"
>>;
type _ActivityKeysLock = AssertTrue<Equal<
  keyof ActivityLogInput,
  "entityType" | "entityId" | "operation" | "activity" | "category" | "meta"
>>;
type _ContextKeysLock = AssertTrue<Equal<
  keyof AuditContext,
  "actorId" | "actorType" | "tenantId" | "requestId" | "ip" | "userAgent" | "sessionId" | "source"
>>;
type _ChangeKeysLock = AssertTrue<Equal<
  keyof ChangeLogInput,
  "changeType" | "entityType" | "entityId" | "operation" | "before" | "after" | "parentId" | "meta"
>>;
type _UserChangeKeysLock = AssertTrue<Equal<
  keyof UserChangeLogInput,
  "changeType" | "entityType" | "entityId" | "operation" | "before" | "after" | "description" | "parentId" | "meta"
>>;
type _SystemChangeKeysLock = AssertTrue<Equal<
  keyof SystemChangeLogInput,
  "changeType" | "entityType" | "entityId" | "operation" | "before" | "after" | "systemReason" | "parentId" | "meta"
>>;

type _AllLocks =
  _AccessKeysLock |
  _ActivityKeysLock |
  _ContextKeysLock |
  _ChangeKeysLock |
  _UserChangeKeysLock |
  _SystemChangeKeysLock;
const _typeLocksOk: _AllLocks = true;
void _typeLocksOk;

test("grpc mapper: access roundtrip preserves main fields", () => {
  const ctx: AuditContext = {
    actorId: "u1",
    actorType: "user",
    tenantId: "t1",
    requestId: "r1",
    ip: "1.2.3.4",
    userAgent: "ua",
    sessionId: "s1",
    source: "svc",
  };
  const input: AccessLogInput = {
    eventType: "api.request",
    route: "/x",
    statusCode: 201,
    durationMs: 23,
    authMethod: "oauth",
    outcome: "allowed",
    meta: { k: "v" },
    geo: { country: "US", region: "CA" },
  };

  const grpcReq = toGrpcLogAccessRequest(ctx, input);
  const mappedBack = fromGrpcLogAccessRequest(grpcReq);

  assert.deepEqual(mappedBack.context, ctx);
  assert.deepEqual(mappedBack.input, input);
});

test("grpc mapper: change mapping handles user/system variants", () => {
  const ctx: AuditContext = { actorId: "u1", actorType: "system", tenantId: "t1" };
  const systemInput: ChangeLogInput = {
    changeType: "system",
    entityType: "order",
    entityId: "o1",
    operation: OPERATION.UPDATE,
    systemReason: "sync",
    before: { a: 1 },
    after: { a: 2 },
  };

  const grpcReq = toGrpcLogChangeRequest(ctx, systemInput);
  const mappedBack = fromGrpcLogChangeRequest(grpcReq);

  assert.equal(mappedBack.input.changeType, "system");
  assert.equal("systemReason" in mappedBack.input, true);
});

test("grpc mapper: activity mapping preserves payload", () => {
  const ctx: AuditContext = { actorId: "u1", actorType: "user", tenantId: "t1" };
  const input: ActivityLogInput = {
    entityType: "order",
    entityId: "o1",
    operation: ACTIVITY_OPERATION.EXPORT,
    activity: "Order exported",
    category: "ops",
    meta: { a: 1 },
  };

  const grpcReq = toGrpcLogActivityRequest(ctx, input);
  const mappedBack = fromGrpcLogActivityRequest(grpcReq);

  assert.deepEqual(mappedBack.input, input);
});

test("grpc mapper: activity mapping preserves arbitrary string operations", () => {
  const ctx: AuditContext = { actorId: "u1", actorType: "user", tenantId: "t1" };
  const input: ActivityLogInput = {
    entityType: "call_sessions",
    entityId: "session-1",
    operation: "incoming.received",
    activity: "Status: queued",
    category: undefined,
    meta: { routeReason: "inbound" },
  };

  const grpcReq = toGrpcLogActivityRequest(ctx, input);
  const mappedBack = fromGrpcLogActivityRequest(grpcReq);

  assert.deepEqual(mappedBack.input, input);
});

test("grpc mapper: health response is converted to contract shape", () => {
  const out = fromGrpcHealthResponse({
    lastSuccessAt: "100",
    failuresTotal: "2",
    driver: {
      name: "dynamodb",
      lastSuccessAt: "90",
      lastFailureAt: "95",
    },
  });

  assert.deepEqual(out, {
    lastSuccessAt: 100,
    failuresTotal: 2,
    driver: {
      name: "dynamodb",
      lastSuccessAt: 90,
      lastFailureAt: 95,
    },
  });
});
