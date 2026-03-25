import styles from "./admin-ui.module.css";

export function TimelineList({ items, emptyLabel = "Timeline is empty." }) {
  if (!items || items.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyHint}>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {items.map((item) => (
        <article key={item.id} className={styles.timelineItem}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>{item.eventKey}</span>
            {item.details?.aiInvolvement ? <span className={styles.badge}>AI involved</span> : null}
          </div>
          <h4>{item.summary}</h4>
          <p className={styles.mutedText}>{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
          {item.details?.comment ? <p>{item.details.comment}</p> : null}
        </article>
      ))}
    </div>
  );
}
