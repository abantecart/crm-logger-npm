import { createHash } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeHash(value: string | undefined, salt: string): string | undefined {
  if (!value)
    return undefined;
  return sha256Hex(`${salt}:${value}`);
}
