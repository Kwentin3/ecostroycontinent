"use client";

import Link from "next/link";

import styles from "./admin-ui.module.css";

export function RelationChipRow({
  title,
  note = "",
  items = [],
  emptyLabel = "Нет связанных сущностей",
  addLabel = "Добавить",
  onAdd = null,
  onRemove = null
}) {
  return (
    <section className={styles.relationSummary}>
      <div className={styles.relationSummaryHeader}>
        <div className={styles.relationSummaryCopy}>
          {title ? <strong className={styles.relationSummaryTitle}>{title}</strong> : null}
          {note ? <p className={styles.relationSummaryNote}>{note}</p> : null}
        </div>
        {onAdd && items.length > 0 ? (
          <button type="button" className={styles.secondaryButton} onClick={onAdd}>
            {addLabel}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className={styles.relationSummaryEmpty}>
          <p className={styles.mutedText}>{emptyLabel}</p>
          {onAdd ? (
            <button type="button" className={styles.secondaryButton} onClick={onAdd}>
              {addLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.relationChipList}>
          {items.map((item) => (
            <article
              key={item.id}
              className={`${styles.relationChip} ${item.isFallback ? styles.relationChipFallback : ""}`}
            >
              <Link
                href={item.href}
                className={styles.relationChipLink}
                aria-label={`${item.actionLabel || "Открыть"}: ${item.label}`}
              >
                <span className={styles.relationChipLinkTop}>
                  <strong className={styles.relationChipLabel}>{item.label}</strong>
                  {item.isFallback ? <span className={styles.cockpitFallbackPill}>Резерв</span> : null}
                </span>
                {item.subtitle ? <span className={styles.relationChipSubtitle}>{item.subtitle}</span> : null}
                {item.meta ? <span className={styles.relationChipMeta}>{item.meta}</span> : null}
                <span className={styles.relationChipAction}>{item.actionLabel || "Открыть"}</span>
              </Link>
              {onRemove ? (
                <button
                  type="button"
                  className={styles.relationChipRemove}
                  onClick={() => onRemove(item.id)}
                  aria-label={`Удалить связь ${item.label}`}
                >
                  Удалить
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
