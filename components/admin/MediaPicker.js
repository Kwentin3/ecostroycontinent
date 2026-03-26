"use client";

import { useMemo, useState } from "react";

import { ADMIN_COPY } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

export function MediaPicker({
  legend,
  name,
  assets,
  selectedIds = [],
  selectionMode = "single"
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return assets;
    }

    return assets.filter((asset) => {
      const haystack = [asset.title, asset.alt, asset.originalFilename, asset.whereUsedLabel].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [assets, query]);

  return (
    <fieldset className={styles.pickerFieldset}>
      <legend className={styles.pickerLegend}>{legend}</legend>
      <label className={styles.searchLabel}>
        <span>{ADMIN_COPY.search}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.searchInput}
          placeholder={ADMIN_COPY.filterByMedia}
        />
      </label>
      <div className={styles.mediaGrid}>
        {filtered.length === 0 ? (
          <p className={styles.emptyHint}>{ADMIN_COPY.noMatchingMedia}</p>
        ) : (
          filtered.map((asset) => (
            <label key={asset.id} className={styles.mediaCard}>
              <input
                type={selectionMode === "single" ? "radio" : "checkbox"}
                name={name}
                value={asset.id}
                defaultChecked={selectedIds.includes(asset.id)}
              />
              <span className={styles.mediaThumb}>
                {asset.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.previewUrl} alt={asset.alt || asset.title || asset.originalFilename || ADMIN_COPY.noPreview} />
                ) : (
                  <span className={styles.mediaPlaceholder}>{ADMIN_COPY.noPreview}</span>
                )}
              </span>
              <span className={styles.mediaInfo}>
                <strong>{asset.title || asset.originalFilename || ADMIN_COPY.untitledAsset}</strong>
                <span>Описание изображения: {asset.alt || ADMIN_COPY.fieldValueNone}</span>
                <span>{ADMIN_COPY.whereUsed}: {asset.whereUsedLabel || ADMIN_COPY.fieldValueNotUsedYet}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
