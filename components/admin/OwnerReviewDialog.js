"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import styles from "./OwnerReviewDialog.module.css";

export function OwnerReviewDialog({
  closeHref,
  eyebrow,
  title,
  summary = "",
  meta = [],
  children
}) {
  const dialogRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const focusDialog = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        router.replace(closeHref, { scroll: false });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusDialog);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeHref, router]);

  return (
    <>
      <button
        type="button"
        className={styles.overlay}
        aria-label="Закрыть окно согласования"
        onClick={() => router.replace(closeHref, { scroll: false })}
      />
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-review-dialog-title"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 id="owner-review-dialog-title" className={styles.title}>{title}</h2>
            {summary ? <p className={styles.summary}>{summary}</p> : null}
            {meta.length > 0 ? (
              <div className={styles.metaRow}>
                {meta.map((item) => (
                  <span key={item} className={styles.metaPill}>{item}</span>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => router.replace(closeHref, { scroll: false })}
          >
            Закрыть
          </button>
        </header>
        <div className={styles.body}>
          {children}
        </div>
      </section>
    </>
  );
}
