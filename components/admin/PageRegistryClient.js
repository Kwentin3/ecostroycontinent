"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageMetadataModal } from "./PageMetadataModal";
import styles from "./PageRegistryClient.module.css";

const PAGE_TYPE_LABELS = {
  about: "О нас",
  contacts: "Контакты"
};

function toneClassName(tone = "") {
  if (tone === "healthy") {
    return styles.tonehealthy;
  }

  if (tone === "warning") {
    return styles.tonewarning;
  }

  if (tone === "danger") {
    return styles.tonedanger;
  }

  return styles.toneunknown;
}

export function PageRegistryClient({
  initialRecords,
  metadataSaveBasePath = "/api/admin/entities/page",
  createFallbackHref = "/admin/entities/page/new",
  initialCreateOpen = false,
  initialCreateTitle = "",
  initialCreateType = "about",
  initialCreateError = ""
}) {
  const [records, setRecords] = useState(initialRecords);
  const [viewMode, setViewMode] = useState("cards");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState("");
  const [metadataRecordId, setMetadataRecordId] = useState("");
  const [createOpen, setCreateOpen] = useState(initialCreateOpen);
  const [createTitle, setCreateTitle] = useState(initialCreateTitle);
  const [createType, setCreateType] = useState(initialCreateType);
  const [createError, setCreateError] = useState(initialCreateError);
  const metadataRecord = records.find((record) => record.id === metadataRecordId) || null;

  useEffect(() => {
    setCreateOpen(initialCreateOpen);
    setCreateTitle(initialCreateTitle);
    setCreateType(initialCreateType);
    setCreateError(initialCreateError);
  }, [initialCreateError, initialCreateOpen, initialCreateTitle, initialCreateType]);

  const filteredRecords = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      if (loweredQuery) {
        const haystack = `${record.title} ${record.slug} ${record.signalLabel} ${record.versionStateLabel}`.toLowerCase();

        if (!haystack.includes(loweredQuery)) {
          return false;
        }
      }

      if (statusFilter !== "all" && record.signalState !== statusFilter && record.versionState !== statusFilter) {
        return false;
      }

      if (typeFilter !== "all" && record.metadata.pageType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [query, records, statusFilter, typeFilter]);

  const handleMetadataSave = async (nextMetadata) => {
    if (!metadataRecord) {
      return { message: "Страница не найдена." };
    }

    const response = await fetch(`${metadataSaveBasePath}/${metadataRecord.id}/workspace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "save_metadata",
        metadata: nextMetadata
      })
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Не удалось сохранить метаданные страницы.");
    }

    setRecords((current) => current.map((record) => (
      record.id === metadataRecord.id
        ? {
            ...record,
            metadata: result.metadata || nextMetadata,
            slug: (result.metadata || nextMetadata).slug
          }
        : record
    )));

    return result;
  };

  return (
    <div className={styles.controls}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMain}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Поиск</span>
            <input className={styles.input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, slug, статус" />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Сигнал</span>
            <select className={styles.select} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Все</option>
              <option value="blocked">Заблокировано</option>
              <option value="proof_gap">Нужны доказательства</option>
              <option value="partial">Частично</option>
              <option value="ready">Готово</option>
              <option value="missing">Нет версии</option>
              <option value="inactive">Вне live</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Тип страницы</span>
            <select className={styles.select} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">Все</option>
              <option value="about">О нас</option>
              <option value="contacts">Контакты</option>
            </select>
          </div>
        </div>

        <div className={styles.toolbarAside}>
          <button type="button" className={styles.primaryButton} onClick={() => {
            setCreateError("");
            setCreateOpen(true);
          }}>
            Новая страница
          </button>
          <div className={styles.toggleRow}>
            <button type="button" className={`${styles.toggle} ${viewMode === "cards" ? styles.toggleActive : ""}`} onClick={() => setViewMode("cards")}>
              Карточки
            </button>
            <button type="button" className={`${styles.toggle} ${viewMode === "list" ? styles.toggleActive : ""}`} onClick={() => setViewMode("list")}>
              Список
            </button>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className={styles.empty}>Под эти фильтры страницы не найдены. Снимите фильтр или создайте новую страницу.</div>
      ) : null}

      {viewMode === "cards" ? (
        <div className={styles.grid}>
          {filteredRecords.map((record) => (
            <article key={record.id} className={styles.card}>
              <Link href={record.href} className={styles.cardLink} aria-label={`Открыть страницу ${record.title}`} />
              <div className={styles.preview}>
                {record.previewUrl ? <img src={record.previewUrl} alt={record.title} /> : <span className={styles.previewFallback}>Нет preview</span>}
              </div>
              <div className={styles.cardHead}>
                <div>
                  <h3 className={styles.title}>{record.title}</h3>
                  <p className={styles.meta}>{PAGE_TYPE_LABELS[record.metadata.pageType] || record.metadata.pageType} · /{record.slug}</p>
                  {record.updatedAtLabel ? <p className={styles.metaMinor}>Обновлено {record.updatedAtLabel}</p> : null}
                </div>
                <div className={styles.menuWrap}>
                  <button type="button" className={styles.menuButton} onClick={() => setMenuOpenId((current) => current === record.id ? "" : record.id)}>
                    ⋯
                  </button>
                  {menuOpenId === record.id ? (
                    <div className={styles.menuPanel}>
                      <Link href={record.href} className={styles.menuItem}>Открыть страницу</Link>
                      <button type="button" className={styles.menuItem} onClick={() => {
                        setMetadataRecordId(record.id);
                        setMenuOpenId("");
                      }}>
                        Метаданные
                      </button>
                      <Link href={record.historyHref} className={styles.menuItem}>История</Link>
                    </div>
                  ) : null}
                </div>
              </div>
              <span className={`${styles.badge} ${toneClassName(record.signalTone)}`}>{record.signalLabel}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {filteredRecords.map((record) => (
            <article key={record.id} className={styles.listRow}>
              <div className={styles.listMain}>
                <div className={styles.listHead}>
                  <div>
                    <h3 className={styles.title}>{record.title}</h3>
                    <p className={styles.meta}>{PAGE_TYPE_LABELS[record.metadata.pageType] || record.metadata.pageType} · /{record.slug}</p>
                    {record.updatedAtLabel ? <p className={styles.metaMinor}>Обновлено {record.updatedAtLabel}</p> : null}
                  </div>
                  <span className={`${styles.badge} ${toneClassName(record.signalTone)}`}>{record.signalLabel}</span>
                </div>
              </div>
              <Link href={record.href} className={styles.menuItem}>Открыть страницу</Link>
              <div className={styles.menuWrap}>
                <button type="button" className={styles.menuButton} onClick={() => setMenuOpenId((current) => current === record.id ? "" : record.id)}>
                  ⋯
                </button>
                {menuOpenId === record.id ? (
                  <div className={styles.menuPanel}>
                    <button type="button" className={styles.menuItem} onClick={() => {
                      setMetadataRecordId(record.id);
                      setMenuOpenId("");
                    }}>
                      Метаданные
                    </button>
                    <Link href={record.historyHref} className={styles.menuItem}>История</Link>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <PageMetadataModal
        open={Boolean(metadataRecord)}
        pageLabel={metadataRecord?.title || ""}
        metadata={metadataRecord?.metadata || null}
        onClose={() => setMetadataRecordId("")}
        onSave={handleMetadataSave}
      />

      {createOpen ? (
        <>
          <button type="button" className={styles.overlay} aria-label="Закрыть создание страницы" onClick={() => setCreateOpen(false)} />
          <section className={styles.createModal} role="dialog" aria-modal="true" aria-labelledby="page-create-title">
            <header className={styles.createHead}>
              <div>
                <p className={styles.fieldLabel}>Создание страницы</p>
                <h2 id="page-create-title" className={styles.createTitle}>Новая страница</h2>
                <p className={styles.createLegend}>Страница создаётся прямо из реестра и сразу открывается в основном рабочем экране без второго create-domain.</p>
              </div>
              <button type="button" className={styles.menuButton} onClick={() => setCreateOpen(false)}>
                ×
              </button>
            </header>
            <form action="/api/admin/entities/page/save" method="post" className={styles.createForm}>
              <input type="hidden" name="redirectMode" value="page_workspace" />
              <input type="hidden" name="failureRedirectTo" value="/admin/entities/page?create=1" />
              <input type="hidden" name="changeIntent" value="Черновик страницы создан из реестра страниц." />
              <input type="hidden" name="h1" value={createTitle.trim()} />
              {createError ? <div className={styles.createError}>{createError}</div> : null}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Тип страницы</span>
                <select
                  className={styles.select}
                  name="pageType"
                  value={createType}
                  onChange={(event) => {
                    setCreateType(event.target.value);
                    setCreateError("");
                  }}
                >
                  <option value="about">О нас</option>
                  <option value="contacts">Контакты</option>
                </select>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Название</span>
                <input
                  className={styles.input}
                  name="title"
                  value={createTitle}
                  onChange={(event) => {
                    setCreateTitle(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Например, О компании"
                  required
                />
              </div>
              <p className={styles.createHint}>H1 на старте берётся из названия. Route, SEO и редкие поля остаются в metadata layer, чтобы create-flow оставался лёгким.</p>
              <div className={styles.createActions}>
                <Link href={createFallbackHref} className={styles.ghostLink}>
                  Полный fallback-маршрут
                </Link>
                <div className={styles.createButtons}>
                  <button type="button" className={styles.toggle} onClick={() => setCreateOpen(false)}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.primaryButton} disabled={!createTitle.trim()}>
                    Создать и открыть
                  </button>
                </div>
              </div>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}
