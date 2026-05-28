"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactPayload = redactPayload;
const DEFAULT_DENY = new Set([
    "password",
    "password_hash",
    "token",
    "secret",
    "card_number",
    "cvv",
    "ssn",
    "tax_id",
    "dob",
]);
function redactObject(input, deny, allow) {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
        if (allow && !allow.has(k)) {
            out[k] = "[REDACTED]";
            continue;
        }
        if (deny.has(k)) {
            out[k] = "[REDACTED]";
            continue;
        }
        out[k] = v;
    }
    return out;
}
function redactPayload(entityType, input, rules) {
    if (!input)
        return undefined;
    const matched = (rules ?? []).find(rule => !rule.entityType || rule.entityType === entityType);
    const deny = new Set(DEFAULT_DENY);
    for (const field of matched?.denyFields ?? [])
        deny.add(field);
    const allow = matched?.allowFields ? new Set(matched.allowFields) : undefined;
    return redactObject(input, deny, allow);
}
//# sourceMappingURL=redact.js.map