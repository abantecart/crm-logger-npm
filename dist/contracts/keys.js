"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessPk = accessPk;
exports.entityPk = entityPk;
exports.sortKey = sortKey;
function accessPk(tenantId, tsMs) {
    const day = new Date(tsMs).toISOString().slice(0, 10);
    return `TENANT#${tenantId}#DAY#${day}`;
}
function entityPk(entityType, entityId) {
    return `ENTITY#${entityType}#${entityId}`;
}
function sortKey(tsMs, id) {
    return `${tsMs}#${id}`;
}
//# sourceMappingURL=keys.js.map