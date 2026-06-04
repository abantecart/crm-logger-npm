"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceTokenProvider = createServiceTokenProvider;
/** How long before expiry we treat the token as stale and refresh it. */
const EXPIRY_SKEW_MS = 15_000;
/** Fallback TTL used when Keycloak does not return `expires_in`. */
const DEFAULT_TTL_SEC = 60;
function createServiceTokenProvider(config) {
    let cache = null;
    // Single-flight: concurrent write calls must not hit Keycloak in a burst.
    let inflight = null;
    async function fetchToken() {
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
        const body = (await response.json());
        if (!body.access_token) {
            throw new Error("audit token request failed: access_token missing in response");
        }
        const ttlSec = typeof body.expires_in === "number" ? body.expires_in : DEFAULT_TTL_SEC;
        cache = { token: body.access_token, expiresAtMs: Date.now() + ttlSec * 1000 };
        return body.access_token;
    }
    return async function getToken() {
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
//# sourceMappingURL=token.js.map