import type { RequestLike } from "./types";
/**
 * End-to-end trace id: x-trace-id / x-correlation-id, then traceparent (W3C),
 * otherwise one fresh UUID per request. Repeated calls for the same request
 * object return the same value (audit, DB, logs stay correlated).
 */
export declare function resolveTraceId(request: RequestLike): string;
