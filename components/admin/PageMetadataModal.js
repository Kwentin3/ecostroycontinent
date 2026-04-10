"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { LANDING_PAGE_THEME_REGISTRY } from "../../lib/landing-composition/visual-semantics.js";
import styles from "./PageMetadataModal.module.css";

const TABS = [
  { id: "main", label: "Основное" },
  { id: "route", label: "Маршрут" },
  { id: "seo", label: "SEO" }
];

function normalizeMetadata(metadata = {}) {
  return {
    slug: metadata.slug || "",
    pageType: metadata.pageType || "about",
    pageThemeKey: metadata.pageThemeKey || "earth_sand",
    seo: {
      metaTitle: metadata.seo?.metaTitle || "",
      metaDescription: metadata.seo?.metaDescription || "",
      canonicalIntent: metadata.seo?.canonicalIntent || "",
      indexationFlag: metadata.seo?.indexationFlag || "index",
      openGraphTitle: metadata.seo?.openGraphTitle || "",
      openGraphDescription: metadata.seo?.openGraphDescription || "",
      openGraphImageAssetId: metadata.seo?.openGraphImageAssetId || ""
    }
  };
}

export function PageMetadataModal({
  open,
  pageLabel,
  metadata,
  onClose,
  onSave
}) {
  const [activeTab, setActiveTab] = useState("main");
  const [draft, setDraft] = useState(() => normalizeMetadata(metadata));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [position, setPosition] = useState({ x: 48, y: 72 });
  const dragRef = useRef(null);
  const normalizedMetadata = useMemo(() => normalizeMetadata(metadata), [metadata]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(normalizedMetadata);
    setStatus("");
    setIsError(false);
    setActiveTab("main");
  }, [open, normalizedMetadata]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleMove = (event) => {
      if (!dragRef.current) {
        return;
      }

      setPosition({
        x: Math.max(12, dragRef.current.startLeft + (event.clientX - dragRef.current.startX)),
        y: Math.max(12, dragRef.current.startTop + (event.clientY - dragRef.current.startY))
      });
    };

    const handleUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const updateSeoField = (field, value) => {
    setDraft((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setBusy(true);
    setStatus("");
    setIsError(false);

    try {
      const result = await onSave(draft);
      setStatus(result?.message || "Метаданные сохранены.");
      setIsError(false);
    } catch (error) {
      setStatus(error?.message || "Не удалось сохранить метаданные.");
      setIsError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={styles.overlay} aria-label="Закрыть модалку метаданных" onClick={onClose} />
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-metadata-title"
        style={{ left: position.x, top: position.y }}
      >
        <header
          className={styles.header}
          onPointerDown={(event) => {
            if (event.target.closest("button")) {
              return;
            }

            dragRef.current = {
              startX: event.clientX,
              startY: event.clientY,
              startLeft: position.x,
              startTop: position.y
            };
          }}
        >
          <div className={styles.titleWrap}>
            <p className={styles.eyebrow}>Метаданные страницы</p>
            <h2 id="page-metadata-title" className={styles.title}>{pageLabel}</h2>
            <p className={styles.summary}>Редкие и служебные поля живут отдельно от основного мольберта и не мешают ежедневной сборке страницы.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.ghostButton} onClick={() => setPosition({ x: 48, y: 72 })}>
              Сбросить позицию
            </button>
            <button type="button" className={styles.closeButton} onClick={onClose}>
              Закрыть
            </button>
          </div>
        </header>

        <nav className={styles.tabs} aria-label="Вкладки метаданных">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.body}>
          {activeTab === "main" ? (
            <div className={styles.grid}>
              <div className={styles.field}>
                <span>Тема страницы</span>
                <select
                  className={styles.select}
                  value={draft.pageThemeKey}
                  onChange={(event) => setDraft((current) => ({ ...current, pageThemeKey: event.target.value }))}
                >
                  {Object.entries(LANDING_PAGE_THEME_REGISTRY).map(([key, theme]) => (
                    <option key={key} value={key}>{theme.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <span>Open Graph image asset id</span>
                <input
                  className={styles.input}
                  value={draft.seo.openGraphImageAssetId}
                  onChange={(event) => updateSeoField("openGraphImageAssetId", event.target.value)}
                />
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>Meta title</span>
                <input
                  className={styles.input}
                  value={draft.seo.metaTitle}
                  onChange={(event) => updateSeoField("metaTitle", event.target.value)}
                />
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>Meta description</span>
                <textarea
                  className={styles.textarea}
                  value={draft.seo.metaDescription}
                  onChange={(event) => updateSeoField("metaDescription", event.target.value)}
                />
              </div>
            </div>
          ) : null}

          {activeTab === "route" ? (
            <div className={styles.grid}>
              <div className={styles.field}>
                <span>Slug</span>
                <input
                  className={styles.input}
                  value={draft.slug}
                  onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
                />
                <p className={styles.hint}>Route ownership остаётся у `Page`, но редактируется явно, без hidden carry-through через canvas.</p>
              </div>
              <div className={styles.field}>
                <span>Тип страницы</span>
                <select
                  className={styles.select}
                  value={draft.pageType}
                  onChange={(event) => setDraft((current) => ({ ...current, pageType: event.target.value }))}
                >
                  <option value="about">О нас</option>
                  <option value="contacts">Контакты</option>
                </select>
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>Canonical intent</span>
                <input
                  className={styles.input}
                  value={draft.seo.canonicalIntent}
                  onChange={(event) => updateSeoField("canonicalIntent", event.target.value)}
                />
              </div>
            </div>
          ) : null}

          {activeTab === "seo" ? (
            <div className={styles.grid}>
              <div className={styles.field}>
                <span>Indexation</span>
                <select
                  className={styles.select}
                  value={draft.seo.indexationFlag}
                  onChange={(event) => updateSeoField("indexationFlag", event.target.value)}
                >
                  <option value="index">Index</option>
                  <option value="noindex">Noindex</option>
                </select>
              </div>
              <div className={styles.field}>
                <span>Open Graph title</span>
                <input
                  className={styles.input}
                  value={draft.seo.openGraphTitle}
                  onChange={(event) => updateSeoField("openGraphTitle", event.target.value)}
                />
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>Open Graph description</span>
                <textarea
                  className={styles.textarea}
                  value={draft.seo.openGraphDescription}
                  onChange={(event) => updateSeoField("openGraphDescription", event.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        <footer className={styles.footer}>
          <p className={`${styles.status} ${isError ? styles.statusError : ""}`}>
            {status || "Модалку можно двигать, чтобы не терять контекст страницы."}
          </p>
          <div className={styles.footerActions}>
            <button type="button" className={styles.ghostButton} onClick={onClose} disabled={busy}>
              Готово
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={busy}>
              {busy ? "Сохраняем..." : "Сохранить метаданные"}
            </button>
          </div>
        </footer>
      </section>
    </>
  );
}
