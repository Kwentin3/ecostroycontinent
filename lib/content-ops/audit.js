import { insertAuditEvent, listAuditEventsForEntity } from "../content-core/repository";

export async function recordAuditEvent(input) {
  await insertAuditEvent(input);
}

export async function getAuditTimeline(entityId) {
  return listAuditEventsForEntity(entityId);
}
