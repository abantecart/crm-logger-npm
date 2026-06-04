import type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditHealth,
  ChangeLogInput,
} from "../contracts/types";
import {
  ACTIVITY_OPERATION,
  ACCESS_EVENT_TYPE,
  ACTOR_TYPE,
  AUDIT_DEFAULTS,
  AUTH_METHOD,
  CHANGE_TYPE,
  OPERATION,
  OUTCOME,
} from "../contracts/types";
import { credentials, Metadata } from "@grpc/grpc-js";
import {
  AuditServiceClient,
  type AuditServiceClient as AuditServiceClientType,
  type AuditWriteResponse,
  type GetAuditHealthResponse,
} from "../generated/proto/audit/v1/audit";
import {
  fromGrpcHealthResponse,
  toGrpcLogAccessRequest,
  toGrpcLogActivityRequest,
  toGrpcLogChangeRequest,
} from "../mappers/grpc";
import type { AuditAuthConfig, AuditClientConfig } from "./types";
import { createServiceTokenProvider } from "./token";

export type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditHealth,
  ChangeLogInput,
  AuditAuthConfig,
  AuditClientConfig,
};

export {
  ACTIVITY_OPERATION,
  ACCESS_EVENT_TYPE,
  ACTOR_TYPE,
  AUTH_METHOD,
  CHANGE_TYPE,
  OPERATION,
  OUTCOME,
  AUDIT_DEFAULTS,
};

function wait(ms: number): Promise<void> {
  return new Promise((resolveWait) => {
    setTimeout(resolveWait, ms);
  });
}

export class AuditLogger {
  private readonly client: AuditServiceClientType;
  private readonly requestTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly getToken?: () => Promise<string | undefined>;

  constructor(private readonly config: AuditClientConfig & { target: string }) {
    this.requestTimeoutMs = config.requestTimeoutMs ?? config.timeoutMs ?? 2000;
    this.maxRetries = config.maxRetries ?? 1;
    this.getToken = resolveTokenProvider(config);
    this.client = new AuditServiceClient(config.target, credentials.createInsecure());
  }

  /**
   * gRPC metadata carrying `authorization: Bearer <token>`. Returns empty
   * metadata when no token provider is configured (audit-log without auth),
   * so behaviour matches the previous no-auth path.
   */
  private async authMetadata(): Promise<Metadata> {
    const metadata = new Metadata();
    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        metadata.set("authorization", `Bearer ${token}`);
      }
    }
    return metadata;
  }

  private async callWithRetry<T>(
    fn: (callback: (err: unknown, response: T) => void) => void,
    methodName: string,
  ): Promise<T | null> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const response = await new Promise<T>((resolveCall, rejectCall) => {
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
      } catch (err) {
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

  async logAccess(ctx: AuditContext, input: AccessLogInput): Promise<void> {
    const metadata = await this.authMetadata();
    await this.callWithRetry<AuditWriteResponse>((cb) => {
      this.client.logAccess(toGrpcLogAccessRequest(ctx, input), metadata, cb);
    }, "logAccess");
  }

  async logChange(ctx: AuditContext, input: ChangeLogInput): Promise<void> {
    const metadata = await this.authMetadata();
    await this.callWithRetry<AuditWriteResponse>((cb) => {
      this.client.logChange(toGrpcLogChangeRequest(ctx, input), metadata, cb);
    }, "logChange");
  }

  async logActivity(ctx: AuditContext, input: ActivityLogInput): Promise<void> {
    const metadata = await this.authMetadata();
    await this.callWithRetry<AuditWriteResponse>((cb) => {
      this.client.logActivity(toGrpcLogActivityRequest(ctx, input), metadata, cb);
    }, "logActivity");
  }

  async getAuditHealth(): Promise<AuditHealth> {
    const response = await this.callWithRetry<GetAuditHealthResponse>((cb) => {
      this.client.getAuditHealth({}, cb);
    }, "getAuditHealth");

    return fromGrpcHealthResponse(response);
  }

  close(): void {
    this.client.close();
  }
}

export function createAuditGrpcClient(config?: AuditClientConfig): AuditLogger {
  return new AuditLogger(resolveAuditClientConfig(config));
}

/** @deprecated Use createAuditGrpcClient */
export function init(config?: AuditClientConfig): AuditLogger {
  return createAuditGrpcClient(config);
}

function parseEnvInt(name: string): number | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function envString(...names: string[]): string | undefined {
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
function resolveTokenProvider(
  config: AuditClientConfig,
): (() => Promise<string | undefined>) | undefined {
  if (config.getToken) {
    const getToken = config.getToken;
    return async () => getToken();
  }

  const auth = resolveAuthConfig(config.auth);
  if (!auth) {
    return undefined;
  }
  return createServiceTokenProvider(auth);
}

function resolveAuthConfig(input: AuditAuthConfig = {}):
  | { tokenEndpoint: string; clientId: string; clientSecret: string; scope?: string; audience?: string; allowSelfSignedTls: boolean }
  | undefined {
  const clientId = input.clientId ?? envString("AUDIT_GRPC_CLIENT_ID", "KEYCLOAK_CLIENT_ID");
  const clientSecret =
    input.clientSecret ?? envString("AUDIT_GRPC_CLIENT_SECRET", "KEYCLOAK_CLIENT_SECRET");
  // Without a service account there is no token to mint — behave as before (no auth).
  if (!clientId || !clientSecret) {
    return undefined;
  }

  const issuerUrl = (input.issuerUrl ?? envString("KEYCLOAK_ISSUER_URL"))?.replace(/\/$/, "");
  const tokenEndpoint =
    input.tokenEndpoint ??
    envString("AUDIT_GRPC_TOKEN_ENDPOINT", "KEYCLOAK_TOKEN_ENDPOINT") ??
    (issuerUrl ? `${issuerUrl}/protocol/openid-connect/token` : undefined);
  if (!tokenEndpoint) {
    throw new Error(
      "Missing audit token endpoint. Provide auth.tokenEndpoint, auth.issuerUrl, or KEYCLOAK_ISSUER_URL/KEYCLOAK_TOKEN_ENDPOINT.",
    );
  }

  return {
    tokenEndpoint,
    clientId,
    clientSecret,
    scope: input.scope ?? envString("AUDIT_GRPC_SCOPE"),
    audience: input.audience ?? envString("AUDIT_GRPC_AUDIENCE", "KEYCLOAK_AUDIENCE"),
    allowSelfSignedTls:
      input.allowSelfSignedTls ?? process.env.KEYCLOAK_ALLOW_SELF_SIGNED_TLS === "true",
  };
}

function resolveAuditClientConfig(input: AuditClientConfig = {}): AuditClientConfig & { target: string } {
  const target = input.target ?? process.env.AUDIT_GRPC_TARGET;
  if (!target) {
    throw new Error(
      "Missing audit gRPC target. Provide config.target or AUDIT_GRPC_TARGET env variable.",
    );
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
