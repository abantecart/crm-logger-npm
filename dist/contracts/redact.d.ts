import type { RedactionRule } from "./types";
export declare function redactPayload(entityType: string, input: Record<string, unknown> | undefined, rules: RedactionRule[] | undefined): Record<string, unknown> | undefined;
