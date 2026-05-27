"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContext = validateContext;
exports.validateAccessInput = validateAccessInput;
exports.validateChangeInput = validateChangeInput;
exports.validateActivityInput = validateActivityInput;
function validateContext(ctx) {
    if (!ctx.actorId || !ctx.actorType || !ctx.tenantId)
        throw new Error("audit context must include actorId, actorType, tenantId");
}
function validateAccessInput(input) {
    if (!input.eventType)
        throw new Error("access log input requires eventType");
    if (!input.outcome)
        throw new Error("access log input requires outcome");
}
function validateChangeInput(ctx, input) {
    if (!input.entityType || !input.entityId || !input.operation)
        throw new Error("change log input requires entityType, entityId, operation");
    if (input.changeType === "user") {
        if (ctx.actorType !== "user")
            throw new Error("change_type=user requires actorType=user");
        if (!input.description || input.description.trim().length < 5)
            throw new Error("change_type=user requires description >= 5 chars");
        return;
    }
    if (ctx.actorType !== "system")
        throw new Error("change_type=system requires actorType=system");
    if (!input.systemReason || input.systemReason.trim().length === 0)
        throw new Error("change_type=system requires systemReason");
}
function validateActivityInput(input) {
    if (!input.entityType || !input.entityId || !input.operation)
        throw new Error("activity log input requires entityType, entityId, operation");
    if (!input.activity || input.activity.trim().length < 5)
        throw new Error("activity log input requires activity >= 5 chars");
}
//# sourceMappingURL=validate.js.map