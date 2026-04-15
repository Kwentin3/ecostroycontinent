import Link from "next/link";

import { AdminShell } from "../../../../components/admin/AdminShell";
import styles from "../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../lib/admin/page-helpers";
import {
  buildOwnerReviewGalleryCards,
  filterOwnerReviewGalleryCards,
  summarizeOwnerReviewGallery
} from "../../../../lib/admin/owner-review.js";
import { getReviewQueue } from "../../../../lib/content-ops/workflow";
import { ENTITY_TYPES } from "../../../../lib/content-core/content-types.js";

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
  { value: ENTITY_TYPES.PAGE, label: "Страницы" },
  { value: ENTITY_TYPES.MEDIA_ASSET, label: "Медиа" }
];

function buildReviewUrl(query, currentType, nextStatus) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (currentType && currentType !== "all") {
    params.set("type", currentType);
  }

  if (nextStatus && nextStatus !== "all") {
    params.set("status", nextStatus);
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

export default async function ReviewQueuePage({ searchParams }) {
  const user = await requireReviewUser();
  const queue = await getReviewQueue();
  const query = await searchParams;
  const search = typeof query?.q === "string" ? query.q : "";
  const status = typeof query?.status === "string" ? query.status : "all";
  const type = typeof query?.type === "string" ? query.type : "all";
  const cards = buildOwnerReviewGalleryCards(queue);
  const filteredCards = filterOwnerReviewGalleryCards(cards, {
    query: search,
    status,
    type
  });
  const summary = summarizeOwnerReviewGallery(cards);

  return (
    <AdminShell
      user={user}
      title="Проверка материалов"
      breadcrumbs={[{ label: "Админка", href: "/admin" }, { label: "Проверка" }]}
      activeHref="/admin/review"
    >
      <div className={styles.stack}>
        <section className={styles.reviewGalleryControls}>
          <div className={styles.reviewGalleryHeader}>
            <div className={styles.reviewGalleryHeaderCopy}>
              <p className={styles.eyebrow}>Согласование собственника</p>
              <h2 className={styles.sectionTitle}>Галерея материалов на проверку</h2>
              <p className={styles.mutedText}>Смотрите материалы по сути: услугу, кейс, страницу или медиа. То, что требует вашего решения, уже поднято наверх.</p>
            </div>
            <div className={styles.reviewGalleryCounters} aria-label="Сводка по проверке">
              <span className={styles.reviewGalleryCounter}>Всего: {summary.total}</span>
              <span className={styles.reviewGalleryCounter}>Требуют решения: {summary.byStatus.needs_owner || 0}</span>
              <span className={styles.reviewGalleryCounter}>Возвращены: {summary.byStatus.returned || 0}</span>
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
              const href = buildReviewUrl(search, type, option.value);
              const active = option.value === status;

              return (
                <Link
                  key={option.value}
                  href={href}
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
            <p className={styles.mutedText}>Материалов по текущему фильтру нет.</p>
            <Link href="/admin/review" className={styles.secondaryButton}>Показать все материалы</Link>
          </div>
        ) : (
          <section className={styles.reviewGalleryGrid} aria-label="Материалы на проверку">
            {filteredCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
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
                  {card.mediaUrl ? (
                    <img src={card.mediaUrl} alt={card.title} className={styles.reviewGalleryImage} />
                  ) : (
                    <div className={styles.reviewGalleryImageFallback} aria-hidden="true">
                      {(card.title || card.entityTypeLabel).trim().slice(0, 1)}
                    </div>
                  )}
                </div>

                <div className={styles.reviewGalleryCardBody}>
                  <h3 className={styles.reviewGalleryCardTitle}>{card.title}</h3>
                  <p className={styles.reviewGalleryCardSummary}>{card.summary}</p>
                  {card.facts.length > 0 ? (
                    <ul className={styles.reviewGalleryFactList}>
                      {card.facts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className={styles.reviewGalleryCardFooter}>
                  <span className={styles.reviewGalleryFooterNote}>{card.status.description}</span>
                  {card.revision.previewStatus !== "preview_renderable" ? (
                    <span className={styles.reviewGalleryWarning}>{card.previewStatusLabel}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </AdminShell>
  );
}
