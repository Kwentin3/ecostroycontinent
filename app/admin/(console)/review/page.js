import Link from "next/link";

import { AdminShell } from "../../../../components/admin/AdminShell";
import { OwnerReviewDialog } from "../../../../components/admin/OwnerReviewDialog";
import { PagePreview } from "../../../../components/admin/PagePreview";
import { PagePreviewThumbnail } from "../../../../components/admin/PagePreviewThumbnail";
import { PreviewViewport } from "../../../../components/admin/PreviewViewport";
import styles from "../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../lib/admin/page-helpers";
import { loadAdminPagePreviewPayload } from "../../../../lib/admin/page-preview-loader.js";
import { userCanPublishRevision } from "../../../../lib/auth/session.js";
import {
  buildOwnerReviewGalleryCards,
  buildOwnerReviewModalModel,
  filterOwnerReviewGalleryCards,
  summarizeOwnerReviewGallery
} from "../../../../lib/admin/owner-review.js";
import { getReviewQueue } from "../../../../lib/content-ops/workflow";
import { ENTITY_TYPES, PREVIEW_STATUS } from "../../../../lib/content-core/content-types.js";
import { PAGE_TYPE_LABELS } from "../../../../lib/admin/page-workspace.js";

const STATUS_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "needs_owner", label: "Требуют решения" },
  { value: "returned", label: "Возвращены" },
  { value: "approved", label: "Согласованы" },
  { value: "in_review", label: "На проверке" }
];

const TYPE_OPTIONS = [
  { value: "all", label: "Все материалы" },
  { value: ENTITY_TYPES.SERVICE, label: "Услуги" },
  { value: ENTITY_TYPES.CASE, label: "Кейсы" },
  { value: ENTITY_TYPES.EQUIPMENT, label: "Техника" },
  { value: ENTITY_TYPES.PAGE, label: "Страницы" },
  { value: ENTITY_TYPES.MEDIA_ASSET, label: "Медиа" }
];

const MODAL_PAGE_PREVIEW_ZOOM = Object.freeze({
  desktop: 0.32,
  tablet: 0.4,
  mobile: 0.58
});

function buildReviewUrl({
  query = "",
  status = "all",
  type = "all",
  selected = "",
  preview = "",
  message = "",
  error = ""
} = {}) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (status && status !== "all") {
    params.set("status", status);
  }

  if (type && type !== "all") {
    params.set("type", type);
  }

  if (selected) {
    params.set("selected", selected);
  }

  if (preview && selected) {
    params.set("preview", preview);
  }

  if (message) {
    params.set("message", message);
  }

  if (error) {
    params.set("error", error);
  }

  return params.size > 0 ? `/admin/review?${params.toString()}` : "/admin/review";
}

function cardStatusClassName(card) {
  if (card.status.key === "needs_owner") {
    return styles.reviewGalleryCardAttention;
  }

  if (card.status.key === "returned") {
    return styles.reviewGalleryCardReturned;
  }

  if (card.status.key === "approved") {
    return styles.reviewGalleryCardApproved;
  }

  return "";
}

function renderCompactSections(sections = []) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className={styles.reviewModalSections}>
      {sections.map((section) => (
        <section key={`${section.label}-${section.value}`} className={styles.reviewModalSection}>
          <span className={styles.reviewModalSectionLabel}>{section.label}</span>
          <p className={styles.reviewModalSectionValue}>{section.value}</p>
        </section>
      ))}
    </div>
  );
}

function renderCompactEntityCard(card, modalModel) {
  return (
    <section className={styles.reviewModalEntityCard}>
      <div className={styles.reviewModalEntityHero}>
        {modalModel.mediaUrl ? (
          <img src={modalModel.mediaUrl} alt={modalModel.title} className={styles.reviewModalMedia} />
        ) : (
          <div className={styles.reviewModalMediaFallback} aria-hidden="true">
            {(modalModel.title || card.entityTypeLabel).trim().slice(0, 1)}
          </div>
        )}
        <div className={styles.reviewModalMain}>
          <p className={styles.reviewModalSummary}>{modalModel.summary}</p>
          {renderCompactSections(modalModel.sections)}
        </div>
      </div>
    </section>
  );
}

function renderPageGalleryCardPreview(card, modalModel, previewPayload) {
  const previewIntro = card.previewIntro || "Карточка страницы показывает первый экран так, как его увидит посетитель.";

  if (!modalModel?.pageValue || !previewPayload?.globalSettings || card.revision.previewStatus !== PREVIEW_STATUS.RENDERABLE) {
    return (
      <div className={styles.reviewPageThumb} title={previewIntro}>
        <div className={styles.reviewPageThumbShell}>
          <div className={styles.reviewPageThumbScreen}>
            <div className={styles.reviewPageThumbBrowser}>
              <span className={styles.reviewPageThumbDot} />
              <span className={styles.reviewPageThumbDot} />
              <span className={styles.reviewPageThumbDot} />
            </div>
            <div className={styles.reviewPageThumbCanvasFallback}>
              <span className={styles.reviewPageThumbEyebrow}>{PAGE_TYPE_LABELS[card.pageType] || card.pageType}</span>
              <strong className={styles.reviewPageThumbTitle}>{card.previewTitle || card.title}</strong>
              <p className={styles.reviewPageThumbText}>{previewIntro}</p>
            </div>
          </div>
          <div className={styles.reviewPageThumbStand} aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reviewPageThumb} title={previewIntro}>
      <div className={styles.reviewPageThumbShell}>
        <div className={styles.reviewPageThumbScreen}>
          <div className={styles.reviewPageThumbBrowser}>
            <span className={styles.reviewPageThumbDot} />
            <span className={styles.reviewPageThumbDot} />
            <span className={styles.reviewPageThumbDot} />
          </div>
          <div className={styles.reviewPageThumbCanvas}>
            <div className={styles.reviewPageThumbViewport}>
              <div className={styles.reviewPageThumbScaler}>
                <div className={styles.reviewPageThumbSurface}>
                  <PagePreview
                    page={modalModel.pageValue}
                    globalSettings={previewPayload.globalSettings}
                    previewLookupRecords={previewPayload.previewLookupRecords}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.reviewPageThumbStand} aria-hidden="true" />
      </div>
    </div>
  );
}

function renderCanonicalPageGalleryCardPreview(card, modalModel, previewPayload) {
  const previewIntro = card.previewIntro || "РљР°СЂС‚РѕС‡РєР° СЃС‚СЂР°РЅРёС†С‹ РїРѕРєР°Р·С‹РІР°РµС‚ РїРµСЂРІС‹Р№ СЌРєСЂР°РЅ С‚Р°Рє, РєР°Рє РµРіРѕ СѓРІРёРґРёС‚ РїРѕСЃРµС‚РёС‚РµР»СЊ.";

  return (
    <PagePreviewThumbnail
      page={card.revision.previewStatus === PREVIEW_STATUS.RENDERABLE ? modalModel?.pageValue || null : null}
      globalSettings={previewPayload?.globalSettings || null}
      previewLookupRecords={previewPayload?.previewLookupRecords || null}
      pageTypeLabel={PAGE_TYPE_LABELS[card.pageType] || card.pageType}
      title={card.previewTitle || card.title}
      intro={previewIntro}
      live={Boolean(card.hasLivePublishedRevision)}
    />
  );
}

function renderPagePreview(card, modalModel, previewMode, search, status, type, message, error, previewPayload) {
  if (card.revision.previewStatus !== PREVIEW_STATUS.RENDERABLE) {
    return (
      <section className={styles.reviewModalPageFallback}>
        <h3 className={styles.sectionTitle}>Предпросмотр пока недоступен</h3>
        <p className={styles.reviewModalSummary}>
          Суть страницы можно проверить по вводному блоку и смысловым секциям, а замечание оставить прямо здесь.
        </p>
        {renderCompactSections(modalModel.sections)}
      </section>
    );
  }

  return (
    <PreviewViewport
      title="Превью страницы"
      hint="Переключайте устройство, чтобы быстро проверить первый экран в нужном размере."
      device={previewMode}
      zoom={MODAL_PAGE_PREVIEW_ZOOM[previewMode] || MODAL_PAGE_PREVIEW_ZOOM.desktop}
      hrefBase="/admin/review"
      searchParams={{
        q: search,
        status,
        type,
        selected: card.id,
        message,
        error
      }}
      showFrameTop={false}
      compact
    >
      <PagePreview
        page={modalModel.pageValue}
        globalSettings={previewPayload.globalSettings}
        previewLookupRecords={previewPayload.previewLookupRecords}
      />
    </PreviewViewport>
  );
}

export default async function ReviewQueuePage({ searchParams }) {
  const user = await requireReviewUser();
  const queue = await getReviewQueue();
  const query = await searchParams;
  const search = typeof query?.q === "string" ? query.q : "";
  const status = typeof query?.status === "string" ? query.status : "all";
  const type = typeof query?.type === "string" ? query.type : "all";
  const selectedRevisionId = typeof query?.selected === "string" ? query.selected : "";
  const previewMode = typeof query?.preview === "string" ? query.preview : "desktop";
  const message = typeof query?.message === "string" ? query.message : "";
  const error = typeof query?.error === "string" ? query.error : "";
  const cards = buildOwnerReviewGalleryCards(queue);
  const filteredCards = filterOwnerReviewGalleryCards(cards, {
    query: search,
    status,
    type
  });
  const summary = summarizeOwnerReviewGallery(cards);
  const selectedCard = selectedRevisionId ? cards.find((card) => card.id === selectedRevisionId) ?? null : null;
  const selectedQueueItem = selectedRevisionId ? queue.find((item) => item.revision.id === selectedRevisionId) ?? null : null;
  const selectedModal = selectedQueueItem ? buildOwnerReviewModalModel(selectedQueueItem) : null;
  const closeHref = buildReviewUrl({ query: search, status, type });
  const errorReturnTo = selectedCard
    ? buildReviewUrl({
      query: search,
      status,
      type,
      selected: selectedCard.id,
      preview: previewMode
    })
    : closeHref;
  const pageModalModels = new Map(
    queue
      .filter((item) => item.entityType === ENTITY_TYPES.PAGE)
      .map((item) => [item.revision.id, buildOwnerReviewModalModel(item)])
  );
  let pagePreviewPayload = null;
  const publishHref = selectedCard
    && userCanPublishRevision(user, selectedCard.entityType, selectedCard.revision)
    && (!selectedCard.revision.ownerReviewRequired || selectedCard.revision.ownerApprovalStatus === "approved")
    ? `/admin/revisions/${selectedCard.id}/publish`
    : "";
  const publishWaitingForOwner = selectedCard
    && userCanPublishRevision(user, selectedCard.entityType, selectedCard.revision)
    && selectedCard.revision.ownerReviewRequired
    && selectedCard.revision.ownerApprovalStatus !== "approved";

  const shouldLoadPagePreviewContext = filteredCards.some((card) => card.entityType === ENTITY_TYPES.PAGE)
    || (selectedCard?.entityType === ENTITY_TYPES.PAGE && selectedModal?.pageValue);

  if (shouldLoadPagePreviewContext) {
    pagePreviewPayload = await loadAdminPagePreviewPayload();
  }

  return (
    <AdminShell
      user={user}
      title="Проверка"
      breadcrumbs={[{ label: "Админка", href: "/admin" }, { label: "Проверка" }]}
      activeHref="/admin/review"
    >
      <div className={styles.stack}>
        {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}
        {message ? <div className={styles.statusPanelInfo}>{message}</div> : null}

        <section className={styles.reviewGalleryControls}>
          <div className={styles.reviewScreenBar}>
            <div className={styles.reviewScreenStats} aria-label="Сводка по материалам">
              <span className={styles.reviewGalleryCounter}>Всего: {summary.total}</span>
              <span className={styles.reviewGalleryCounter}>Требуют решения: {summary.byStatus.needs_owner || 0}</span>
              <span className={styles.reviewGalleryCounter}>Возвращены: {summary.byStatus.returned || 0}</span>
              <span className={styles.reviewGalleryCounter}>Согласованы: {summary.byStatus.approved || 0}</span>
            </div>
          </div>

          <form className={styles.reviewGalleryToolbar} action="/admin/review" method="get">
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Поиск</span>
              <input
                type="search"
                name="q"
                defaultValue={search}
                className={styles.input}
                placeholder="Название, описание, содержание"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Статус</span>
              <select name="status" defaultValue={status} className={styles.select}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Тип</span>
              <select name="type" defaultValue={type} className={styles.select}>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className={styles.reviewGalleryToolbarActions}>
              <button type="submit" className={styles.primaryButton}>Применить</button>
              <Link href="/admin/review" className={styles.secondaryButton}>Сбросить</Link>
            </div>
          </form>

          <div className={styles.reviewGalleryStatusFilters} role="list" aria-label="Быстрые фильтры по статусу">
            {STATUS_OPTIONS.map((option) => {
              const count = option.value === "all" ? summary.total : summary.byStatus[option.value] || 0;
              const href = buildReviewUrl({
                query: search,
                type,
                status: option.value
              });
              const active = option.value === status;

              return (
                <Link
                  key={option.value}
                  href={href}
                  scroll={false}
                  className={active ? `${styles.reviewGalleryStatusFilter} ${styles.reviewGalleryStatusFilterActive}` : styles.reviewGalleryStatusFilter}
                >
                  <span>{option.label}</span>
                  <strong>{count}</strong>
                </Link>
              );
            })}
          </div>
        </section>

        {filteredCards.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.mutedText}>По текущему фильтру материалов нет.</p>
            <Link href="/admin/review" className={styles.secondaryButton}>Показать все материалы</Link>
          </div>
        ) : (
          <section className={styles.reviewGalleryGrid} aria-label="Материалы на проверку">
            {filteredCards.map((card) => (
              <Link
                key={card.id}
                href={buildReviewUrl({
                  query: search,
                  status,
                  type,
                  selected: card.id
                })}
                scroll={false}
                className={cardStatusClassName(card) ? `${styles.reviewGalleryCard} ${cardStatusClassName(card)}` : styles.reviewGalleryCard}
              >
                <div className={styles.reviewGalleryCardTop}>
                  <div className={styles.reviewGalleryCardMeta}>
                    <span className={styles.reviewGalleryType}>{card.entityTypeLabel}</span>
                    <span className={styles.reviewGallerySubmitted}>{card.submittedAtLabel || "На проверке"}</span>
                  </div>
                  <div className={styles.reviewGallerySignals}>
                    {card.needsAttention ? <span className={styles.reviewGalleryAttentionMark} aria-label="Требует решения">!</span> : null}
                    <span className={styles.reviewGalleryStatus}>{card.status.label}</span>
                  </div>
                </div>

                <div className={styles.reviewGalleryCardPreview}>
                  {card.entityType === ENTITY_TYPES.PAGE
                    ? renderCanonicalPageGalleryCardPreview(card, pageModalModels.get(card.id) || null, pagePreviewPayload)
                    : (card.mediaUrl ? (
                      <img src={card.mediaUrl} alt={card.title} className={styles.reviewGalleryImage} />
                    ) : (
                      <div className={styles.reviewGalleryImageFallback} aria-hidden="true">
                        {(card.title || card.entityTypeLabel).trim().slice(0, 1)}
                      </div>
                    ))}
                </div>

                <div className={styles.reviewGalleryCardBody}>
                  <h3 className={styles.reviewGalleryCardTitle}>{card.title}</h3>
                  <p className={styles.reviewGalleryCardSummary}>{card.summary}</p>
                  {card.entityType !== ENTITY_TYPES.PAGE && card.facts.length > 0 ? (
                    <ul className={styles.reviewGalleryFactList}>
                      {card.facts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className={styles.reviewGalleryCardFooter}>
                  <span className={styles.reviewGalleryFooterNote}>{card.status.description}</span>
                  <span className={styles.reviewGalleryOpenHint}>Открыть</span>
                </div>
              </Link>
            ))}
          </section>
        )}

        {selectedCard && selectedModal ? (
          <OwnerReviewDialog
            closeHref={closeHref}
            eyebrow={selectedCard.entityTypeLabel}
            title={selectedModal.title}
            summary={selectedModal.summary}
            meta={[
              selectedCard.status.label,
              selectedCard.submittedAtLabel || "На проверке"
            ]}
          >
            <div className={styles.reviewModalLayout}>
              <div className={styles.reviewModalMain}>
                {selectedCard.entityType === ENTITY_TYPES.PAGE && pagePreviewPayload?.globalSettings
                  ? renderPagePreview(selectedCard, selectedModal, previewMode, search, status, type, message, error, pagePreviewPayload)
                  : renderCompactEntityCard(selectedCard, selectedModal)}
              </div>

              <section className={styles.reviewModalActionCard}>
                <p className={styles.reviewModalActionLead}>
                  Подтвердите, что материал отражает реальную услугу, кейс, страницу или медиа, и оставьте короткое замечание для SEO-специалиста.
                </p>
                <div className={styles.reviewModalActionMeta}>
                  <span className={styles.reviewGalleryStatus}>{selectedCard.status.label}</span>
                  {selectedCard.needsAttention ? (
                    <span className={styles.reviewGalleryWarning}>Нужно ваше решение</span>
                  ) : null}
                </div>

                {(user.role === "business_owner" || user.role === "superadmin") ? (
                  <form action={`/api/admin/revisions/${selectedCard.id}/owner-action`} method="post" className={styles.formGrid}>
                    <input type="hidden" name="returnTo" value={closeHref} />
                    <input type="hidden" name="errorReturnTo" value={errorReturnTo} />
                    <label className={styles.label}>
                      <span>Замечание для SEO</span>
                      <textarea
                        name="comment"
                        defaultValue={selectedCard.revision.reviewComment || ""}
                        placeholder={selectedModal.commentPlaceholder}
                      />
                    </label>
                    <div className={styles.inlineActions}>
                      <button type="submit" name="action" value="approve" className={styles.primaryButton}>Одобрить</button>
                      <button type="submit" name="action" value="send_back" className={styles.secondaryButton}>Вернуть с замечанием</button>
                      <button type="submit" name="action" value="reject" className={styles.dangerButton}>Отклонить</button>
                    </div>
                    <p className={styles.reviewModalActionNote}>
                      Если нужно доработать материал, просто опишите, что исправить. После возврата он снова появится в галерее, когда SEO пришлет обновленную версию.
                    </p>
                  </form>
                ) : (
                  <p className={styles.reviewModalActionNote}>
                    Решение собственника может оставить только собственник или супер-админ.
                  </p>
                )}

                {publishHref ? (
                  <div className={styles.inlineActions}>
                    <Link href={publishHref} className={styles.secondaryButton}>Проверить перед публикацией</Link>
                  </div>
                ) : null}
                {publishWaitingForOwner ? (
                  <p className={styles.reviewModalActionNote}>
                    Путь к публикации откроется после согласования владельца.
                  </p>
                ) : null}
              </section>
            </div>
          </OwnerReviewDialog>
        ) : null}
      </div>
    </AdminShell>
  );
}
