"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const token_1 = require("./token");
function stubFetch(responder) {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input, init) => {
        const call = { url: String(input), body: String(init?.body ?? "") };
        calls.push(call);
        const { status = 200, body = { access_token: "tok", expires_in: 300 } } = responder(call);
        return {
            ok: status >= 200 && status < 300,
            status,
            json: async () => body,
            text: async () => JSON.stringify(body),
        };
    });
    return { calls, restore: () => void (globalThis.fetch = original) };
}
const baseConfig = {
    tokenEndpoint: "https://kc.example.test/protocol/openid-connect/token",
    clientId: "audit-log-service-client",
    clientSecret: "s3cret",
};
(0, node_test_1.default)("token provider sends a client_credentials request with the configured client", async () => {
    const { calls, restore } = stubFetch(() => ({ body: { access_token: "tok-1", expires_in: 300 } }));
    try {
        const getToken = (0, token_1.createServiceTokenProvider)({ ...baseConfig, scope: "audit:write" });
        const token = await getToken();
        strict_1.default.equal(token, "tok-1");
        strict_1.default.equal(calls.length, 1);
        const params = new URLSearchParams(calls[0].body);
        strict_1.default.equal(params.get("grant_type"), "client_credentials");
        strict_1.default.equal(params.get("client_id"), "audit-log-service-client");
        strict_1.default.equal(params.get("client_secret"), "s3cret");
        strict_1.default.equal(params.get("scope"), "audit:write");
    }
    finally {
        restore();
    }
});
(0, node_test_1.default)("token provider caches the token until it nears expiry", async () => {
    const { calls, restore } = stubFetch(() => ({ body: { access_token: "tok-cached", expires_in: 300 } }));
    try {
        const getToken = (0, token_1.createServiceTokenProvider)(baseConfig);
        const first = await getToken();
        const second = await getToken();
        strict_1.default.equal(first, "tok-cached");
        strict_1.default.equal(second, "tok-cached");
        strict_1.default.equal(calls.length, 1, "second call should be served from cache");
    }
    finally {
        restore();
    }
});
(0, node_test_1.default)("token provider refreshes once an already-expired token is cached", async () => {
    let issued = 0;
    const { calls, restore } = stubFetch(() => {
        issued += 1;
        // expires_in:0 -> token is immediately stale, the next call refreshes it.
        return { body: { access_token: `tok-${issued}`, expires_in: 0 } };
    });
    try {
        const getToken = (0, token_1.createServiceTokenProvider)(baseConfig);
        strict_1.default.equal(await getToken(), "tok-1");
        strict_1.default.equal(await getToken(), "tok-2");
        strict_1.default.equal(calls.length, 2);
    }
    finally {
        restore();
    }
});
(0, node_test_1.default)("concurrent calls share a single in-flight token request", async () => {
    const { calls, restore } = stubFetch(() => ({ body: { access_token: "tok-shared", expires_in: 300 } }));
    try {
        const getToken = (0, token_1.createServiceTokenProvider)(baseConfig);
        const [a, b, c] = await Promise.all([getToken(), getToken(), getToken()]);
        strict_1.default.equal(a, "tok-shared");
        strict_1.default.equal(b, "tok-shared");
        strict_1.default.equal(c, "tok-shared");
        strict_1.default.equal(calls.length, 1, "in-flight request should be deduped");
    }
    finally {
        restore();
    }
});
(0, node_test_1.default)("token provider surfaces a clear error on a non-2xx response", async () => {
    const { restore } = stubFetch(() => ({ status: 401, body: { error: "invalid_client" } }));
    try {
        const getToken = (0, token_1.createServiceTokenProvider)(baseConfig);
        await strict_1.default.rejects(getToken(), /audit token request failed: 401/);
    }
    finally {
        restore();
    }
});
//# sourceMappingURL=token.test.js.map