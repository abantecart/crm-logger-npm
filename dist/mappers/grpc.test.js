"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const types_1 = require("../contracts/types");
const grpc_1 = require("./grpc");
const _typeLocksOk = true;
void _typeLocksOk;
(0, node_test_1.default)("grpc mapper: access roundtrip preserves main fields", () => {
    const ctx = {
        actorId: "u1",
        actorType: "user",
        tenantId: "t1",
        requestId: "r1",
        ip: "1.2.3.4",
        userAgent: "ua",
        sessionId: "s1",
        source: "svc",
    };
    const input = {
        eventType: "api.request",
        route: "/x",
        statusCode: 201,
        durationMs: 23,
        authMethod: "oauth",
        outcome: "allowed",
        meta: { k: "v" },
        geo: { country: "US", region: "CA" },
    };
    const grpcReq = (0, grpc_1.toGrpcLogAccessRequest)(ctx, input);
    const mappedBack = (0, grpc_1.fromGrpcLogAccessRequest)(grpcReq);
    strict_1.default.deepEqual(mappedBack.context, ctx);
    strict_1.default.deepEqual(mappedBack.input, input);
});
(0, node_test_1.default)("grpc mapper: change mapping handles user/system variants", () => {
    const ctx = { actorId: "u1", actorType: "system", tenantId: "t1" };
    const systemInput = {
        changeType: "system",
        entityType: "order",
        entityId: "o1",
        operation: types_1.OPERATION.UPDATE,
        systemReason: "sync",
        before: { a: 1 },
        after: { a: 2 },
    };
    const grpcReq = (0, grpc_1.toGrpcLogChangeRequest)(ctx, systemInput);
    const mappedBack = (0, grpc_1.fromGrpcLogChangeRequest)(grpcReq);
    strict_1.default.equal(mappedBack.input.changeType, "system");
    strict_1.default.equal("systemReason" in mappedBack.input, true);
});
(0, node_test_1.default)("grpc mapper: activity mapping preserves payload", () => {
    const ctx = { actorId: "u1", actorType: "user", tenantId: "t1" };
    const input = {
        entityType: "order",
        entityId: "o1",
        operation: types_1.ACTIVITY_OPERATION.EXPORT,
        activity: "Order exported",
        category: "ops",
        meta: { a: 1 },
    };
    const grpcReq = (0, grpc_1.toGrpcLogActivityRequest)(ctx, input);
    const mappedBack = (0, grpc_1.fromGrpcLogActivityRequest)(grpcReq);
    strict_1.default.deepEqual(mappedBack.input, input);
});
(0, node_test_1.default)("grpc mapper: health response is converted to contract shape", () => {
    const out = (0, grpc_1.fromGrpcHealthResponse)({
        lastSuccessAt: "100",
        failuresTotal: "2",
        driver: {
            name: "dynamodb",
            lastSuccessAt: "90",
            lastFailureAt: "95",
        },
    });
    strict_1.default.deepEqual(out, {
        lastSuccessAt: 100,
        failuresTotal: 2,
        driver: {
            name: "dynamodb",
            lastSuccessAt: 90,
            lastFailureAt: 95,
        },
    });
});
//# sourceMappingURL=grpc.test.js.map