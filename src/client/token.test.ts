import assert from "node:assert/strict";
import test from "node:test";
import { createServiceTokenProvider } from "./token";

type FetchCall = { url: string; body: string };

function stubFetch(
  responder: (call: FetchCall) => { status?: number; body?: unknown },
): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: unknown, init?: RequestInit): Promise<Response> => {
    const call = { url: String(input), body: String(init?.body ?? "") };
    calls.push(call);
    const { status = 200, body = { access_token: "tok", expires_in: 300 } } = responder(call);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as Response;
  }) as typeof fetch;
  return { calls, restore: () => void (globalThis.fetch = original) };
}

const baseConfig = {
  tokenEndpoint: "https://kc.example.test/protocol/openid-connect/token",
  clientId: "audit-log-service-client",
  clientSecret: "s3cret",
};

test("token provider sends a client_credentials request with the configured client", async () => {
  const { calls, restore } = stubFetch(() => ({ body: { access_token: "tok-1", expires_in: 300 } }));
  try {
    const getToken = createServiceTokenProvider({ ...baseConfig, scope: "audit:write" });
    const token = await getToken();

    assert.equal(token, "tok-1");
    assert.equal(calls.length, 1);
    const params = new URLSearchParams(calls[0].body);
    assert.equal(params.get("grant_type"), "client_credentials");
    assert.equal(params.get("client_id"), "audit-log-service-client");
    assert.equal(params.get("client_secret"), "s3cret");
    assert.equal(params.get("scope"), "audit:write");
  } finally {
    restore();
  }
});

test("token provider caches the token until it nears expiry", async () => {
  const { calls, restore } = stubFetch(() => ({ body: { access_token: "tok-cached", expires_in: 300 } }));
  try {
    const getToken = createServiceTokenProvider(baseConfig);
    const first = await getToken();
    const second = await getToken();

    assert.equal(first, "tok-cached");
    assert.equal(second, "tok-cached");
    assert.equal(calls.length, 1, "second call should be served from cache");
  } finally {
    restore();
  }
});

test("token provider refreshes once an already-expired token is cached", async () => {
  let issued = 0;
  const { calls, restore } = stubFetch(() => {
    issued += 1;
    // expires_in:0 -> token is immediately stale, the next call refreshes it.
    return { body: { access_token: `tok-${issued}`, expires_in: 0 } };
  });
  try {
    const getToken = createServiceTokenProvider(baseConfig);
    assert.equal(await getToken(), "tok-1");
    assert.equal(await getToken(), "tok-2");
    assert.equal(calls.length, 2);
  } finally {
    restore();
  }
});

test("concurrent calls share a single in-flight token request", async () => {
  const { calls, restore } = stubFetch(() => ({ body: { access_token: "tok-shared", expires_in: 300 } }));
  try {
    const getToken = createServiceTokenProvider(baseConfig);
    const [a, b, c] = await Promise.all([getToken(), getToken(), getToken()]);

    assert.equal(a, "tok-shared");
    assert.equal(b, "tok-shared");
    assert.equal(c, "tok-shared");
    assert.equal(calls.length, 1, "in-flight request should be deduped");
  } finally {
    restore();
  }
});

test("token provider surfaces a clear error on a non-2xx response", async () => {
  const { restore } = stubFetch(() => ({ status: 401, body: { error: "invalid_client" } }));
  try {
    const getToken = createServiceTokenProvider(baseConfig);
    await assert.rejects(getToken(), /audit token request failed: 401/);
  } finally {
    restore();
  }
});
