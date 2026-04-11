import Link from "next/link";

import {
  formatPreviewViewportWidth,
  getPreviewViewportOption,
  PREVIEW_VIEWPORT_OPTIONS
} from "../../lib/admin/preview-viewport.js";
import styles from "./admin-ui.module.css";

function buildPreviewHref(hrefBase, searchParams, device) {
  const query = new URLSearchParams();

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (key !== "preview" && typeof value === "string" && value.length > 0) {
      query.set(key, value);
    }
  });

  query.set("preview", device);

  const queryString = query.toString();
  return queryString ? `${hrefBase}?${queryString}` : hrefBase;
}

export function PreviewViewport({
  title = "Предпросмотр",
  hint = "Переключайте устройство сверху, чтобы увидеть ту же страницу в другом размере.",
  device = "desktop",
  hrefBase,
  searchParams,
  onDeviceChange,
  children
}) {
  const activeOption = getPreviewViewportOption(device);

  return (
    <section className={styles.previewViewport}>
      <div className={styles.previewViewportToolbar}>
        <div className={styles.previewViewportCopy}>
          <p className={styles.eyebrow}>{title}</p>
          <p className={styles.previewViewportHint}>{hint}</p>
          <div className={styles.previewViewportStatus} aria-live="polite">
            <strong>{activeOption.label}</strong>
            <span>{formatPreviewViewportWidth(activeOption.width)} · {activeOption.hint}</span>
          </div>
        </div>
        <div className={styles.previewViewportControls}>
          {PREVIEW_VIEWPORT_OPTIONS.map((option) => {
            const className = option.value === device
              ? `${styles.previewViewportButton} ${styles.previewViewportButtonActive}`
              : styles.previewViewportButton;

            if (typeof onDeviceChange === "function") {
              return (
                <button
                  key={option.value}
                  type="button"
                  className={className}
                  aria-pressed={option.value === device}
                  onClick={() => onDeviceChange(option.value)}
                >
                  <span className={styles.previewViewportButtonLabel}>{option.label}</span>
                  <span className={styles.previewViewportButtonMeta}>{formatPreviewViewportWidth(option.width)}</span>
                </button>
              );
            }

            return (
              <Link
                key={option.value}
                href={hrefBase ? buildPreviewHref(hrefBase, searchParams, option.value) : "#"}
                className={className}
                aria-pressed={option.value === device}
              >
                <span className={styles.previewViewportButtonLabel}>{option.label}</span>
                <span className={styles.previewViewportButtonMeta}>{formatPreviewViewportWidth(option.width)}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className={`${styles.previewViewportFrame} ${styles[activeOption.frameToneClassName]}`}>
        <div className={styles.previewViewportFrameTop}>
          <span className={styles.previewViewportFramePill}>{activeOption.label}</span>
          <span className={styles.previewViewportFrameMeta}>{formatPreviewViewportWidth(activeOption.width)}</span>
        </div>
        <div className={`${styles.previewViewportCanvas} ${styles[activeOption.widthClassName]}`}>
          <div className={styles.previewViewportSurface}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
