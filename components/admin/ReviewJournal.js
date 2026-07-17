import styles from "./admin-ui.module.css";

export function ReviewJournal({ items = [] }) {
  return (
    <section className={styles.reviewJournal} aria-labelledby="review-journal-title">
      <div className={styles.reviewJournalHeader}>
        <h2 id="review-journal-title" className={styles.reviewJournalTitle}>Журнал</h2>
        <span className={styles.reviewJournalWindow}>30 дней</span>
      </div>

      {items.length > 0 ? (
        <ol className={styles.reviewJournalList}>
          {items.map((item) => (
            <li key={item.id} className={styles.reviewJournalItem}>
              <div className={styles.reviewJournalItemTop}>
                <time className={styles.reviewJournalTime}>{item.timeLabel}</time>
                <span className={styles.reviewJournalAction} data-tone={item.tone}>{item.actionLabel}</span>
              </div>
              <p className={styles.reviewJournalSummary}>{item.summary}</p>
              <div className={styles.reviewJournalMeta}>
                <span>{item.entityTypeLabel}</span>
                {item.comment ? <span className={styles.reviewJournalComment}>{item.comment}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.reviewJournalEmpty}>За последние 30 дней действий нет.</p>
      )}
    </section>
  );
}
