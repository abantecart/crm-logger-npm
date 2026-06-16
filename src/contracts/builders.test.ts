import assert from "node:assert/strict";
import test from "node:test";
import { buildAccessItem, buildActivityItem, buildChangeItem } from "./builders";
import { OPERATION } from "./types";

const baseContext = {
  actorId: "user-1",
  actorType: "user" as const,
  tenantId: "demo",
  source: "calls-service",
};

test("buildActivityItem omits empty request_id", () => {
  const item = buildActivityItem(
    {
      ...baseContext,
      requestId: "   ",
    },
    {
      entityType: "call_sessions",
      entityId: "session-1",
      operation: "incoming.received",
      activity: "Status: queued",
    }
  );

  assert.equal("request_id" in item, false);
});

test("buildAccessItem preserves non-empty request_id", () => {
  const item = buildAccessItem(
    {
      ...baseContext,
      requestId: "req-123",
    },
    {
      eventType: "api.request",
      outcome: "allowed",
    }
  );

  assert.equal(item.request_id, "req-123");
});

test("buildChangeItem omits undefined request_id", () => {
  const item = buildChangeItem(
    baseContext,
    {
      changeType: "system",
      entityType: "call_session_logs",
      entityId: "41",
      operation: OPERATION.CREATE,
      systemReason: "db-trigger",
    }
  );

  assert.equal("request_id" in item, false);
});
