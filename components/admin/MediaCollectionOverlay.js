"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./admin-ui.module.css";

const NEW_COLLECTION_ID = "__new_collection__";

function normalizeCollectionFields(collection, seedAssetId = "") {
  const assetIds = [...new Set([...(collection?.assetIds ?? []), seedAssetId].filter(Boolean))];
  const requestedPrimary = collection?.primaryAssetId || seedAssetId || "";
  const primaryAssetId = requestedPrimary && assetIds.includes(requestedPrimary) ? requestedPrimary : assetIds[0] || "";
  const seo = collection?.seo ?? {};

  return {
    title: collection?.title || "",
    caption: collection?.caption || "",
    assetIds,
    primaryAssetId,
    changeIntent: "",
    metaTitle: seo.metaTitle || "",
    metaDescription: seo.metaDescription || "",
    canonicalIntent: seo.canonicalIntent || "",
    indexationFlag: seo.indexationFlag || "index",
    openGraphTitle: seo.openGraphTitle || "",
    openGraphDescription: seo.openGraphDescription || "",
    openGraphImageAssetId: seo.openGraphImageAssetId || ""
  };
}

function createEmptyCollectionFields(seedAssetId = "") {
  return normalizeCollectionFields(
    {
      title: "",
      caption: "",
      assetIds: seedAssetId ? [seedAssetId] : [],
      primaryAssetId: seedAssetId || "",
      seo: {}
    },
    seedAssetId
  );
}

function findInitialCollectionId({ collections, initialCollectionId, createNew }) {
  if (createNew || collections.length === 0) {
    return NEW_COLLECTION_ID;
  }

  if (initialCollectionId && collections.some((item) => item.id === initialCollectionId)) {
    return initialCollectionId;
  }

  return collections[0]?.id || NEW_COLLECTION_ID;
}

function buildAssetHaystack(item) {
  return [item.title, item.alt, item.originalFilename, item.collectionLabel].filter(Boolean).join(" ").toLowerCase();
}

export function MediaCollectionOverlay({
  open,
  busy,
  error,
  collections,
  mediaItems,
  initialCollectionId = "",
  seedAssetId = "",
  createNew = false,
  onClose,
  onSave
}) {
  const dialogRef = useRef(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState(NEW_COLLECTION_ID);
  const [collectionQuery, setCollectionQuery] = useState("");
  const [assetQuery, setAssetQuery] = useState("");
  const [fields, setFields] = useState(() => createEmptyCollectionFields(seedAssetId));

  const collectionMap = useMemo(() => new Map(collections.map((item) => [item.id, item])), [collections]);
  const mediaMap = useMemo(() => new Map(mediaItems.map((item) => [item.id, item])), [mediaItems]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextCollectionId = findInitialCollectionId({
      collections,
      initialCollectionId,
      createNew
    });
    const selectedCollection = collectionMap.get(nextCollectionId) ?? null;

    setSelectedCollectionId(nextCollectionId);
    setCollectionQuery("");
    setAssetQuery("");
    setFields(
      nextCollectionId === NEW_COLLECTION_ID
        ? createEmptyCollectionFields(seedAssetId)
        : normalizeCollectionFields(selectedCollection, seedAssetId)
    );

    queueMicrotask(() => dialogRef.current?.focus());
  }, [open, collections, collectionMap, initialCollectionId, seedAssetId, createNew]);

  const filteredCollections = useMemo(() => {
    const normalized = collectionQuery.trim().toLowerCase();

    if (!normalized) {
      return collections;
    }

    return collections.filter((item) => {
      const haystack = [item.title, item.caption, item.whereUsedLabel].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [collectionQuery, collections]);

  const filteredAssets = useMemo(() => {
    const normalized = assetQuery.trim().toLowerCase();

    if (!normalized) {
      return mediaItems;
    }

    return mediaItems.filter((item) => buildAssetHaystack(item).includes(normalized));
  }, [assetQuery, mediaItems]);

  const selectedCollection = selectedCollectionId === NEW_COLLECTION_ID ? null : collectionMap.get(selectedCollectionId) ?? null;
  const selectedAssets = fields.assetIds.map((assetId) => mediaMap.get(assetId)).filter(Boolean);
  const openGraphOptions = mediaItems.map((item) => ({
    id: item.id,
    label: item.title || item.originalFilename || item.id
  }));

  if (!open) {
    return null;
  }

  function applyCollectionSelection(nextCollectionId) {
    setSelectedCollectionId(nextCollectionId);

    if (nextCollectionId === NEW_COLLECTION_ID) {
      setFields(createEmptyCollectionFields(seedAssetId));
      return;
    }

    const nextCollection = collectionMap.get(nextCollectionId) ?? null;
    setFields(normalizeCollectionFields(nextCollection, seedAssetId));
  }

  function updateField(field, value) {
    setFields((current) => ({
      ...current,
      [field]: value
    }));
  }

  function toggleAsset(assetId) {
    setFields((current) => {
      const hasAsset = current.assetIds.includes(assetId);
      const assetIds = hasAsset
        ? current.assetIds.filter((id) => id !== assetId)
        : [...current.assetIds, assetId];
      const primaryAssetId = assetIds.includes(current.primaryAssetId) ? current.primaryAssetId : assetIds[0] || "";

      return {
        ...current,
        assetIds,
        primaryAssetId
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSave({
      entityId: selectedCollectionId === NEW_COLLECTION_ID ? "" : selectedCollectionId,
      fields
    });
  }

  return (
    <div className={styles.mediaOverlayBackdrop}>
      <div
        ref={dialogRef}
        className={`${styles.mediaOverlayDialog} ${styles.collectionOverlayDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-overlay-title"
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
            <p className={styles.eyebrow}>Коллекции</p>
            <h3 id="collection-overlay-title" className={styles.mediaOverlayTitle}>
              {selectedCollection ? "Редактор коллекции" : "Новая коллекция"}
            </h3>
            <p className={styles.helpText}>
              Коллекция остаётся отдельной сущностью, но теперь собирается прямо внутри media workspace без прыжка в отдельный экран.
            </p>
          </div>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
            Закрыть
          </button>
        </div>

        {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}

        <div className={styles.collectionOverlayLayout}>
          <aside className={styles.collectionOverlaySidebar}>
            <div className={styles.collectionOverlaySidebarHeader}>
              <label className={styles.searchLabel}>
                <span>Поиск коллекции</span>
                <input
                  type="search"
                  value={collectionQuery}
                  onChange={(event) => setCollectionQuery(event.target.value)}
                  className={styles.searchInput}
                  placeholder="Название или usage"
                />
              </label>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => applyCollectionSelection(NEW_COLLECTION_ID)}
                disabled={busy}
              >
                Новая коллекция
              </button>
            </div>

            <div className={styles.collectionList}>
              <button
                type="button"
                className={`${styles.collectionListItem} ${selectedCollectionId === NEW_COLLECTION_ID ? styles.collectionListItemActive : ""}`}
                onClick={() => applyCollectionSelection(NEW_COLLECTION_ID)}
              >
                <strong>Новая коллекция</strong>
                <span className={styles.mutedText}>Создать подборку прямо из текущих media cards.</span>
              </button>

              {filteredCollections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  className={`${styles.collectionListItem} ${selectedCollectionId === collection.id ? styles.collectionListItemActive : ""}`}
                  onClick={() => applyCollectionSelection(collection.id)}
                >
                  <strong>{collection.title}</strong>
                  <span className={styles.mutedText}>
                    {collection.memberCount} файлов • {collection.statusLabel}
                  </span>
                  <span className={styles.mutedText}>{collection.whereUsedLabel}</span>
                </button>
              ))}
            </div>
          </aside>

          <form className={styles.collectionOverlayForm} onSubmit={handleSubmit}>
            {seedAssetId ? (
              <div className={styles.statusPanelInfo}>
                Текущий выбранный ассет будет сразу доступен в составе коллекции. Если он не нужен, его можно снять из списка ниже.
              </div>
            ) : null}

            <div className={styles.gridTwo}>
              <label className={styles.label}>
                <span>Название коллекции</span>
                <input
                  name="title"
                  value={fields.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Например, Фасады и утепление"
                />
              </label>
              <label className={styles.label}>
                <span>Главный кадр</span>
                <select
                  name="primaryAssetId"
                  value={fields.primaryAssetId}
                  onChange={(event) => updateField("primaryAssetId", event.target.value)}
                >
                  <option value="">Не выбран</option>
                  {selectedAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title || asset.originalFilename || asset.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${styles.label} ${styles.gridWide}`}>
                <span>Подпись коллекции</span>
                <textarea
                  name="caption"
                  value={fields.caption}
                  onChange={(event) => updateField("caption", event.target.value)}
                />
              </label>
              <label className={`${styles.label} ${styles.gridWide}`}>
                <span>Комментарий к изменению</span>
                <input
                  name="changeIntent"
                  value={fields.changeIntent}
                  onChange={(event) => updateField("changeIntent", event.target.value)}
                />
                <p className={styles.helpText}>
                  Комментарий необязателен, но он помогает потом быстрее понять, почему состав или главный кадр коллекции менялись.
                </p>
              </label>
            </div>

            <fieldset className={styles.pickerFieldset}>
              <legend className={styles.pickerLegend}>Состав коллекции</legend>
              <label className={styles.searchLabel}>
                <span>Поиск по медиа</span>
                <input
                  type="search"
                  value={assetQuery}
                  onChange={(event) => setAssetQuery(event.target.value)}
                  className={styles.searchInput}
                  placeholder="Название, alt, имя файла"
                />
              </label>
              <div className={styles.mediaGrid}>
                {filteredAssets.map((asset) => (
                  <label key={asset.id} className={styles.mediaCard}>
                    <input
                      type="checkbox"
                      checked={fields.assetIds.includes(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                    />
                    <span className={styles.mediaThumb}>
                      {asset.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.previewUrl} alt={asset.alt || asset.title || asset.originalFilename || "Превью"} />
                      ) : (
                        <span className={styles.mediaPlaceholder}>Нет preview</span>
                      )}
                    </span>
                    <span className={styles.mediaInfo}>
                      <strong>{asset.title || asset.originalFilename || asset.id}</strong>
                      <span>Alt: {asset.alt || "не заполнен"}</span>
                      <span>Коллекции: {asset.collectionLabel}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <details className={styles.compactDisclosure}>
              <summary className={styles.compactDisclosureSummary}>
                <div className={styles.compactDisclosureSummaryMain}>
                  <strong>Дополнительно</strong>
                  <span className={styles.compactDisclosureSummaryMeta}>SEO и delivery metadata коллекции остаются доступны, но не шумят на главном экране.</span>
                </div>
                <span className={styles.compactDisclosureMarker} aria-hidden="true" />
              </summary>
              <div className={styles.compactDisclosureBody}>
                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    <span>SEO-заголовок</span>
                    <input value={fields.metaTitle} onChange={(event) => updateField("metaTitle", event.target.value)} />
                  </label>
                  <label className={styles.label}>
                    <span>Канонический адрес</span>
                    <input value={fields.canonicalIntent} onChange={(event) => updateField("canonicalIntent", event.target.value)} />
                  </label>
                  <label className={`${styles.label} ${styles.gridWide}`}>
                    <span>SEO-описание</span>
                    <textarea value={fields.metaDescription} onChange={(event) => updateField("metaDescription", event.target.value)} />
                  </label>
                  <label className={styles.label}>
                    <span>Индексация</span>
                    <select value={fields.indexationFlag} onChange={(event) => updateField("indexationFlag", event.target.value)}>
                      <option value="index">Индексировать</option>
                      <option value="noindex">Не индексировать</option>
                    </select>
                  </label>
                  <label className={styles.label}>
                    <span>OG-изображение</span>
                    <select value={fields.openGraphImageAssetId} onChange={(event) => updateField("openGraphImageAssetId", event.target.value)}>
                      <option value="">Не выбрано</option>
                      {openGraphOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.label}>
                    <span>OG-заголовок</span>
                    <input value={fields.openGraphTitle} onChange={(event) => updateField("openGraphTitle", event.target.value)} />
                  </label>
                  <label className={`${styles.label} ${styles.gridWide}`}>
                    <span>OG-описание</span>
                    <textarea value={fields.openGraphDescription} onChange={(event) => updateField("openGraphDescription", event.target.value)} />
                  </label>
                </div>
              </div>
            </details>

            <section className={styles.mediaInspectorSection}>
              <h4>Где используется коллекция</h4>
              {selectedCollection?.usageEntries?.length ? (
                <div className={styles.mediaUsageList}>
                  {selectedCollection.usageEntries.map((entry) => (
                    <Link key={entry.key} href={entry.href} className={styles.mediaUsageItem}>
                      <strong>{entry.entityLabel}</strong>
                      <span>{entry.title}</span>
                      <span className={styles.mutedText}>{entry.relationLabel} • {entry.statusLabel}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={styles.helpText}>
                  Эта коллекция пока никуда не привязана. После сохранения её можно выбирать в `Страницах`, `Кейсах` и `Услугах`.
                </p>
              )}
            </section>

            <div className={styles.mediaOverlayActions}>
              <button type="submit" className={styles.primaryButton} disabled={busy}>
                {busy ? "Сохраняем..." : selectedCollection ? "Сохранить коллекцию" : "Создать коллекцию"}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
