"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { RelationChipRow } from "./RelationChipRow";
import { ADMIN_COPY } from "../../lib/ui-copy.js";
import { buildRelationSelectionModel } from "../../lib/admin/relation-navigation.js";
import styles from "./admin-ui.module.css";

export function MediaPicker({
  legend,
  name,
  assets,
  selectedIds = [],
  selectionMode = "single",
  hint = null,
  selectionEmptyLabel = "Нет выбранного медиа",
  sourceHref = ""
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const initialSelectedKey = useMemo(() => selectedIds.join("|"), [selectedIds]);
  const [selectedValues, setSelectedValues] = useState(() => [...selectedIds]);

  useEffect(() => {
    setSelectedValues([...selectedIds]);
  }, [initialSelectedKey]);

  const pickerOptions = useMemo(
    () => assets.map((asset) => ({
      id: asset.id,
      label: asset.title || asset.originalFilename || ADMIN_COPY.untitledAsset,
      subtitle: "Медиафайл",
      meta: asset.whereUsedLabel || ADMIN_COPY.fieldValueNotUsedYet,
      previewUrl: asset.previewUrl,
      alt: asset.alt,
      originalFilename: asset.originalFilename
    })),
    [assets]
  );

  const selectionModel = useMemo(
    () => buildRelationSelectionModel({
      entityType: "media_asset",
      options: pickerOptions,
      selectedIds: selectedValues,
      returnTo: sourceHref,
      emptyLabel: selectionEmptyLabel,
      fallbackLabel: ADMIN_COPY.untitledAsset
    }),
    [pickerOptions, selectedValues, sourceHref, selectionEmptyLabel]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return selectionModel.optionRows;
    }

    return selectionModel.optionRows.filter((asset) => {
      const haystack = [asset.label, asset.subtitle, asset.meta].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, selectionModel.optionRows]);

  function toggleAsset(assetId) {
    setSelectedValues((current) => {
      const hasAsset = current.includes(assetId);

      if (selectionMode === "single") {
        return hasAsset ? current : [assetId];
      }

      return hasAsset ? current.filter((id) => id !== assetId) : [...current, assetId];
    });
  }

  function removeSelected(assetId) {
    setSelectedValues((current) => current.filter((id) => id !== assetId));
  }

  function focusSearch() {
    searchRef.current?.focus();
  }

  return (
    <fieldset className={styles.pickerFieldset}>
      <legend className={styles.pickerLegend}>{legend}</legend>
      {hint ? <p className={styles.helpText}>{hint}</p> : null}

      {selectionModel.missingSelectedIds.length > 0 ? (
        <>
          {selectionModel.missingSelectedIds.map((id) => (
            <input key={`missing-media-${id}`} type="hidden" name={name} value={id} />
          ))}
        </>
      ) : null}

      <RelationChipRow
        title="Выбранное медиа"
        note={
          selectionModel.isPartial
            ? "Часть выбранного медиа не найдена в списке, но сохранена как резервный переход."
            : "Текущие выбранные файлы показаны здесь и в виде чипов."
        }
        items={selectionModel.items.map((item) => ({
          ...item,
          actionLabel: item.actionLabel || "Открыть"
        }))}
        emptyLabel={selectionEmptyLabel}
        onAdd={focusSearch}
        onRemove={removeSelected}
      />

      <label className={styles.searchLabel}>
        <span>{ADMIN_COPY.search}</span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.searchInput}
          placeholder={ADMIN_COPY.filterByMedia}
        />
      </label>
      <p className={styles.helpText}>
        Новый файл добавляйте в разделе <Link href="/admin/entities/media_asset">Медиа</Link>. Здесь выбираются уже загруженные файлы.
      </p>
      <div className={styles.mediaGrid}>
        {filtered.length === 0 ? (
          <p className={styles.emptyHint}>{ADMIN_COPY.noMatchingMedia}</p>
        ) : (
          filtered.map((asset) => (
            <label
              key={asset.id}
              className={`${styles.mediaCard} ${asset.selected ? styles.mediaCardSelected : ""}`}
            >
              <input
                type={selectionMode === "single" ? "radio" : "checkbox"}
                name={name}
                value={asset.id}
                checked={Boolean(asset.selected)}
                onChange={() => toggleAsset(asset.id)}
              />
              <span className={styles.mediaThumb}>
                {asset.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.previewUrl} alt={asset.alt || asset.label || asset.originalFilename || ADMIN_COPY.noPreview} />
                ) : (
                  <span className={styles.mediaPlaceholder}>{ADMIN_COPY.noPreview}</span>
                )}
              </span>
              <span className={styles.mediaInfo}>
                <strong>{asset.label || asset.originalFilename || ADMIN_COPY.untitledAsset}</strong>
                <span>Описание изображения: {asset.alt || ADMIN_COPY.fieldValueNone}</span>
                <span>{ADMIN_COPY.whereUsed}: {asset.meta || ADMIN_COPY.fieldValueNotUsedYet}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
