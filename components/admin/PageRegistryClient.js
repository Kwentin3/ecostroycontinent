"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { normalizePageRegistryRecord, normalizePageRegistryRecords } from "../../lib/admin/page-registry-records.js";
import {
  PAGE_CREATE_MODE_LABELS,
  PAGE_TYPE_LABELS
} from "../../lib/admin/page-workspace.js";
import { PageMetadataModal } from "./PageMetadataModal";
import styles from "./PageRegistryClient.module.css";

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

function buildHiddenValue(pageType, createMode, formState) {
  if (createMode === "from_service") {
    return "service_landing";
  }

  if (createMode === "from_equipment") {
    return "equipment_landing";
  }

  if (createMode === "clone_adapt" && formState.cloneFromPageId) {
    const source = formState.cloneOptions.find((item) => item.id === formState.cloneFromPageId);
    return source?.pageType || pageType;
  }

  return pageType;
}

export function PageRegistryClient({
  initialRecords,
  metadataSaveBasePath = "/api/admin/entities/page",
  createFallbackHref = "/admin/entities/page/new",
  initialCreateOpen = false,
  initialCreateTitle = "",
  initialCreateType = "about",
  initialCreateMode = "standalone",
  initialCreateError = "",
  initialPrimaryServiceId = "",
  initialPrimaryEquipmentId = "",
  initialCloneFromPageId = "",
  serviceOptions = [],
  equipmentOptions = []
}) {
  const [records, setRecords] = useState(() => normalizePageRegistryRecords(initialRecords));
  const [viewMode, setViewMode] = useState("cards");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState("");
  const [metadataRecordId, setMetadataRecordId] = useState("");
  const [createOpen, setCreateOpen] = useState(initialCreateOpen);
  const [createTitle, setCreateTitle] = useState(initialCreateTitle);
  const [createType, setCreateType] = useState(initialCreateType);
  const [createMode, setCreateMode] = useState(initialCreateMode);
  const [createPrimaryServiceId, setCreatePrimaryServiceId] = useState(initialPrimaryServiceId);
  const [createPrimaryEquipmentId, setCreatePrimaryEquipmentId] = useState(initialPrimaryEquipmentId);
  const [createCloneFromPageId, setCreateCloneFromPageId] = useState(initialCloneFromPageId);
  const [createGeoLabel, setCreateGeoLabel] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createDistrict, setCreateDistrict] = useState("");
  const [createServiceArea, setCreateServiceArea] = useState("");
  const [createError, setCreateError] = useState(initialCreateError);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusyId, setActionBusyId] = useState("");
  const metadataRecord = records.find((record) => record.id === metadataRecordId) || null;
  const cloneOptions = useMemo(
    () => records.map((record) => ({
      id: record.id,
      label: record.title,
      pageType: record.metadata.pageType,
      meta: `/${record.slug}`
    })),
    [records]
  );

  useEffect(() => {
    setRecords(normalizePageRegistryRecords(initialRecords));
  }, [initialRecords]);

  useEffect(() => {
    setCreateOpen(initialCreateOpen);
    setCreateTitle(initialCreateTitle);
    setCreateType(initialCreateType);
    setCreateMode(initialCreateMode);
    setCreatePrimaryServiceId(initialPrimaryServiceId);
    setCreatePrimaryEquipmentId(initialPrimaryEquipmentId);
    setCreateCloneFromPageId(initialCloneFromPageId);
    setCreateError(initialCreateError);
  }, [
    initialCloneFromPageId,
    initialCreateError,
    initialCreateMode,
    initialCreateOpen,
    initialCreateTitle,
    initialCreateType,
    initialPrimaryEquipmentId,
    initialPrimaryServiceId
  ]);

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
        ? normalizePageRegistryRecord({
            ...record,
            metadata: result.metadata || nextMetadata,
            slug: (result.metadata || nextMetadata)?.slug || record.slug
          })
        : record
    )));

    return result;
  };

  const handleArchiveRecord = async (record) => {
    if (!record?.lifecycle?.canArchive || actionBusyId) {
      return;
    }

    if (!window.confirm("Снять страницу с публикации? История сохранится.")) {
      return;
    }

    setActionBusyId(record.id);
    setActionMessage("");
    setActionError("");
    setMenuOpenId("");

    try {
      const formData = new FormData();
      formData.set("responseMode", "json");
      const response = await fetch(record.lifecycle.archiveUrl, {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Не удалось снять страницу с публикации.");
      }

      setRecords((current) => current.map((item) => (
        item.id === record.id
          ? normalizePageRegistryRecord({
              ...item,
              signalLabel: "Вне публикации",
              signalTone: "warning",
              signalState: "inactive",
              signalReason: "Страница снята с публикации.",
              lifecycle: {
                ...item.lifecycle,
                canArchive: false,
                hasLivePublishedRevision: false,
                canDelete: false
              }
            })
          : item
      )));
      setActionMessage(result.message || "Страница снята с публикации.");
    } catch (lifecycleError) {
      setActionError(lifecycleError.message);
    } finally {
      setActionBusyId("");
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!record?.lifecycle?.canDelete || actionBusyId) {
      return;
    }

    if (!window.confirm("Удалить страницу целиком? Это действие необратимо.")) {
      return;
    }

    setActionBusyId(record.id);
    setActionMessage("");
    setActionError("");
    setMenuOpenId("");

    try {
      const formData = new FormData();
      formData.set("responseMode", "json");
      formData.append("entityId", record.id);
      const response = await fetch(record.lifecycle.deleteUrl, {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Не удалось удалить страницу.");
      }

      setRecords((current) => current.filter((item) => item.id !== record.id));
      setActionMessage(result.message || "Страница удалена.");
    } catch (lifecycleError) {
      setActionError(lifecycleError.message);
    } finally {
      setActionBusyId("");
    }
  };

  const effectivePageType = buildHiddenValue(createType, createMode, {
    cloneFromPageId: createCloneFromPageId,
    cloneOptions
  });
  const createDisabled = !createTitle.trim()
    || (createMode === "from_service" && !createPrimaryServiceId)
    || (createMode === "from_equipment" && !createPrimaryEquipmentId)
    || (createMode === "clone_adapt" && !createCloneFromPageId);

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
              <option value="inactive">Вне публикации</option>
              <option value="draft">Черновик</option>
              <option value="review">На проверке</option>
              <option value="published">Опубликовано</option>
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Тип страницы</span>
            <select className={styles.select} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">Все</option>
              {Object.entries(PAGE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
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

      {actionMessage ? <div className={styles.feedbackInfo}>{actionMessage}</div> : null}
      {actionError ? <div className={styles.feedbackError}>{actionError}</div> : null}

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
                  {record.lifecycle?.hasLivePublishedRevision ? <p className={styles.metaMinor}>Сейчас в публикации</p> : null}
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
                      {record.lifecycle?.canArchive ? (
                        <button type="button" className={styles.menuItem} disabled={actionBusyId === record.id} onClick={() => handleArchiveRecord(record)}>
                          {actionBusyId === record.id ? "Снимаем..." : "Снять с публикации"}
                        </button>
                      ) : null}
                      {record.lifecycle?.canDelete ? (
                        <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} disabled={actionBusyId === record.id} onClick={() => handleDeleteRecord(record)}>
                          {actionBusyId === record.id ? "Удаляем..." : "Удалить"}
                        </button>
                      ) : null}
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
                    {record.lifecycle?.canArchive ? (
                      <button type="button" className={styles.menuItem} disabled={actionBusyId === record.id} onClick={() => handleArchiveRecord(record)}>
                        {actionBusyId === record.id ? "Снимаем..." : "Снять с публикации"}
                      </button>
                    ) : null}
                    {record.lifecycle?.canDelete ? (
                      <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} disabled={actionBusyId === record.id} onClick={() => handleDeleteRecord(record)}>
                        {actionBusyId === record.id ? "Удаляем..." : "Удалить"}
                      </button>
                    ) : null}
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
                <p className={styles.createLegend}>Создание остается внутри единого редактора страниц. Режим старта задает только начальный контекст, а не отдельный экран.</p>
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
              <input type="hidden" name="createMode" value={createMode} />
              <input type="hidden" name="pageType" value={effectivePageType} />
              {createError ? <div className={styles.createError}>{createError}</div> : null}

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Режим старта</span>
                <select className={styles.select} value={createMode} onChange={(event) => {
                  setCreateMode(event.target.value);
                  setCreateError("");
                }}>
                  {Object.entries(PAGE_CREATE_MODE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {createMode === "standalone" ? (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Тип страницы</span>
                  <select className={styles.select} value={createType} onChange={(event) => {
                    setCreateType(event.target.value);
                    setCreateError("");
                  }}>
                    <option value="about">О нас</option>
                    <option value="contacts">Контакты</option>
                  </select>
                </div>
              ) : null}

              {createMode === "from_service" ? (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Источник «Услуга»</span>
                  <select className={styles.select} name="primaryServiceId" value={createPrimaryServiceId} onChange={(event) => setCreatePrimaryServiceId(event.target.value)}>
                    <option value="">Выберите услугу</option>
                    {serviceOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {createMode === "from_equipment" ? (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Источник «Техника»</span>
                  <select className={styles.select} name="primaryEquipmentId" value={createPrimaryEquipmentId} onChange={(event) => setCreatePrimaryEquipmentId(event.target.value)}>
                    <option value="">Выберите технику</option>
                    {equipmentOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {createMode === "clone_adapt" ? (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Какая страница берется за основу</span>
                  <select className={styles.select} name="cloneFromPageId" value={createCloneFromPageId} onChange={(event) => setCreateCloneFromPageId(event.target.value)}>
                    <option value="">Выберите страницу</option>
                    {cloneOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.label} · {PAGE_TYPE_LABELS[item.pageType] || item.pageType}</option>
                    ))}
                  </select>
                </div>
              ) : null}

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
                  placeholder="Например, Аренда экскаватора"
                  required
                />
              </div>

              {createMode !== "standalone" ? (
                <>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Гео-метка</span>
                    <input className={styles.input} name="geoLabel" value={createGeoLabel} onChange={(event) => setCreateGeoLabel(event.target.value)} placeholder="Например, Сочи и Адлер" />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Город</span>
                    <input className={styles.input} name="city" value={createCity} onChange={(event) => setCreateCity(event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Район</span>
                    <input className={styles.input} name="district" value={createDistrict} onChange={(event) => setCreateDistrict(event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Зона выезда</span>
                    <input className={styles.input} name="serviceArea" value={createServiceArea} onChange={(event) => setCreateServiceArea(event.target.value)} />
                  </div>
                </>
              ) : null}

              <p className={styles.createHint}>
                {createMode === "standalone"
                  ? "Для отдельных страниц на старте достаточно типа и названия. Маршрут и SEO остаются в слое метаданных."
                  : createMode === "clone_adapt"
                    ? "Копия создается как новая страница и сразу открывается в том же рабочем экране."
                    : "Для коммерческой страницы источник привязывается сразу, чтобы редактор открылся уже с доменным контекстом."}
              </p>

              <div className={styles.createActions}>
                <Link href={createFallbackHref} className={styles.ghostLink}>
                  Полный fallback-маршрут
                </Link>
                <div className={styles.createButtons}>
                  <button type="button" className={styles.toggle} onClick={() => setCreateOpen(false)}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.primaryButton} disabled={createDisabled}>
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
