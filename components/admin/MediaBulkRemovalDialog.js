"use client";

import { useEffect, useRef } from "react";

import styles from "./admin-ui.module.css";

export function MediaBulkRemovalDialog({
  open,
  busy,
  selectedCount,
  markableCount,
  alreadyMarkedCount,
  hiddenCount,
  onClose,
  onConfirm
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus?.();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.mediaOverlayBackdrop}>
      <section
        ref={dialogRef}
        className={`${styles.mediaOverlayDialog} ${styles.mediaBulkRemovalDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-bulk-removal-title"
        aria-describedby="media-bulk-removal-description"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (!busy && event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <div className={styles.mediaOverlayHeader}>
          <div>
            <p className={styles.eyebrow}>Групповое действие</p>
            <h3 id="media-bulk-removal-title" className={styles.mediaOverlayTitle}>
              Пометить медиа на удаление?
            </h3>
          </div>
        </div>

        <p id="media-bulk-removal-description" className={styles.helpText}>
          Карточки будут исключены из новых связей и переданы в Центр очистки. Окончательное удаление сейчас не выполняется.
        </p>

        <dl className={styles.mediaBulkRemovalSummary}>
          <div>
            <dt>Выбрано</dt>
            <dd>{selectedCount}</dd>
          </div>
          <div>
            <dt>Будет помечено</dt>
            <dd>{markableCount}</dd>
          </div>
          <div>
            <dt>Уже помечено</dt>
            <dd>{alreadyMarkedCount}</dd>
          </div>
          {hiddenCount > 0 ? (
            <div>
              <dt>Скрыто фильтром</dt>
              <dd>{hiddenCount}</dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.mediaOverlayActions}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={busy}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={onConfirm}
            disabled={busy || markableCount === 0}
          >
            {busy ? "Помечаем..." : `Пометить: ${markableCount}`}
          </button>
        </div>
      </section>
    </div>
  );
}
