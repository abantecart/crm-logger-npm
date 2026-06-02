"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditUiClient = exports.AUDIT_API_BASE_PATH = exports.OUTCOME = exports.OPERATION = exports.CHANGE_TYPE = exports.AUTH_METHOD = exports.ACTOR_TYPE = exports.ACCESS_EVENT_TYPE = exports.ACTIVITY_OPERATION = void 0;
exports.createAuditHttpClient = createAuditHttpClient;
exports.initUiClient = initUiClient;
const types_1 = require("../contracts/types");
Object.defineProperty(exports, "ACTIVITY_OPERATION", { enumerable: true, get: function () { return types_1.ACTIVITY_OPERATION; } });
Object.defineProperty(exports, "ACCESS_EVENT_TYPE", { enumerable: true, get: function () { return types_1.ACCESS_EVENT_TYPE; } });
Object.defineProperty(exports, "ACTOR_TYPE", { enumerable: true, get: function () { return types_1.ACTOR_TYPE; } });
Object.defineProperty(exports, "AUTH_METHOD", { enumerable: true, get: function () { return types_1.AUTH_METHOD; } });
Object.defineProperty(exports, "CHANGE_TYPE", { enumerable: true, get: function () { return types_1.CHANGE_TYPE; } });
Object.defineProperty(exports, "OPERATION", { enumerable: true, get: function () { return types_1.OPERATION; } });
Object.defineProperty(exports, "OUTCOME", { enumerable: true, get: function () { return types_1.OUTCOME; } });
const types_2 = require("./types");
Object.defineProperty(exports, "AUDIT_API_BASE_PATH", { enumerable: true, get: function () { return types_2.AUDIT_API_BASE_PATH; } });
function joinUrl(baseUrl, path) {
    const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${base}${path}`;
}
function normalizeApiBasePath(input) {
    const raw = (input ?? "").trim();
    if (!raw) {
        return "/v1";
    }
    const noSlashes = raw.replace(/^\/+|\/+$/g, "");
    return `/${noSlashes}`;
}
class AuditUiClient {
    baseUrl;
    apiBasePath;
    timeoutMs;
    maxRetries;
    defaultHeaders;
    fetchImpl;
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.apiBasePath = normalizeApiBasePath(config.apiBasePath);
        this.timeoutMs = config.timeoutMs ?? 3000;
        this.maxRetries = config.maxRetries ?? 1;
        this.defaultHeaders = config.defaultHeaders ?? {};
        this.fetchImpl = config.fetchImpl ?? fetch;
    }
    async requestOnce(path, init) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetchImpl(joinUrl(this.baseUrl, path), {
                ...init,
                signal: controller.signal,
                headers: {
                    "content-type": "application/json",
                    ...this.defaultHeaders,
                    ...(init.headers ?? {}),
                },
            });
            if (!response.ok) {
                throw new Error(`audit ui client request failed: ${response.status}`);
            }
            return response.json();
        }
        finally {
            clearTimeout(timer);
        }
    }
    async request(path, init) {
        let attempt = 0;
        let lastError;
        while (attempt <= this.maxRetries) {
            try {
                return await this.requestOnce(path, init);
            }
            catch (err) {
                lastError = err;
                if (attempt >= this.maxRetries) {
                    throw err;
                }
            }
            attempt += 1;
        }
        throw lastError;
    }
    logAccess(context, input) {
        return this.request(`${this.apiBasePath}/audit/access`, {
            method: "POST",
            body: JSON.stringify({ context, input }),
        });
    }
    logChange(context, input) {
        return this.request(`${this.apiBasePath}/audit/change`, {
            method: "POST",
            body: JSON.stringify({ context, input }),
        });
    }
    logActivity(context, input) {
        return this.request(`${this.apiBasePath}/audit/activity`, {
            method: "POST",
            body: JSON.stringify({ context, input }),
        });
    }
    getHealth() {
        return this.request(`${this.apiBasePath}/audit/health`, { method: "GET" });
    }
    getAccess(limit = 100) {
        return this.request(`${this.apiBasePath}/audit/access?limit=${encodeURIComponent(String(limit))}`, { method: "GET" });
    }
    getChange(limit = 100) {
        return this.request(`${this.apiBasePath}/audit/change?limit=${encodeURIComponent(String(limit))}`, { method: "GET" });
    }
    getActivity(limit = 100) {
        return this.request(`${this.apiBasePath}/audit/activity?limit=${encodeURIComponent(String(limit))}`, { method: "GET" });
    }
}
exports.AuditUiClient = AuditUiClient;
function createAuditHttpClient(config) {
    return new AuditUiClient(resolveAuditUiClientConfig(config));
}
/** @deprecated Use createAuditHttpClient */
function initUiClient(config) {
    return createAuditHttpClient(config);
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
function resolveAuditUiClientConfig(input = {}) {
    const baseUrl = input.baseUrl ?? envString("VITE_AUDIT_LOG_BASE_URL", "AUDIT_HTTP_BASE_URL");
    if (!baseUrl) {
        throw new Error("Missing audit UI base URL. Provide config.baseUrl or VITE_AUDIT_LOG_BASE_URL (or AUDIT_HTTP_BASE_URL).");
    }
    return {
        baseUrl,
        apiBasePath: (() => {
            const resolved = input.apiBasePath ??
                envString("VITE_AUDIT_API_BASE_PATH", "AUDIT_HTTP_API_BASE_PATH") ??
                types_2.AUDIT_API_BASE_PATH.V1;
            return resolved;
        })(),
        timeoutMs: input.timeoutMs ??
            parseEnvInt("VITE_AUDIT_HTTP_TIMEOUT_MS") ??
            parseEnvInt("AUDIT_HTTP_TIMEOUT_MS"),
        maxRetries: input.maxRetries ??
            parseEnvInt("VITE_AUDIT_HTTP_MAX_RETRIES") ??
            parseEnvInt("AUDIT_HTTP_MAX_RETRIES"),
        defaultHeaders: input.defaultHeaders ?? {},
        fetchImpl: input.fetchImpl ?? fetch,
    };
}
//# sourceMappingURL=index.js.map