import type { RedactionRule } from "./types";

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

function redactObject(input: Record<string, unknown>, deny: Set<string>, allow?: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
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

export function redactPayload(
  entityType: string,
  input: Record<string, unknown> | undefined,
  rules: RedactionRule[] | undefined,
): Record<string, unknown> | undefined {
  if (!input)
    return undefined;

  const matched = (rules ?? []).find(rule => !rule.entityType || rule.entityType === entityType);
  const deny = new Set(DEFAULT_DENY);
  for (const field of matched?.denyFields ?? [])
    deny.add(field);
  const allow = matched?.allowFields ? new Set(matched.allowFields) : undefined;

  return redactObject(input, deny, allow);
}
