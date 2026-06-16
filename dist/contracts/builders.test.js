"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const builders_1 = require("./builders");
const types_1 = require("./types");
const baseContext = {
    actorId: "user-1",
    actorType: "user",
    tenantId: "demo",
    source: "calls-service",
};
(0, node_test_1.default)("buildActivityItem omits empty request_id", () => {
    const item = (0, builders_1.buildActivityItem)({
        ...baseContext,
        requestId: "   ",
    }, {
        entityType: "call_sessions",
        entityId: "session-1",
        operation: "incoming.received",
        activity: "Status: queued",
    });
    strict_1.default.equal("request_id" in item, false);
});
(0, node_test_1.default)("buildAccessItem preserves non-empty request_id", () => {
    const item = (0, builders_1.buildAccessItem)({
        ...baseContext,
        requestId: "req-123",
    }, {
        eventType: "api.request",
        outcome: "allowed",
    });
    strict_1.default.equal(item.request_id, "req-123");
});
(0, node_test_1.default)("buildChangeItem omits undefined request_id", () => {
    const item = (0, builders_1.buildChangeItem)(baseContext, {
        changeType: "system",
        entityType: "call_session_logs",
        entityId: "41",
        operation: types_1.OPERATION.CREATE,
        systemReason: "db-trigger",
    });
    strict_1.default.equal("request_id" in item, false);
});
//# sourceMappingURL=builders.test.js.map