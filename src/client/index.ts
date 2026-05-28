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
import { credentials } from "@grpc/grpc-js";
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
import type { AuditClientConfig } from "./types";

export type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditHealth,
  ChangeLogInput,
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

  constructor(private readonly config: AuditClientConfig & { target: string }) {
    this.requestTimeoutMs = config.requestTimeoutMs ?? config.timeoutMs ?? 2000;
    this.maxRetries = config.maxRetries ?? 1;
    this.client = new AuditServiceClient(config.target, credentials.createInsecure());
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
    await this.callWithRetry<AuditWriteResponse>((cb) => {
      this.client.logAccess(toGrpcLogAccessRequest(ctx, input), cb);
    }, "logAccess");
  }

  async logChange(ctx: AuditContext, input: ChangeLogInput): Promise<void> {
    await this.callWithRetry<AuditWriteResponse>((cb) => {
      this.client.logChange(toGrpcLogChangeRequest(ctx, input), cb);
    }, "logChange");
  }

  async logActivity(ctx: AuditContext, input: ActivityLogInput): Promise<void> {
    await this.callWithRetry<AuditWriteResponse>((cb) => {
      this.client.logActivity(toGrpcLogActivityRequest(ctx, input), cb);
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
  };
}
