"use client";

import { useEffect, useRef } from "react";

const ENDPOINT = "/api/telemetry/events";
const EVENT_VERSION = "1.0";
const SUPPORTED_EVENTS = new Set([
  "page_viewed",
  "page_engagement_recorded",
  "service_card_opened",
  "case_card_opened",
  "gallery_opened",
  "cta_clicked",
  "phone_clicked",
  "email_clicked",
  "messenger_clicked"
]);

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

function inferContactChannel(href = "") {
  if (href.startsWith("tel:")) {
    return "phone";
  }

  if (href.startsWith("mailto:")) {
    return "email";
  }

  if (/t\.me|telegram/i.test(href)) {
    return "telegram";
  }

  if (/wa\.me|whatsapp/i.test(href)) {
    return "whatsapp";
  }

  if (/viber|vk\.com|max/i.test(href)) {
    return "messenger";
  }

  return "";
}

function inferEventName(element) {
  const explicitEvent = element.dataset.analyticsEvent || "";
  const href = element.getAttribute("href") || "";
  const channel = inferContactChannel(href);

  if (channel === "phone") {
    return "phone_clicked";
  }

  if (channel === "email") {
    return "email_clicked";
  }

  if (channel) {
    return "messenger_clicked";
  }

  return explicitEvent;
}

function metadataFor(element, extra = {}) {
  return trimMetadata({
    analytics_id: element.dataset.analyticsId || "",
    section_id: element.dataset.analyticsSection || "",
    target_type: element.dataset.analyticsTargetType || "",
    target_id: element.dataset.analyticsTargetId || "",
    target_path: targetPath(element),
    label: visibleText(element),
    cta_kind: element.dataset.analyticsCtaKind || "",
    destination_kind: element.dataset.analyticsDestinationKind || "",
    nav_item: element.dataset.analyticsNavItem || "",
    gallery_id: element.dataset.analyticsGalleryId || "",
    card_action: element.dataset.analyticsCardAction || "",
    source_entity_type: element.dataset.analyticsEntityType || "",
    source_entity_id: element.dataset.analyticsEntityId || "",
    ...extra
  });
}

function trimMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
      .map(([key, value]) => [key, String(value).slice(0, 180)])
  );
}

function currentPath() {
  return `${window.location.pathname}${window.location.search || ""}`;
}

function scrollDepth() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const height = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

  return Math.min(100, Math.max(0, Math.round((scrollTop / height) * 100)));
}

function send(payload, { beacon = false } = {}) {
  if (window.location.pathname.startsWith("/admin")) {
    return;
  }

  const body = JSON.stringify({
    event_version: EVENT_VERSION,
    page_path: currentPath(),
    page_title: document.title || "",
    referrer: document.referrer || "",
    ...payload,
    metadata: trimMetadata(payload.metadata || {})
  });

  if (beacon && navigator.sendBeacon) {
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

function rootContextFor(element) {
  const targetType = element.dataset.analyticsTargetType || "";
  const targetId = element.dataset.analyticsTargetId || "";

  return {
    placement: element.dataset.analyticsSection || "",
    entity_type: targetType || element.dataset.analyticsEntityType || undefined,
    entity_id: targetId || element.dataset.analyticsEntityId || undefined,
    contact_channel: element.dataset.analyticsContactChannel || inferContactChannel(element.getAttribute("href") || "") || undefined
  };
}

export function AnalyticsTracker() {
  const viewedElementsRef = useRef(new Set());
  const engagementSentRef = useRef(false);
  const activeStartedAtRef = useRef(0);
  const activeTimeRef = useRef(0);
  const maxScrollDepthRef = useRef(0);

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      return undefined;
    }

    activeStartedAtRef.current = document.visibilityState === "hidden" ? 0 : Date.now();

    const getActiveTime = () => {
      if (activeStartedAtRef.current) {
        return activeTimeRef.current + (Date.now() - activeStartedAtRef.current);
      }

      return activeTimeRef.current;
    };

    const updateScrollDepth = () => {
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, scrollDepth());
    };

    const flushEngagement = (reason, { beacon = false } = {}) => {
      updateScrollDepth();

      const activeTimeMs = Math.min(30 * 60 * 1000, Math.round(getActiveTime()));

      if (engagementSentRef.current || (activeTimeMs < 1000 && maxScrollDepthRef.current < 25)) {
        return;
      }

      engagementSentRef.current = true;
      send({
        event_name: "page_engagement_recorded",
        placement: "page",
        active_time_ms: activeTimeMs,
        max_scroll_depth: maxScrollDepthRef.current,
        metadata: {
          analytics_id: "page_engagement",
          section_id: "page",
          flush_reason: reason
        }
      }, { beacon });
    };

    send({
      event_name: "page_viewed",
      placement: "page",
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

      const eventName = inferEventName(element);

      if (!SUPPORTED_EVENTS.has(eventName) || eventName === "page_viewed") {
        return;
      }

      updateScrollDepth();
      send({
        event_name: eventName,
        ...rootContextFor(element),
        active_time_ms: Math.min(30 * 60 * 1000, Math.round(getActiveTime())),
        max_scroll_depth: maxScrollDepthRef.current,
        metadata: metadataFor(element)
      }, { beacon: eventName.endsWith("_clicked") });
    };

    document.addEventListener("click", handleClick, true);

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.4) {
              continue;
            }

            const element = entry.target;
            const eventName = element.dataset.analyticsView || "";
            const id = element.dataset.analyticsId || element.id || eventName;

            if (!SUPPORTED_EVENTS.has(eventName) || viewedElementsRef.current.has(id)) {
              continue;
            }

            viewedElementsRef.current.add(id);
            send({
              event_name: eventName,
              ...rootContextFor(element),
              metadata: metadataFor(element)
            });
          }
        }, { threshold: [0.4] })
      : null;

    document.querySelectorAll("[data-analytics-view]").forEach((element) => observer?.observe(element));

    const handleScroll = () => {
      updateScrollDepth();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (activeStartedAtRef.current) {
          activeTimeRef.current += Date.now() - activeStartedAtRef.current;
          activeStartedAtRef.current = 0;
        }

        flushEngagement("visibility_hidden", { beacon: true });
        return;
      }

      if (!activeStartedAtRef.current) {
        activeStartedAtRef.current = Date.now();
      }
    };

    const handlePageHide = () => {
      if (activeStartedAtRef.current) {
        activeTimeRef.current += Date.now() - activeStartedAtRef.current;
        activeStartedAtRef.current = 0;
      }

      flushEngagement("pagehide", { beacon: true });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      observer?.disconnect();
      flushEngagement("unmount", { beacon: true });
    };
  }, []);

  return null;
}
