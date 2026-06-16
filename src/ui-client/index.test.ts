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
    baseUrl: "https://audit.example.test",
    fetchImpl,
  });

  await client.logAccess(ctx, accessInput);
  assert.equal(calls[0].url, "https://audit.example.test/v1/audit/access");
});

test("ui-client uses explicit /v2 apiBasePath", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "https://audit.example.test",
    apiBasePath: "/v2",
    fetchImpl,
  });

  await client.logAccess(ctx, accessInput);
  assert.equal(calls[0].url, "https://audit.example.test/v2/audit/access");
});

test("ui-client normalizes apiBasePath variants", async () => {
  const cases: AuditApiBasePathInput[] = ["v2", "/v2/"];
  for (const apiBasePath of cases) {
    const { calls, fetchImpl } = makeFetchRecorder();
    const client = createAuditHttpClient({
      baseUrl: "https://audit.example.test/",
      apiBasePath,
      fetchImpl,
    });

    await client.getHealth();
    assert.equal(calls[0].url, "https://audit.example.test/v2/audit/health");
  }
});

test("ui-client falls back to /v1 for empty apiBasePath", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "https://audit.example.test",
    apiBasePath: "   " as unknown as AuditApiBasePathInput,
    fetchImpl,
  });

  await client.logActivity(ctx, {
    entityType: "order",
    entityId: "o1",
    operation: ACTIVITY_OPERATION.OPEN,
    activity: "Opened order",
  });
  assert.equal(calls[0].url, "https://audit.example.test/v1/audit/activity");
});

test("ui-client accepts arbitrary activity operations", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "https://audit.example.test",
    fetchImpl,
  });

  await client.logActivity(ctx, {
    entityType: "call_sessions",
    entityId: "session-1",
    operation: "transfer.warm_complete",
    activity: "Warm transfer completed to Alice",
  });

  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.input.operation, "transfer.warm_complete");
});

test("ui-client can read access/change/activity lists", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "https://audit.example.test",
    fetchImpl,
  });

  await client.getAccess(25);
  await client.getChange(50);
  await client.getActivity(75);

  assert.equal(calls[0].url, "https://audit.example.test/v1/audit/access?limit=25");
  assert.equal(calls[1].url, "https://audit.example.test/v1/audit/change?limit=50");
  assert.equal(calls[2].url, "https://audit.example.test/v1/audit/activity?limit=75");
});

test("ui-client supports paginated read endpoints", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "https://audit.example.test",
    fetchImpl,
  });

  await client.readAccess({ limit: 25, cursor: "cur-1", sortBy: "timestamp", sortDir: "asc" });
  await client.readChange({ sortBy: "timestamp", sortDir: "desc" });
  await client.readActivity({ limit: 5 });

  assert.equal(
    calls[0].url,
    "https://audit.example.test/v1/audit/access?limit=25&cursor=cur-1&sortBy=timestamp&sortDir=asc",
  );
  assert.equal(calls[1].url, "https://audit.example.test/v1/audit/change?sortBy=timestamp&sortDir=desc");
  assert.equal(calls[2].url, "https://audit.example.test/v1/audit/activity?limit=5");
});

test("ui-client supports count endpoints", async () => {
  const { calls, fetchImpl } = makeFetchRecorder();
  const client = createAuditHttpClient({
    baseUrl: "https://audit.example.test",
    fetchImpl,
  });

  await client.countAccess();
  await client.countChange();
  await client.countActivity();

  assert.equal(calls[0].url, "https://audit.example.test/v1/audit/access/count");
  assert.equal(calls[1].url, "https://audit.example.test/v1/audit/change/count");
  assert.equal(calls[2].url, "https://audit.example.test/v1/audit/activity/count");
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
    baseUrl: "https://audit.example.test",
    apiBasePath: "/v1",
    maxRetries: 1,
    defaultHeaders: { "x-request-source": "ui" },
    fetchImpl,
  });

  await client.getHealth();
  assert.equal(attempts, 2);
});
