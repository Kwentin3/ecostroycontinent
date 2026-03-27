import { insertAuditEvent, listAuditEventsForEntity } from "../content-core/repository";

export async function recordAuditEvent(input, options = {}) {
  await insertAuditEvent(input, options.db ?? null);
}

export async function getAuditTimeline(entityId, options = {}) {
  return listAuditEventsForEntity(entityId, options.db ?? null);
}
