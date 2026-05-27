export function accessPk(tenantId: string, tsMs: number): string {
  const day = new Date(tsMs).toISOString().slice(0, 10);
  return `TENANT#${tenantId}#DAY#${day}`;
}

export function entityPk(entityType: string, entityId: string): string {
  return `ENTITY#${entityType}#${entityId}`;
}

export function sortKey(tsMs: number, id: string): string {
  return `${tsMs}#${id}`;
}
