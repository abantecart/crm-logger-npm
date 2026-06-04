import type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditHealth,
  ChangeLogInput,
} from "../contracts/types";

export type {
  AccessLogInput,
  ActivityLogInput,
  AuditContext,
  AuditHealth,
  ChangeLogInput,
};

/**
 * Service-account credentials for the audit gRPC `client_credentials` flow.
 * The client obtains/refreshes the token and attaches it as `authorization`
 * gRPC metadata on every write call — consumers only supply credentials.
 */
export type AuditAuthConfig = {
  /** OIDC token endpoint. Defaults to `${issuerUrl}/protocol/openid-connect/token`. */
  tokenEndpoint?: string;
  /** Issuer base URL, used to derive `tokenEndpoint` when it is not set. */
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  /** Optional scope to request (e.g. the audit write scope). */
  scope?: string;
  /** Optional audience to request. */
  audience?: string;
  /** Allow self-signed TLS when fetching the token (dev only). */
  allowSelfSignedTls?: boolean;
};

export type AuditClientConfig = {
  target?: string;
  timeoutMs?: number;
  /** @deprecated Use timeoutMs */
  requestTimeoutMs?: number;
  maxRetries?: number;
  /** Service-account credentials for the client_credentials flow. */
  auth?: AuditAuthConfig;
  /**
   * Optional override that supplies the bearer token directly. When set, the
   * client uses this instead of the built-in client_credentials flow.
   */
  getToken?: () => string | undefined | Promise<string | undefined>;
};
