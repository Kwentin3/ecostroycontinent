"use client";

import { useMemo, useState } from "react";

import { ADMIN_COPY } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

export function FilterableChecklist({
  legend,
  name,
  options,
  selectedIds = [],
  selectionMode = "multiple",
  hint = null,
  emptyLabel = ADMIN_COPY.noMatchingItems
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [option.label, option.subtitle, option.meta].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query]);

  return (
    <fieldset className={styles.pickerFieldset}>
      <legend className={styles.pickerLegend}>{legend}</legend>
      {hint ? <p className={styles.helpText}>{hint}</p> : null}
      <label className={styles.searchLabel}>
        <span>{ADMIN_COPY.search}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.searchInput}
          placeholder={ADMIN_COPY.filterByTitle}
        />
      </label>
      <div className={styles.optionList}>
        {filtered.length === 0 ? (
          <p className={styles.emptyHint}>{emptyLabel}</p>
        ) : (
          filtered.map((option) => (
            <label key={option.id} className={styles.optionCard}>
              <input
                type={selectionMode === "single" ? "radio" : "checkbox"}
                name={name}
                value={option.id}
                defaultChecked={selectedIds.includes(option.id)}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionTitle}>{option.label}</span>
                {option.subtitle ? <span className={styles.optionSubtitle}>{option.subtitle}</span> : null}
                {option.meta ? <span className={styles.optionMeta}>{option.meta}</span> : null}
              </span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
