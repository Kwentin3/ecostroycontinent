"use client";

import { useEffect, useRef } from "react";

const ENDPOINT = "/api/analytics/events";
const ANONYMOUS_KEY = "esc_analytics_anonymous_id";
const SESSION_KEY = "esc_analytics_session_id";
const SESSION_STARTED_KEY = "esc_analytics_session_started_at";
const SESSION_TTL_MS = 30 * 60 * 1000;
const SCROLL_MILESTONES = [25, 50, 75, 100];

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeStorageGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return "";
  }
}

function safeStorageSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Analytics must never break the public UI.
  }
}

function getAnonymousId() {
  const existing = safeStorageGet(window.localStorage, ANONYMOUS_KEY);

  if (existing) {
    return existing;
  }

  const next = createId("anon");
  safeStorageSet(window.localStorage, ANONYMOUS_KEY, next);
  return next;
}

function getSessionId() {
  const now = Date.now();
  const startedAt = Number(safeStorageGet(window.sessionStorage, SESSION_STARTED_KEY) || 0);
  const existing = safeStorageGet(window.sessionStorage, SESSION_KEY);

  if (existing && startedAt && now - startedAt < SESSION_TTL_MS) {
    safeStorageSet(window.sessionStorage, SESSION_STARTED_KEY, String(now));
    return existing;
  }

  const next = createId("session");
  safeStorageSet(window.sessionStorage, SESSION_KEY, next);
  safeStorageSet(window.sessionStorage, SESSION_STARTED_KEY, String(now));
  return next;
}

function deviceType() {
  const width = window.innerWidth || 0;

  if (width < 640) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function viewportBucket() {
  const width = window.innerWidth || 0;

  if (width < 640) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function visibleText(element) {
  return (element.getAttribute("aria-label")
    || element.getAttribute("title")
    || element.textContent
    || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function targetPath(element) {
  const href = element.getAttribute("href") || "";

  if (!href || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return "";
  }

  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return "";
  }
}

function metadataFor(element, extra = {}) {
  return {
    analytics_id: element.dataset.analyticsId || "",
    section_id: element.dataset.analyticsSection || "",
    target_type: element.dataset.analyticsTargetType || "",
    target_id: element.dataset.analyticsTargetId || "",
    target_path: targetPath(element),
    label: visibleText(element),
    cta_variant: element.dataset.analyticsCtaVariant || "",
    nav_item: element.dataset.analyticsNavItem || "",
    gallery_id: element.dataset.analyticsGalleryId || "",
    case_id: element.dataset.analyticsTargetType === "case" ? element.dataset.analyticsTargetId || "" : "",
    service_id: element.dataset.analyticsTargetType === "service" ? element.dataset.analyticsTargetId || "" : "",
    form_id: element.dataset.analyticsFormId || "",
    ...extra
  };
}

function trimMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
      .map(([key, value]) => [key, String(value)])
  );
}

function send(payload) {
  if (window.location.pathname.startsWith("/admin")) {
    return;
  }

  const body = JSON.stringify({
    timestamp: new Date().toISOString(),
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    page_path: window.location.pathname,
    referrer: document.referrer || "",
    device_type: deviceType(),
    viewport_width: window.innerWidth || 0,
    viewport_height: window.innerHeight || 0,
    viewport_bucket: viewportBucket(),
    ...payload,
    metadata: trimMetadata(payload.metadata || {})
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
    return;
  }

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {});
}

export function AnalyticsTracker() {
  const viewedElementsRef = useRef(new Set());
  const scrollMilestonesRef = useRef(new Set());

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      return undefined;
    }

    send({
      event_type: "page_view",
      element_id: "page",
      metadata: {
        analytics_id: "page",
        section_id: "page"
      }
    });

    const handleClick = (event) => {
      const element = event.target?.closest?.("[data-analytics-event]");

      if (!element) {
        return;
      }

      const eventType = element.dataset.analyticsEvent;

      if (!eventType || eventType === "cta_view") {
        return;
      }

      send({
        event_type: eventType,
        element_id: element.dataset.analyticsId || eventType,
        entity_type: element.dataset.analyticsEntityType || undefined,
        entity_id: element.dataset.analyticsEntityId || undefined,
        metadata: metadataFor(element)
      });
    };

    document.addEventListener("click", handleClick, true);

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.4) {
              continue;
            }

            const element = entry.target;
            const id = element.dataset.analyticsId || element.id || "cta_view";

            if (viewedElementsRef.current.has(id)) {
              continue;
            }

            viewedElementsRef.current.add(id);
            const viewEventType = element.dataset.analyticsView || "cta_view";

            send({
              event_type: viewEventType,
              element_id: id,
              entity_type: element.dataset.analyticsEntityType || undefined,
              entity_id: element.dataset.analyticsEntityId || undefined,
              metadata: metadataFor(element)
            });
          }
        }, { threshold: [0.4] })
      : null;

    document.querySelectorAll("[data-analytics-view]").forEach((element) => observer?.observe(element));

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const height = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const depth = Math.min(100, Math.round((scrollTop / height) * 100));

      for (const milestone of SCROLL_MILESTONES) {
        if (depth >= milestone && !scrollMilestonesRef.current.has(milestone)) {
          scrollMilestonesRef.current.add(milestone);
          send({
            event_type: "scroll_depth",
            element_id: `scroll_${milestone}`,
            metadata: {
              analytics_id: `scroll_${milestone}`,
              section_id: "page",
              scroll_depth: String(milestone),
              scroll_depth_bucket: `${milestone}`
            }
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
    };
  }, []);

  return null;
}
