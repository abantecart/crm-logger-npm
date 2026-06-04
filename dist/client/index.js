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
const token_1 = require("./token");
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
    getToken;
    constructor(config) {
        this.config = config;
        this.requestTimeoutMs = config.requestTimeoutMs ?? config.timeoutMs ?? 2000;
        this.maxRetries = config.maxRetries ?? 1;
        this.getToken = resolveTokenProvider(config);
        this.client = new audit_1.AuditServiceClient(config.target, grpc_js_1.credentials.createInsecure());
    }
    /**
     * gRPC metadata carrying `authorization: Bearer <token>`. Returns empty
     * metadata when no token provider is configured (audit-log without auth),
     * so behaviour matches the previous no-auth path.
     */
    async authMetadata() {
        const metadata = new grpc_js_1.Metadata();
        if (this.getToken) {
            const token = await this.getToken();
            if (token) {
                metadata.set("authorization", `Bearer ${token}`);
            }
        }
        return metadata;
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
        const metadata = await this.authMetadata();
        await this.callWithRetry((cb) => {
            this.client.logAccess((0, grpc_1.toGrpcLogAccessRequest)(ctx, input), metadata, cb);
        }, "logAccess");
    }
    async logChange(ctx, input) {
        const metadata = await this.authMetadata();
        await this.callWithRetry((cb) => {
            this.client.logChange((0, grpc_1.toGrpcLogChangeRequest)(ctx, input), metadata, cb);
        }, "logChange");
    }
    async logActivity(ctx, input) {
        const metadata = await this.authMetadata();
        await this.callWithRetry((cb) => {
            this.client.logActivity((0, grpc_1.toGrpcLogActivityRequest)(ctx, input), metadata, cb);
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
    return new AuditLogger(resolveAuditClientConfig(config));
}
/** @deprecated Use createAuditGrpcClient */
function init(config) {
    return createAuditGrpcClient(config);
}
function parseEnvInt(name) {
    const value = process.env[name];
    if (!value) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function envString(...names) {
    for (const name of names) {
        const value = process.env[name];
        if (value && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
}
/**
 * Bearer token provider: an explicit `getToken` takes precedence, otherwise the
 * package configures client_credentials from `auth`/env. With no credentials
 * there is no provider (the client sends write calls without a token, as before).
 */
function resolveTokenProvider(config) {
    if (config.getToken) {
        const getToken = config.getToken;
        return async () => getToken();
    }
    const auth = resolveAuthConfig(config.auth);
    if (!auth) {
        return undefined;
    }
    return (0, token_1.createServiceTokenProvider)(auth);
}
function resolveAuthConfig(input = {}) {
    const clientId = input.clientId ?? envString("AUDIT_GRPC_CLIENT_ID", "KEYCLOAK_CLIENT_ID");
    const clientSecret = input.clientSecret ?? envString("AUDIT_GRPC_CLIENT_SECRET", "KEYCLOAK_CLIENT_SECRET");
    // Without a service account there is no token to mint — behave as before (no auth).
    if (!clientId || !clientSecret) {
        return undefined;
    }
    const issuerUrl = (input.issuerUrl ?? envString("KEYCLOAK_ISSUER_URL"))?.replace(/\/$/, "");
    const tokenEndpoint = input.tokenEndpoint ??
        envString("AUDIT_GRPC_TOKEN_ENDPOINT", "KEYCLOAK_TOKEN_ENDPOINT") ??
        (issuerUrl ? `${issuerUrl}/protocol/openid-connect/token` : undefined);
    if (!tokenEndpoint) {
        throw new Error("Missing audit token endpoint. Provide auth.tokenEndpoint, auth.issuerUrl, or KEYCLOAK_ISSUER_URL/KEYCLOAK_TOKEN_ENDPOINT.");
    }
    return {
        tokenEndpoint,
        clientId,
        clientSecret,
        scope: input.scope ?? envString("AUDIT_GRPC_SCOPE"),
        audience: input.audience ?? envString("AUDIT_GRPC_AUDIENCE", "KEYCLOAK_AUDIENCE"),
        allowSelfSignedTls: input.allowSelfSignedTls ?? process.env.KEYCLOAK_ALLOW_SELF_SIGNED_TLS === "true",
    };
}
function resolveAuditClientConfig(input = {}) {
    const target = input.target ?? process.env.AUDIT_GRPC_TARGET;
    if (!target) {
        throw new Error("Missing audit gRPC target. Provide config.target or AUDIT_GRPC_TARGET env variable.");
    }
    return {
        target,
        timeoutMs: input.timeoutMs ?? parseEnvInt("AUDIT_GRPC_TIMEOUT_MS"),
        requestTimeoutMs: input.requestTimeoutMs,
        maxRetries: input.maxRetries ?? parseEnvInt("AUDIT_GRPC_MAX_RETRIES"),
        auth: input.auth,
        getToken: input.getToken,
    };
}
//# sourceMappingURL=index.js.map