"use client";

import { useState } from "react";

import styles from "./admin-ui.module.css";

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Компьютер", widthClass: styles.previewViewportDesktop },
  { value: "tablet", label: "Планшет", widthClass: styles.previewViewportTablet },
  { value: "mobile", label: "Телефон", widthClass: styles.previewViewportMobile }
];

export function PreviewViewport({
  title = "Превью",
  hint = "Нажмите «Показать в превью» в строке изменения, чтобы перейти к связанному блоку.",
  defaultDevice = "desktop",
  children
}) {
  const [device, setDevice] = useState(defaultDevice);
  const activeOption = DEVICE_OPTIONS.find((option) => option.value === device) || DEVICE_OPTIONS[0];

  return (
    <section className={styles.previewViewport}>
      <div className={styles.previewViewportToolbar}>
        <div className={styles.previewViewportCopy}>
          <p className={styles.eyebrow}>{title}</p>
          <p className={styles.previewViewportHint}>{hint}</p>
        </div>
        <div className={styles.previewViewportControls}>
          {DEVICE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === device ? styles.primaryButton : styles.secondaryButton}
              onClick={() => setDevice(option.value)}
            >
              {option.label}
            </button>
          ))}
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
