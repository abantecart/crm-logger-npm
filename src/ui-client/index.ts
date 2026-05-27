import type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditHealth,
  AuditWriteResponse,
  AuditUiClientConfig,
  ChangeLogInput,
} from "./types";
import {
  ACTIVITY_OPERATION,
  ACCESS_EVENT_TYPE,
  ACTOR_TYPE,
  AUTH_METHOD,
  CHANGE_TYPE,
  OPERATION,
  OUTCOME,
} from "../contracts/types";
import { AUDIT_API_BASE_PATH } from "./types";

export type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditHealth,
  AuditWriteResponse,
  AuditUiClientConfig,
  ChangeLogInput,
};
export {
  ACTIVITY_OPERATION,
  ACCESS_EVENT_TYPE,
  ACTOR_TYPE,
  AUTH_METHOD,
  CHANGE_TYPE,
  OPERATION,
  OUTCOME,
  AUDIT_API_BASE_PATH,
};

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}${path}`;
}

function normalizeApiBasePath(input: AuditUiClientConfig["apiBasePath"]): string {
  const raw = (input ?? "").trim();
  if (!raw) {
    return "/v1";
  }
  const noSlashes = raw.replace(/^\/+|\/+$/g, "");
  return `/${noSlashes}`;
}

export class AuditUiClient {
  private readonly baseUrl: string;
  private readonly apiBasePath: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(config: AuditUiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.apiBasePath = normalizeApiBasePath(config.apiBasePath);
    this.timeoutMs = config.timeoutMs ?? 3000;
    this.maxRetries = config.maxRetries ?? 1;
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async requestOnce<T>(path: string, init: RequestInit): Promise<T> {
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

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timer);
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= this.maxRetries) {
      try {
        return await this.requestOnce<T>(path, init);
      } catch (err) {
        lastError = err;
        if (attempt >= this.maxRetries) {
          throw err;
        }
      }
      attempt += 1;
    }
    throw lastError;
  }

  logAccess(context: AuditContext, input: AccessLogInput): Promise<AuditWriteResponse> {
    return this.request<AuditWriteResponse>(`${this.apiBasePath}/audit/access`, {
      method: "POST",
      body: JSON.stringify({ context, input }),
    });
  }

  logChange(context: AuditContext, input: ChangeLogInput): Promise<AuditWriteResponse> {
    return this.request<AuditWriteResponse>(`${this.apiBasePath}/audit/change`, {
      method: "POST",
      body: JSON.stringify({ context, input }),
    });
  }

  logActivity(context: AuditContext, input: ActivityLogInput): Promise<AuditWriteResponse> {
    return this.request<AuditWriteResponse>(`${this.apiBasePath}/audit/activity`, {
      method: "POST",
      body: JSON.stringify({ context, input }),
    });
  }

  getHealth(): Promise<AuditHealth> {
    return this.request<AuditHealth>(`${this.apiBasePath}/audit/health`, { method: "GET" });
  }
}

export function createAuditHttpClient(config: AuditUiClientConfig): AuditUiClient {
  return new AuditUiClient(config);
}

/** @deprecated Use createAuditHttpClient */
export function initUiClient(config: AuditUiClientConfig): AuditUiClient {
  return createAuditHttpClient(config);
}
