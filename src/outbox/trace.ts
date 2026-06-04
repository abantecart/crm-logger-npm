import { randomUUID } from "node:crypto";
import type { HeaderBag, RequestLike } from "./types";

const traceIdByRequest = new WeakMap<object, string>();

function headerFirst(headers: HeaderBag, name: string): string | undefined {
  const v = headers[name];
  if (typeof v === "string" && v.length > 0) {
    return v;
  }
  if (Array.isArray(v) && v[0]) {
    return v[0];
  }
  return undefined;
}

function computeTraceId(request: RequestLike): string {
  const xTrace =
    headerFirst(request.headers, "x-trace-id") ??
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
  return randomUUID();
}

/**
 * End-to-end trace id: x-trace-id / x-correlation-id, then traceparent (W3C),
 * otherwise one fresh UUID per request. Repeated calls for the same request
 * object return the same value (audit, DB, logs stay correlated).
 */
export function resolveTraceId(request: RequestLike): string {
  const hit = traceIdByRequest.get(request);
  if (hit !== undefined) {
    return hit;
  }
  const id = computeTraceId(request);
  traceIdByRequest.set(request, id);
  return id;
}
