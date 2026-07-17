import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reviewPagePath = new URL("../../app/admin/(console)/review/page.js", import.meta.url);
const reviewDetailPath = new URL("../../app/admin/(console)/review/[revisionId]/page.js", import.meta.url);
const reviewJournalPath = new URL("../../components/admin/ReviewJournal.js", import.meta.url);
const cssPath = new URL("../../components/admin/admin-ui.module.css", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("review landing is gallery-first with modal detail instead of hero and diff-first flow", () => {
  const source = readUtf8(reviewPagePath);
  const journalSource = readUtf8(reviewJournalPath);
  const css = readUtf8(cssPath);

  assert.match(source, /buildOwnerReviewGalleryCards/);
  assert.match(source, /buildOwnerReviewModalModel/);
  assert.match(source, /OwnerReviewDialog/);
  assert.match(source, /selectedRevisionId/);
  assert.match(source, /ENTITY_TYPES\.EQUIPMENT/);
  assert.match(source, /styles\.reviewGalleryGrid/);
  assert.match(source, /styles\.reviewGalleryCard/);
  assert.doesNotMatch(source, /styles\.reviewGalleryCardApproved/);
  assert.match(source, /styles\.reviewGalleryToolbar/);
  assert.match(source, /styles\.reviewFilterField/);
  assert.match(source, /styles\.reviewGalleryResultCount/);
  assert.match(source, /returnedFilterActive/);
  assert.match(source, /returnedFilterCount/);
  assert.match(source, /DEFAULT_REVIEW_STATUS = "needs_owner"/);
  assert.match(source, /needsOwnerFilterActive/);
  assert.match(source, /needsOwnerFilterCount/);
  assert.match(source, /aria-label="Быстрые фильтры проверки"/);
  assert.match(source, />Ждут решения</);
  assert.match(source, />Доработки SEO</);
  assert.match(source, /Ждут решения собственника/);
  assert.match(source, /name="status"\s+value=\{needsOwnerFilterActive \? "all" : "needs_owner"\}/);
  assert.match(source, /name="status"\s+value=\{returnedFilterActive \? "all" : "returned"\}/);
  assert.match(source, /getReviewJournalEvents/);
  assert.match(source, /buildReviewJournalViewModel/);
  assert.match(source, /<ReviewJournal items=\{reviewJournalItems\}/);
  assert.match(source, /aria-label="Фильтры проверки"/);
  assert.doesNotMatch(source, /styles\.reviewGalleryStatusFilters/);
  assert.doesNotMatch(source, /styles\.reviewScreenBar/);
  assert.doesNotMatch(source, /Как устроена очередь/);
  assert.match(source, /styles\.reviewModalLayout/);
  assert.match(source, /renderPagePreview/);
  assert.match(source, /renderPageGalleryCardPreview/);
  assert.match(source, /loadAdminPagePreviewPayload/);
  assert.match(source, /<PagePreview/);
  assert.match(source, /styles\.reviewPageThumbScreen/);
  assert.match(source, /styles\.reviewPageThumbSurface/);
  assert.match(source, /previewPayload\.previewLookupRecords/);
  assert.doesNotMatch(source, /PageRegistryClient\.module\.css/);
  assert.doesNotMatch(source, /RevisionDiffPanel/);
  assert.doesNotMatch(source, /styles\.reviewGalleryHeader/);
  assert.doesNotMatch(source, /<table className=\{styles\.table\}/);

  assert.match(css, /\.reviewGalleryGrid\s*\{/);
  assert.match(css, /\.reviewGalleryToolbar\s*\{/);
  assert.match(css, /\.reviewFilterField\s*\{/);
  assert.match(css, /\.reviewFilterInput,\s*\.reviewFilterSelect\s*\{/);
  assert.match(css, /\.reviewGalleryResultCount\s*\{/);
  assert.match(css, /\.reviewQuickFilters\s*\{/);
  assert.match(css, /\.reviewQuickFilterButton\s*\{/);
  assert.match(css, /\.reviewQuickFilterButton:focus-visible\s*\{/);
  assert.match(css, /\.reviewJournal\s*\{/);
  assert.match(css, /\.reviewJournalList\s*\{/);
  assert.match(css, /\.reviewJournalAction\[data-tone="warning"\]\s*\{/);
  assert.doesNotMatch(css, /\.reviewGalleryStatusFilters\s*\{/);
  assert.doesNotMatch(css, /\.reviewScreenBar\s*\{/);
  assert.match(css, /\.reviewGalleryCardApproved\s*\{/);
  assert.match(css, /\.reviewGalleryAttentionMark\s*\{/);
  assert.match(css, /\.reviewPageThumbScreen\s*\{/);
  assert.match(css, /\.reviewPageThumbSurface\s*\{/);
  assert.match(css, /\.reviewPageThumbScaler\s*\{/);
  assert.match(css, /\.reviewModalLayout\s*\{/);
  assert.match(css, /\.reviewModalEntityCard\s*\{/);

  assert.match(journalSource, /aria-labelledby="review-journal-title"/);
  assert.match(journalSource, />Журнал</);
  assert.match(journalSource, />30 дней</);
  assert.doesNotMatch(journalSource, /revisionId|fingerprint|raw/i);
});

test("review detail route now redirects back into gallery modal state", () => {
  const source = readUtf8(reviewDetailPath);

  assert.match(source, /redirect\(buildReviewRedirectUrl\(revisionId, query\)\)/);
  assert.match(source, /params\.set\("selected", revisionId\)/);
  assert.match(source, /params\.set\("preview", query\.preview\)/);
  assert.doesNotMatch(source, /PreviewViewport/);
  assert.doesNotMatch(source, /RevisionDiffPanel/);
});
