/**
 * Service-account token provider for the audit gRPC client.
 *
 * Microservices authenticate to audit-log with a service account via the
 * `client_credentials` flow: the package obtains the access token, caches it
 * and refreshes it before expiry. Consumers only supply credentials (or they
 * come from env) — the implementation lives in the contract, not in every
 * calling service.
 */
export type ServiceTokenConfig = {
  /** OIDC token endpoint (`.../protocol/openid-connect/token`). */
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  /** Optional scope to request (e.g. the audit write scope). */
  scope?: string;
  /** Optional audience to request. */
  audience?: string;
  /** Allow self-signed TLS when fetching the token (dev only). */
  allowSelfSignedTls?: boolean;
};

export type TokenProvider = () => Promise<string>;

/** How long before expiry we treat the token as stale and refresh it. */
const EXPIRY_SKEW_MS = 15_000;

/** Fallback TTL used when Keycloak does not return `expires_in`. */
const DEFAULT_TTL_SEC = 60;

type TokenCache = {
  token: string;
  expiresAtMs: number;
};

export function createServiceTokenProvider(config: ServiceTokenConfig): TokenProvider {
  let cache: TokenCache | null = null;
  // Single-flight: concurrent write calls must not hit Keycloak in a burst.
  let inflight: Promise<string> | null = null;

  async function fetchToken(): Promise<string> {
    if (config.allowSelfSignedTls) {
      // Dev-only: local Keycloak with a self-signed certificate.
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const form = new URLSearchParams();
    form.set("grant_type", "client_credentials");
    form.set("client_id", config.clientId);
    form.set("client_secret", config.clientSecret);
    if (config.scope) {
      form.set("scope", config.scope);
    }
    if (config.audience) {
      form.set("audience", config.audience);
    }

    const response = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`audit token request failed: ${response.status} ${text}`.trim());
    }

    const body = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) {
      throw new Error("audit token request failed: access_token missing in response");
    }

    const ttlSec = typeof body.expires_in === "number" ? body.expires_in : DEFAULT_TTL_SEC;
    cache = { token: body.access_token, expiresAtMs: Date.now() + ttlSec * 1000 };
    return body.access_token;
  }

  return async function getToken(): Promise<string> {
    if (cache && cache.expiresAtMs > Date.now() + EXPIRY_SKEW_MS) {
      return cache.token;
    }
    if (inflight) {
      return inflight;
    }
    inflight = fetchToken().finally(() => {
      inflight = null;
    });
    return inflight;
  };
}
