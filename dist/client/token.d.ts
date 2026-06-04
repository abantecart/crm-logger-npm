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
export declare function createServiceTokenProvider(config: ServiceTokenConfig): TokenProvider;
