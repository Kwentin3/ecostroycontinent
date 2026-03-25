"use client";

import { useMemo, useState } from "react";

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
        <span>Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.searchInput}
          placeholder="Filter by title, alt, or filename"
        />
      </label>
      <div className={styles.mediaGrid}>
        {filtered.length === 0 ? (
          <p className={styles.emptyHint}>No matching media assets.</p>
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
                  <img src={asset.previewUrl} alt={asset.alt || asset.title || asset.originalFilename || "Preview"} />
                ) : (
                  <span className={styles.mediaPlaceholder}>No preview</span>
                )}
              </span>
              <span className={styles.mediaInfo}>
                <strong>{asset.title || asset.originalFilename || "Untitled asset"}</strong>
                <span>Alt: {asset.alt || "none"}</span>
                <span>Where used: {asset.whereUsedLabel || "not used yet"}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
