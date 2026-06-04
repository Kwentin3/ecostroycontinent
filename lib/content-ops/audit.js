import { AUDIT_EVENT_KEYS } from "../content-core/content-types.js";
import { insertAuditEvent, listAuditEventsForEntity, listRecentAuditEventsByKeys } from "../content-core/repository.js";

// Review journal is a render window over audit_events. Retention or cleanup is
// a separate ops concern and must not be hidden inside this read model.
export const REVIEW_JOURNAL_WINDOW_DAYS = 30;
export const REVIEW_JOURNAL_LIMIT = 8;
export const REVIEW_JOURNAL_EVENT_KEYS = Object.freeze([
  AUDIT_EVENT_KEYS.REVIEW_REQUESTED,
  AUDIT_EVENT_KEYS.OWNER_APPROVED,
  AUDIT_EVENT_KEYS.SENT_BACK_WITH_COMMENT,
  AUDIT_EVENT_KEYS.OWNER_REJECTED,
  AUDIT_EVENT_KEYS.REVIEW_SUPERSEDED,
  AUDIT_EVENT_KEYS.REVIEW_DUPLICATE_REQUESTED
]);

export async function recordAuditEvent(input, options = {}) {
  await insertAuditEvent(input, options.db ?? null);
}

export async function getAuditTimeline(entityId, options = {}) {
  return listAuditEventsForEntity(entityId, options.db ?? null);
}

export async function getReviewJournalEvents(options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  const windowDays = Number(options.windowDays ?? REVIEW_JOURNAL_WINDOW_DAYS);
  const since = new Date(now.getTime() - Math.max(1, windowDays) * 24 * 60 * 60 * 1000);

  return listRecentAuditEventsByKeys({
    eventKeys: REVIEW_JOURNAL_EVENT_KEYS,
    since,
    limit: options.limit ?? REVIEW_JOURNAL_LIMIT
  }, options.db ?? null);
}
