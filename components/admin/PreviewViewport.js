import Link from "next/link";

import styles from "./admin-ui.module.css";

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Компьютер", widthClass: styles.previewViewportDesktop },
  { value: "tablet", label: "Планшет", widthClass: styles.previewViewportTablet },
  { value: "mobile", label: "Телефон", widthClass: styles.previewViewportMobile }
];

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
  const activeOption = DEVICE_OPTIONS.find((option) => option.value === device) || DEVICE_OPTIONS[0];

  return (
    <section className={styles.previewViewport}>
      <div className={styles.previewViewportToolbar}>
        <div className={styles.previewViewportCopy}>
          <p className={styles.eyebrow}>{title}</p>
          <p className={styles.previewViewportHint}>{hint}</p>
        </div>
        <div className={styles.previewViewportControls}>
          {DEVICE_OPTIONS.map((option) => {
            const className = option.value === device ? styles.primaryButton : styles.secondaryButton;

            if (typeof onDeviceChange === "function") {
              return (
                <button
                  key={option.value}
                  type="button"
                  className={className}
                  aria-pressed={option.value === device}
                  onClick={() => onDeviceChange(option.value)}
                >
                  {option.label}
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
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className={styles.previewViewportFrame}>
        <div className={`${styles.previewViewportCanvas} ${activeOption.widthClass}`}>
          {children}
        </div>
      </div>
    </section>
  );
}
