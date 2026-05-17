"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PUBLIC_COPY } from "../../lib/ui-copy.js";
import styles from "./public-ui.module.css";

const SCROLL_EDGE_TOLERANCE = 4;

export function ListCardMediaStrip({ assets = [], label = "Изображения услуги" }) {
  const stripRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    canScrollBack: false,
    canScrollForward: false
  });

  const updateScrollState = useCallback(() => {
    const strip = stripRef.current;

    if (!strip) {
      return;
    }

    const maxScrollLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
    const scrollLeft = Math.max(0, strip.scrollLeft);

    setScrollState({
      canScroll: maxScrollLeft > SCROLL_EDGE_TOLERANCE,
      canScrollBack: scrollLeft > SCROLL_EDGE_TOLERANCE,
      canScrollForward: scrollLeft < maxScrollLeft - SCROLL_EDGE_TOLERANCE
    });
  }, []);

  useEffect(() => {
    updateScrollState();

    const strip = stripRef.current;

    if (!strip) {
      return undefined;
    }

    strip.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateScrollState)
      : null;
    resizeObserver?.observe(strip);

    window.addEventListener("resize", updateScrollState);

    return () => {
      strip.removeEventListener("scroll", updateScrollState);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByPage = (direction) => {
    const strip = stripRef.current;

    if (!strip) {
      return;
    }

    strip.scrollBy({
      left: direction * Math.max(96, Math.floor(strip.clientWidth * 0.8)),
      behavior: "smooth"
    });
  };

  if (!Array.isArray(assets) || assets.length === 0) {
    return null;
  }

  return (
    <div className={styles.listCardMediaFrame} aria-label={label}>
      {scrollState.canScroll ? (
        <button
          type="button"
          className={`${styles.listCardMediaArrow} ${styles.listCardMediaArrowBack}`}
          onClick={() => scrollByPage(-1)}
          disabled={!scrollState.canScrollBack}
          aria-label="Показать предыдущие изображения"
        >
          ‹
        </button>
      ) : null}
      <div ref={stripRef} className={styles.listCardMediaStrip}>
        {assets.map((asset) => (
          <figure key={asset.entityId || asset.previewUrl}>
            <img src={asset.previewUrl} alt={asset.alt || PUBLIC_COPY.imageFallback} />
          </figure>
        ))}
      </div>
      {scrollState.canScroll ? (
        <button
          type="button"
          className={`${styles.listCardMediaArrow} ${styles.listCardMediaArrowForward}`}
          onClick={() => scrollByPage(1)}
          disabled={!scrollState.canScrollForward}
          aria-label="Показать следующие изображения"
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
