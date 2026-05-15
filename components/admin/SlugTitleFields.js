"use client";

import { useRef, useState } from "react";

import { normalizeSlug } from "../../lib/utils/slug.js";
import styles from "./admin-ui.module.css";

export function SlugTitleFields({
  slugDefault = "",
  titleDefault = "",
  slugLabel = "Короткий адрес",
  titleLabel = "Название",
  slugName = "slug",
  titleName = "title",
  required = true
}) {
  const [title, setTitle] = useState(titleDefault);
  const [slug, setSlug] = useState(slugDefault);
  // Existing slugs stay manual by default so a title edit does not silently move the route.
  const slugManuallyEdited = useRef(Boolean(slugDefault));

  function handleTitleChange(event) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);

    if (!slugManuallyEdited.current) {
      setSlug(normalizeSlug(nextTitle));
    }
  }

  function handleSlugChange(event) {
    const nextSlug = normalizeSlug(event.target.value);
    setSlug(nextSlug);
    slugManuallyEdited.current = Boolean(nextSlug);
  }

  function handleSlugBlur() {
    if (!slug && title) {
      setSlug(normalizeSlug(title));
      slugManuallyEdited.current = false;
    }
  }

  return (
    <>
      <label className={styles.label}>
        <span>{slugLabel}</span>
        <input
          name={slugName}
          value={slug}
          onChange={handleSlugChange}
          onBlur={handleSlugBlur}
          required={required}
        />
        <p className={styles.helpText}>Заполняется из названия, пока короткий адрес не изменён вручную.</p>
      </label>
      <label className={styles.label}>
        <span>{titleLabel}</span>
        <input
          name={titleName}
          value={title}
          onChange={handleTitleChange}
          required={required}
        />
      </label>
    </>
  );
}
