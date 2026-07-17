"use client";

import { useEffect, useRef } from "react";

import styles from "./admin-ui.module.css";

export function RemovalSweepBatchDialog({ open, busy, preview, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => cancelButtonRef.current?.focus());

    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus?.();
    };
  }, [open]);

  if (!open || !preview) {
    return null;
  }

  const canConfirm = preview.readyComponentCount > 0 && !busy;

  return (
    <div className={styles.mediaOverlayBackdrop}>
      <section
        ref={dialogRef}
        className={`${styles.mediaOverlayDialog} ${styles.removalSweepBatchDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="removal-sweep-batch-title"
        aria-describedby="removal-sweep-batch-description"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (!busy && event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
          }

          if (event.key === "Tab") {
            const focusable = [...(dialogRef.current?.querySelectorAll("button:not(:disabled), a[href]") ?? [])];
            const first = focusable[0];
            const last = focusable.at(-1);

            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className={styles.mediaOverlayHeader}>
          <div>
            <p className={styles.eyebrow}>Необратимое действие</p>
            <h2 id="removal-sweep-batch-title" className={styles.mediaOverlayTitle}>
              Удалить выбранные объекты навсегда?
            </h2>
          </div>
        </div>

        <p id="removal-sweep-batch-description" className={styles.helpText}>
          Система повторно проверила выбранные группы. После подтверждения готовые объекты будут удалены без возможности восстановления.
        </p>

        <dl className={styles.mediaBulkRemovalSummary}>
          <div>
            <dt>Выбрано карточек</dt>
            <dd>{preview.selectedRootCount}</dd>
          </div>
          <div>
            <dt>Готово групп</dt>
            <dd>{preview.readyComponentCount}</dd>
          </div>
          <div>
            <dt>Будет удалено объектов</dt>
            <dd>{preview.readyObjectCount}</dd>
          </div>
          <div>
            <dt>Пропущено групп</dt>
            <dd>{preview.blockedComponentCount}</dd>
          </div>
        </dl>

        {preview.readyComponents.length > 0 ? (
          <section className={styles.removalSweepDialogSection} aria-labelledby="removal-sweep-ready-title">
            <h3 id="removal-sweep-ready-title">Будут удалены</h3>
            <ul className={styles.removalSweepDialogList}>
              {preview.readyComponents.map((component) => (
                <li key={component.componentKey}>
                  <strong>{component.root.label}</strong>
                  <span>{component.memberCount === 1 ? "1 объект" : `Объектов в группе: ${component.memberCount}`}</span>
                  {component.members.length > 1 ? (
                    <ul className={styles.removalSweepDialogMemberList}>
                      {component.members.map((member) => (
                        <li key={`${member.entityType}:${member.entityId}`}>{member.label}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {preview.blockedComponents.length > 0 ? (
          <section className={styles.removalSweepDialogWarning} aria-labelledby="removal-sweep-skipped-title">
            <h3 id="removal-sweep-skipped-title">Не будут удалены</h3>
            <ul className={styles.removalSweepDialogList}>
              {preview.blockedComponents.map((component) => (
                <li key={component.componentKey}>
                  <strong>{component.root.label}</strong>
                  <span>{component.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
            disabled={!canConfirm}
          >
            {busy ? "Удаляем..." : `Удалить навсегда: ${preview.readyObjectCount}`}
          </button>
        </div>
      </section>
    </div>
  );
}
