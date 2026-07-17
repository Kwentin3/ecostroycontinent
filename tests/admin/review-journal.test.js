import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { AUDIT_EVENT_KEYS, ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import { buildReviewJournalViewModel, formatReviewJournalTime } from "../../lib/admin/review-journal.js";
import { REVIEW_JOURNAL_LIMIT } from "../../lib/content-ops/audit.js";

function readUtf8(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("review journal projects audit rows into owner-facing action memory", () => {
  const rows = buildReviewJournalViewModel([
    {
      id: "audit_returned",
      eventKey: AUDIT_EVENT_KEYS.SENT_BACK_WITH_COMMENT,
      actorDisplayName: "Армен",
      entityType: ENTITY_TYPES.SERVICE,
      revisionPayload: { title: "Ремонт фасадов" },
      details: { comment: "Нужно убрать лишнее обещание и поправить запятую." },
      createdAt: "2026-06-04T09:40:00.000Z",
      revisionId: "rev_hidden",
      entityId: "entity_hidden"
    },
    {
      id: "audit_approved",
      eventKey: AUDIT_EVENT_KEYS.OWNER_APPROVED,
      actorDisplayName: "Армен",
      entityType: ENTITY_TYPES.CASE,
      revisionPayload: { title: "Кейс по складу" },
      details: { fingerprint: "technical-value" },
      createdAt: "2026-06-04T08:30:00.000Z"
    },
    {
      id: "audit_published",
      eventKey: AUDIT_EVENT_KEYS.PUBLISHED,
      actorDisplayName: "SEO",
      entityType: ENTITY_TYPES.SERVICE,
      revisionPayload: { title: "Опубликованная услуга" },
      details: {},
      createdAt: "2026-06-04T08:00:00.000Z"
    }
  ]);

  assert.equal(rows.length, 3);
  assert.equal(rows[0].actionLabel, "Возврат");
  assert.equal(rows[0].tone, "warning");
  assert.match(rows[0].summary, /Армен вернул с замечанием "Ремонт фасадов"/);
  assert.equal(rows[0].entityTypeLabel, "Услуга");
  assert.equal(rows[0].comment, "Нужно убрать лишнее обещание и поправить запятую.");
  assert.equal(rows[1].actionLabel, "Одобрено");
  assert.match(rows[1].summary, /Армен одобрил "Кейс по складу"/);
  assert.equal(rows[2].actionLabel, "Опубликовано");
  assert.match(rows[2].summary, /SEO опубликовал "Опубликованная услуга"/);

  const serialized = JSON.stringify(rows);
  assert.equal(serialized.includes("rev_hidden"), false);
  assert.equal(serialized.includes("entity_hidden"), false);
  assert.equal(serialized.includes("technical-value"), false);
});

test("review journal keeps a thirty-day render window without physical audit cleanup", () => {
  const auditSource = readUtf8("lib/content-ops/audit.js");
  const repositorySource = readUtf8("lib/content-core/repository.js");
  const migrationSource = readUtf8("db/migrations/014_review_journal_index.sql");

  assert.match(auditSource, /REVIEW_JOURNAL_WINDOW_DAYS = 30/);
  assert.match(auditSource, /REVIEW_JOURNAL_EVENT_KEYS/);
  assert.match(auditSource, /AUDIT_EVENT_KEYS\.OWNER_APPROVED/);
  assert.match(auditSource, /AUDIT_EVENT_KEYS\.SENT_BACK_WITH_COMMENT/);
  assert.match(auditSource, /AUDIT_EVENT_KEYS\.PUBLISHED/);
  assert.doesNotMatch(auditSource, /DELETE FROM audit_events/i);

  assert.match(repositorySource, /a\.created_at >= \$2/);
  assert.match(repositorySource, /LEFT JOIN app_users u ON u\.id = a\.actor_user_id/);
  assert.match(repositorySource, /LEFT JOIN content_revisions r ON r\.id = a\.revision_id/);
  assert.match(repositorySource, /LIMIT \$3/);

  assert.match(migrationSource, /audit_events_review_journal_recent_idx/);
  assert.match(migrationSource, /review_requested/);
  assert.match(migrationSource, /owner_approved/);
  assert.match(readUtf8("db/migrations/015_review_journal_published_index.sql"), /published/);
});

test("review journal time label is short and human-readable", () => {
  const label = formatReviewJournalTime("2026-06-04T09:40:00.000Z");

  assert.match(label, /12:40/);
  assert.doesNotMatch(label, /2026-06-04T09:40:00\.000Z/);
});

test("review journal uses event snapshot titles and keeps enough rows for repeated review cycles", () => {
  const [row] = buildReviewJournalViewModel([
    {
      id: "audit_approved_repeat",
      eventKey: AUDIT_EVENT_KEYS.OWNER_APPROVED,
      actorDisplayName: "Owner",
      entityType: ENTITY_TYPES.GLOBAL_SETTINGS,
      revisionPayload: { publicBrandName: "Current settings name" },
      details: {
        materialTitle: "Settings phone update",
        comment: "Phone is correct."
      },
      createdAt: "2026-06-04T09:40:00.000Z"
    }
  ]);

  assert.equal(REVIEW_JOURNAL_LIMIT, 50);
  assert.match(row.summary, /Settings phone update/);
  assert.doesNotMatch(row.summary, /Current settings name/);
  assert.equal(row.comment, "Phone is correct.");
});
