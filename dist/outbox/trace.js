"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTraceId = resolveTraceId;
const node_crypto_1 = require("node:crypto");
const traceIdByRequest = new WeakMap();
function headerFirst(headers, name) {
    const v = headers[name];
    if (typeof v === "string" && v.length > 0) {
        return v;
    }
    if (Array.isArray(v) && v[0]) {
        return v[0];
    }
    return undefined;
}
function computeTraceId(request) {
    const xTrace = headerFirst(request.headers, "x-trace-id") ??
        headerFirst(request.headers, "x-correlation-id");
    if (xTrace) {
        return xTrace;
    }
    const tp = headerFirst(request.headers, "traceparent");
    if (tp) {
        const parts = tp.split("-");
        if (parts.length >= 2 && parts[1].length === 32) {
            return parts[1];
        }
    }
    return (0, node_crypto_1.randomUUID)();
}
/**
 * End-to-end trace id: x-trace-id / x-correlation-id, then traceparent (W3C),
 * otherwise one fresh UUID per request. Repeated calls for the same request
 * object return the same value (audit, DB, logs stay correlated).
 */
function resolveTraceId(request) {
    const hit = traceIdByRequest.get(request);
    if (hit !== undefined) {
        return hit;
    }
    const id = computeTraceId(request);
    traceIdByRequest.set(request, id);
    return id;
}
//# sourceMappingURL=trace.js.map