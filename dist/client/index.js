"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = exports.AUDIT_DEFAULTS = exports.OUTCOME = exports.OPERATION = exports.CHANGE_TYPE = exports.AUTH_METHOD = exports.ACTOR_TYPE = exports.ACCESS_EVENT_TYPE = exports.ACTIVITY_OPERATION = void 0;
exports.createAuditGrpcClient = createAuditGrpcClient;
exports.init = init;
const types_1 = require("../contracts/types");
Object.defineProperty(exports, "ACTIVITY_OPERATION", { enumerable: true, get: function () { return types_1.ACTIVITY_OPERATION; } });
Object.defineProperty(exports, "ACCESS_EVENT_TYPE", { enumerable: true, get: function () { return types_1.ACCESS_EVENT_TYPE; } });
Object.defineProperty(exports, "ACTOR_TYPE", { enumerable: true, get: function () { return types_1.ACTOR_TYPE; } });
Object.defineProperty(exports, "AUDIT_DEFAULTS", { enumerable: true, get: function () { return types_1.AUDIT_DEFAULTS; } });
Object.defineProperty(exports, "AUTH_METHOD", { enumerable: true, get: function () { return types_1.AUTH_METHOD; } });
Object.defineProperty(exports, "CHANGE_TYPE", { enumerable: true, get: function () { return types_1.CHANGE_TYPE; } });
Object.defineProperty(exports, "OPERATION", { enumerable: true, get: function () { return types_1.OPERATION; } });
Object.defineProperty(exports, "OUTCOME", { enumerable: true, get: function () { return types_1.OUTCOME; } });
const grpc_js_1 = require("@grpc/grpc-js");
const audit_1 = require("../generated/proto/audit/v1/audit");
const grpc_1 = require("../mappers/grpc");
function wait(ms) {
    return new Promise((resolveWait) => {
        setTimeout(resolveWait, ms);
    });
}
class AuditLogger {
    config;
    client;
    requestTimeoutMs;
    maxRetries;
    constructor(config) {
        this.config = config;
        this.requestTimeoutMs = config.requestTimeoutMs ?? config.timeoutMs ?? 2000;
        this.maxRetries = config.maxRetries ?? 1;
        this.client = new audit_1.AuditServiceClient(config.target, grpc_js_1.credentials.createInsecure());
    }
    async callWithRetry(fn, methodName) {
        let attempt = 0;
        while (attempt <= this.maxRetries) {
            try {
                const response = await new Promise((resolveCall, rejectCall) => {
                    const timer = setTimeout(() => {
                        rejectCall(new Error(`audit grpc timeout after ${this.requestTimeoutMs}ms`));
                    }, this.requestTimeoutMs);
                    fn((err, resp) => {
                        clearTimeout(timer);
                        if (err) {
                            rejectCall(err);
                            return;
                        }
                        resolveCall(resp);
                    });
                });
                return response;
            }
            catch (err) {
                if (attempt >= this.maxRetries) {
                    console.error("[audit-sdk] grpc call failure", { methodName, err });
                    return null;
                }
                await wait(Math.min(150 * (attempt + 1), 500));
            }
            attempt += 1;
        }
        return null;
    }
    async logAccess(ctx, input) {
        await this.callWithRetry((cb) => {
            this.client.logAccess((0, grpc_1.toGrpcLogAccessRequest)(ctx, input), cb);
        }, "logAccess");
    }
    async logChange(ctx, input) {
        await this.callWithRetry((cb) => {
            this.client.logChange((0, grpc_1.toGrpcLogChangeRequest)(ctx, input), cb);
        }, "logChange");
    }
    async logActivity(ctx, input) {
        await this.callWithRetry((cb) => {
            this.client.logActivity((0, grpc_1.toGrpcLogActivityRequest)(ctx, input), cb);
        }, "logActivity");
    }
    async getAuditHealth() {
        const response = await this.callWithRetry((cb) => {
            this.client.getAuditHealth({}, cb);
        }, "getAuditHealth");
        return (0, grpc_1.fromGrpcHealthResponse)(response);
    }
    close() {
        this.client.close();
    }
}
exports.AuditLogger = AuditLogger;
function createAuditGrpcClient(config) {
    return new AuditLogger(config);
}
/** @deprecated Use createAuditGrpcClient */
function init(config) {
    return createAuditGrpcClient(config);
}
//# sourceMappingURL=index.js.map