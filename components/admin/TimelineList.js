import { ADMIN_COPY, getAuditEventLabel, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

export function TimelineList({ items, emptyLabel = ADMIN_COPY.timelineEmpty, defaultOpen = false }) {
  if (!items || items.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyHint}>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <details className={styles.compactDisclosure} open={defaultOpen}>
      <summary className={styles.compactDisclosureSummary}>
        <span className={styles.compactDisclosureMarker} aria-hidden="true" />
        <span className={styles.compactDisclosureSummaryMain}>
          <strong>{ADMIN_COPY.auditTimeline}</strong>
          <span className={styles.compactDisclosureSummaryMeta}>
            {items.length} {items.length === 1 ? "событие" : "событий"}
          </span>
        </span>
        <span className={styles.compactDisclosureSummaryStats}>
          <span className={styles.badge}>{normalizeLegacyCopy(items[0]?.summary || ADMIN_COPY.timelineEmpty)}</span>
        </span>
      </summary>
      <div className={styles.compactDisclosureBody}>
        <div className={styles.timeline}>
          {items.map((item) => (
            <article key={item.id} className={styles.timelineItem}>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>{getAuditEventLabel(item.eventKey)}</span>
                {item.details?.aiInvolvement ? <span className={styles.badge}>С участием ИИ</span> : null}
              </div>
              <h4>{normalizeLegacyCopy(item.summary)}</h4>
              <p className={styles.mutedText}>{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
              {item.details?.comment ? <p>{item.details.comment}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}
