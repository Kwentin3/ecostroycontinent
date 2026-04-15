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
  zoom = 1,
  minZoom = 0.45,
  maxZoom = 1,
  zoomStep = 0.05,
  hrefBase,
  searchParams,
  onDeviceChange,
  onZoomChange,
  showToolbar = true,
  showFrameTop = true,
  children
}) {
  const activeOption = getPreviewViewportOption(device);
  const safeZoom = Number.isFinite(zoom) ? Math.min(maxZoom, Math.max(minZoom, zoom)) : 1;
  const scaledWidth = Math.round(activeOption.width * safeZoom);

  return (
    <section className={styles.previewViewport}>
      {showToolbar ? (
        <div className={styles.previewViewportToolbar}>
          <div className={styles.previewViewportCopy}>
            <p className={styles.eyebrow}>{title}</p>
            <p className={styles.previewViewportHint}>{hint}</p>
            <div className={styles.previewViewportStatus} aria-live="polite">
              <strong>{activeOption.label}</strong>
              <span>{formatPreviewViewportWidth(activeOption.width)} · {activeOption.hint}</span>
            </div>
          </div>
          <div className={styles.previewViewportAside}>
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
            {typeof onZoomChange === "function" ? (
              <label className={styles.previewViewportZoom}>
                <span className={styles.previewViewportZoomLabel}>Масштаб</span>
                <div className={styles.previewViewportZoomControls}>
                  <input
                    className={styles.previewViewportZoomSlider}
                    type="range"
                    min={minZoom}
                    max={maxZoom}
                    step={zoomStep}
                    value={safeZoom}
                    onChange={(event) => onZoomChange(Number(event.target.value))}
                  />
                  <span className={styles.previewViewportZoomValue}>{Math.round(safeZoom * 100)}%</span>
                </div>
              </label>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={`${styles.previewViewportFrame} ${styles[activeOption.frameToneClassName]}`}>
        {showFrameTop ? (
          <div className={styles.previewViewportFrameTop}>
            <span className={styles.previewViewportFramePill}>{activeOption.label}</span>
            <span className={styles.previewViewportFrameMeta}>
              {formatPreviewViewportWidth(activeOption.width)} · масштаб {Math.round(safeZoom * 100)}%
            </span>
          </div>
        ) : null}
        <div className={styles.previewViewportCanvas}>
          <div
            className={`${styles.previewViewportDeviceShell} ${styles[activeOption.deviceShellClassName]}`}
            style={{ width: `${scaledWidth}px` }}
          >
            <div className={styles.previewViewportDeviceViewport}>
              <div
                className={`${styles.previewViewportScaler} ${styles[activeOption.widthClassName]}`}
                style={{
                  zoom: safeZoom
                }}
              >
                <div className={styles.previewViewportSurface} data-preview-device={activeOption.value}>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
