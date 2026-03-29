"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { RelationChipRow } from "./RelationChipRow";
import { ADMIN_COPY } from "../../lib/ui-copy.js";
import { buildRelationSelectionModel } from "../../lib/admin/relation-navigation.js";
import styles from "./admin-ui.module.css";

export function FilterableChecklist({
  legend,
  name,
  options,
  selectedIds = [],
  selectionMode = "multiple",
  hint = null,
  emptyLabel = ADMIN_COPY.noMatchingItems,
  selectionEmptyLabel = "Нет связанных сущностей",
  entityType,
  sourceHref = ""
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const initialSelectedKey = useMemo(() => selectedIds.join("|"), [selectedIds]);
  const [selectedValues, setSelectedValues] = useState(() => [...selectedIds]);

  useEffect(() => {
    setSelectedValues([...selectedIds]);
  }, [initialSelectedKey]);

  const selectionModel = useMemo(
    () => buildRelationSelectionModel({
      entityType,
      options,
      selectedIds: selectedValues,
      returnTo: sourceHref,
      emptyLabel: selectionEmptyLabel
    }),
    [entityType, options, selectedValues, sourceHref, selectionEmptyLabel]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return selectionModel.optionRows;
    }

    return selectionModel.optionRows.filter((option) => {
      const haystack = [option.label, option.subtitle, option.meta].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, selectionModel.optionRows]);

  function toggleOption(optionId) {
    setSelectedValues((current) => {
      const hasOption = current.includes(optionId);

      if (selectionMode === "single") {
        return hasOption ? current : [optionId];
      }

      return hasOption ? current.filter((id) => id !== optionId) : [...current, optionId];
    });
  }

  function removeSelected(optionId) {
    setSelectedValues((current) => current.filter((id) => id !== optionId));
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
            <input key={`missing-${id}`} type="hidden" name={name} value={id} />
          ))}
        </>
      ) : null}

      <RelationChipRow
        title="Текущие связи"
        note={
          selectionModel.isPartial
            ? "Часть выбранных связей не найдена в списке, но сохранена как резервный переход."
            : "Текущие выбранные связи показаны здесь и в виде чипов."
        }
        items={selectionModel.items}
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
          placeholder={ADMIN_COPY.filterByTitle}
        />
      </label>

      <div className={styles.optionList}>
        {filtered.length === 0 ? (
          <p className={styles.emptyHint}>{emptyLabel}</p>
        ) : (
          filtered.map((option) => (
            <label
              key={option.id}
              className={`${styles.optionCard} ${option.selected ? styles.optionCardSelected : ""}`}
            >
              <input
                type={selectionMode === "single" ? "radio" : "checkbox"}
                name={name}
                value={option.id}
                checked={Boolean(option.selected)}
                onChange={() => toggleOption(option.id)}
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
