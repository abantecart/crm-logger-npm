import assert from "node:assert/strict";
import test from "node:test";
import { createAuditHttpClient } from "./index";
import type { AuditApiBasePathInput } from "./types";
import { ACTIVITY_OPERATION } from "../contracts/types";

type FetchCall = { url: string; init: RequestInit };

function makeFetchRecorder(): { calls: FetchCall[]; fetchImpl: typeof fetch } {
  const calls: FetchCall[] = [];
  const fetchImpl = (async (input: unknown, init?: RequestInit): Promise<Response> => {
    calls.push({ url: String(input), init: init ?? {} });
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, message: "accepted" }),
    } as Response;
  }) as typeof fetch;
  return { calls, fetchImpl };
}

const ctx = { actorId: "u1", actorType: "user" as const, tenantId: "t1" };
const accessInput = { eventType: "api.request" as const, outcome: "allowed" as const };

test("ui-client uses /v1 by default when apiBasePath is not set", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "http://localhost:3011",
    fetchImpl,
  });

  await client.logAccess(ctx, accessInput);
  assert.equal(calls[0].url, "http://localhost:3011/v1/audit/access");
});

test("ui-client uses explicit /v2 apiBasePath", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "http://localhost:3011",
    apiBasePath: "/v2",
    fetchImpl,
  });

  await client.logAccess(ctx, accessInput);
  assert.equal(calls[0].url, "http://localhost:3011/v2/audit/access");
});

test("ui-client normalizes apiBasePath variants", async () => {
  const cases: AuditApiBasePathInput[] = ["v2", "/v2/"];
  for (const apiBasePath of cases) {
    const { calls, fetchImpl } = makeFetchRecorder();
    const client = createAuditHttpClient({
      baseUrl: "http://localhost:3011/",
      apiBasePath,
      fetchImpl,
    });

    await client.getHealth();
    assert.equal(calls[0].url, "http://localhost:3011/v2/audit/health");
  }
});

test("ui-client falls back to /v1 for empty apiBasePath", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "http://localhost:3011",
    apiBasePath: "   " as unknown as AuditApiBasePathInput,
    fetchImpl,
  });

  await client.logActivity(ctx, {
    entityType: "order",
    entityId: "o1",
    operation: ACTIVITY_OPERATION.OPEN,
    activity: "Opened order",
  });
  assert.equal(calls[0].url, "http://localhost:3011/v1/audit/activity");
});

test("ui-client keeps existing options working (headers + retries)", async () => {
  let attempts = 0;
  const fetchImpl = (async (_input: unknown, init?: RequestInit): Promise<Response> => {
    attempts += 1;
    if (attempts === 1) {
      throw new Error("temporary failure");
    }
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers["x-request-source"], "ui");
    return {
      ok: true,
      status: 200,
      json: async () => ({ lastSuccessAt: 0, failuresTotal: 0, driver: null }),
    } as Response;
  }) as typeof fetch;

  const client = createAuditHttpClient({
    baseUrl: "http://localhost:3011",
    apiBasePath: "/v1",
    maxRetries: 1,
    defaultHeaders: { "x-request-source": "ui" },
    fetchImpl,
  });

  await client.getHealth();
  assert.equal(attempts, 2);
});
