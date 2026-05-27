"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const index_1 = require("./index");
const types_1 = require("../contracts/types");
function makeFetchRecorder() {
    const calls = [];
    const fetchImpl = (async (input, init) => {
        calls.push({ url: String(input), init: init ?? {} });
        return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true, message: "accepted" }),
        };
    });
    return { calls, fetchImpl };
}
const ctx = { actorId: "u1", actorType: "user", tenantId: "t1" };
const accessInput = { eventType: "api.request", outcome: "allowed" };
(0, node_test_1.default)("ui-client uses /v1 by default when apiBasePath is not set", async () => {
    const { calls, fetchImpl } = makeFetchRecorder();
    const client = (0, index_1.createAuditHttpClient)({
        baseUrl: "http://localhost:3011",
        fetchImpl,
    });
    await client.logAccess(ctx, accessInput);
    strict_1.default.equal(calls[0].url, "http://localhost:3011/v1/audit/access");
});
(0, node_test_1.default)("ui-client uses explicit /v2 apiBasePath", async () => {
    const { calls, fetchImpl } = makeFetchRecorder();
    const client = (0, index_1.createAuditHttpClient)({
        baseUrl: "http://localhost:3011",
        apiBasePath: "/v2",
        fetchImpl,
    });
    await client.logAccess(ctx, accessInput);
    strict_1.default.equal(calls[0].url, "http://localhost:3011/v2/audit/access");
});
(0, node_test_1.default)("ui-client normalizes apiBasePath variants", async () => {
    const cases = ["v2", "/v2/"];
    for (const apiBasePath of cases) {
        const { calls, fetchImpl } = makeFetchRecorder();
        const client = (0, index_1.createAuditHttpClient)({
            baseUrl: "http://localhost:3011/",
            apiBasePath,
            fetchImpl,
        });
        await client.getHealth();
        strict_1.default.equal(calls[0].url, "http://localhost:3011/v2/audit/health");
    }
});
(0, node_test_1.default)("ui-client falls back to /v1 for empty apiBasePath", async () => {
    const { calls, fetchImpl } = makeFetchRecorder();
    const client = (0, index_1.createAuditHttpClient)({
        baseUrl: "http://localhost:3011",
        apiBasePath: "   ",
        fetchImpl,
    });
    await client.logActivity(ctx, {
        entityType: "order",
        entityId: "o1",
        operation: types_1.ACTIVITY_OPERATION.OPEN,
        activity: "Opened order",
    });
    strict_1.default.equal(calls[0].url, "http://localhost:3011/v1/audit/activity");
});
(0, node_test_1.default)("ui-client keeps existing options working (headers + retries)", async () => {
    let attempts = 0;
    const fetchImpl = (async (_input, init) => {
        attempts += 1;
        if (attempts === 1) {
            throw new Error("temporary failure");
        }
        const headers = init?.headers;
        strict_1.default.equal(headers["x-request-source"], "ui");
        return {
            ok: true,
            status: 200,
            json: async () => ({ lastSuccessAt: 0, failuresTotal: 0, driver: null }),
        };
    });
    const client = (0, index_1.createAuditHttpClient)({
        baseUrl: "http://localhost:3011",
        apiBasePath: "/v1",
        maxRetries: 1,
        defaultHeaders: { "x-request-source": "ui" },
        fetchImpl,
    });
    await client.getHealth();
    strict_1.default.equal(attempts, 2);
});
//# sourceMappingURL=index.test.js.map