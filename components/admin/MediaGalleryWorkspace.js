"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";

// Media is value-sensitive in this project. Avoid creating test media here unless
// it is strictly necessary for verification, and always prefix disposable assets
// with `test__...` so they stay safely classifiable for later cleanup.
import { ConfirmActionForm } from "./ConfirmActionForm";
import {
  COLLECTION_FILTER_ALL,
  COLLECTION_FILTER_ORPHAN,
  matchesCollectionFilter
} from "../../lib/admin/media-gallery-filters";
import { appendAdminReturnTo } from "../../lib/admin/relation-navigation.js";
import {
  getRemovalMarkHref,
  getRemovalSweepHref,
  getRemovalUnmarkHref
} from "../../lib/admin/removal-quarantine.js";
import { MediaCollectionOverlay } from "./MediaCollectionOverlay";
import { MediaImageEditorPanel } from "./MediaImageEditorPanel";
import styles from "./admin-ui.module.css";

const FILTERS = [
  { key: "test-only", label: "РўРѕР»СЊРєРѕ С‚РµСЃС‚РѕРІС‹Рµ" },
  { key: "all", label: "Р’СЃРµ" },
  { key: "recent", label: "РќРµРґР°РІРЅРёРµ" },
  { key: "mine", label: "РњРѕРё" },
  { key: "missing-alt", label: "РќРµС‚ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅРѕРіРѕ С‚РµРєСЃС‚Р°" },
  { key: "orphan", label: "РЎРёСЂРѕС‚С‹" },
  { key: "used", label: "РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ" },
  { key: "unused", label: "РќРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ" },
  { key: "draft", label: "Р§РµСЂРЅРѕРІРёРєРё" },
  { key: "review", label: "РќР° РїСЂРѕРІРµСЂРєРµ" },
  { key: "published", label: "РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ" },
  { key: "archived", label: "Р’ Р°СЂС…РёРІРµ" },
  { key: "broken", label: "РџСЂРѕР±Р»РµРјРЅС‹Рµ" }
];

const STATUS_SORT_ORDER = {
  review: 0,
  draft: 1,
  published: 2
};

function getTestGraphTeardownHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/test-graph-teardown`;
}

function getDeletePreviewHref(entityType, entityId, returnTo = "") {
  return appendAdminReturnTo(`/admin/entities/${entityType}/${entityId}/delete`, returnTo);
}

function buildTitleFromFilename(filename) {
  const base = (filename || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return base || "РњРµРґРёР°С„Р°Р№Р»";
}

function formatBytes(value) {
  const bytes = Number(value || 0);

  if (!bytes) {
    return "Р Р°Р·РјРµСЂ РЅРµ СѓРєР°Р·Р°РЅ";
  }

  if (bytes < 1024) {
    return `${bytes} Р‘`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} РљР‘`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} РњР‘`;
}

function formatDate(value) {
  if (!value) {
    return "Р”Р°С‚Р° РЅРµ СѓРєР°Р·Р°РЅР°";
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return "Р”Р°С‚Р° РЅРµ СѓРєР°Р·Р°РЅР°";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(new Date(parsed));
}

function matchesFilter(item, filterKey, currentUsername) {
  switch (filterKey) {
    case "test-only":
      return item.isTestData;
    case "recent":
      return item.recent;
    case "mine":
      return Boolean(item.uploadedBy) && item.uploadedBy === currentUsername;
    case "missing-alt":
      return item.missingAlt;
    case "orphan":
      return item.orphaned;
    case "used":
      return item.usageCount > 0;
    case "unused":
      return item.usageCount === 0;
    case "draft":
    case "review":
    case "published":
      return item.statusKey === filterKey;
    case "archived":
      return item.archived;
    case "broken":
      return item.brokenBinary;
    default:
      return true;
  }
}

function matchesQuery(item, normalizedQuery) {
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    item.title,
    item.alt,
    item.caption,
    item.originalFilename,
    item.sourceNote,
    item.ownershipNote,
    ...(item.collectionEntries ?? []).map((entry) => entry.title)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getActiveCollectionFilterLabel(collectionFilterId, collections) {
  if (!collectionFilterId) {
    return "Р’СЃРµ РєРѕР»Р»РµРєС†РёРё";
  }

  if (collectionFilterId === COLLECTION_FILTER_ORPHAN) {
    return "Р‘РµР· РєРѕР»Р»РµРєС†РёРё";
  }

  return collections.find((item) => item.id === collectionFilterId)?.title || "Р’С‹Р±СЂР°РЅРЅР°СЏ РєРѕР»Р»РµРєС†РёСЏ";
}

function summarizeOverlayCollections(collectionIds, collections) {
  const selected = collections.filter((item) => collectionIds.includes(item.id));

  if (selected.length === 0) {
    return "РќРµ СЃРѕСЃС‚РѕРёС‚ РІ РєРѕР»Р»РµРєС†РёСЏС…";
  }

  if (selected.length === 1) {
    return selected[0].title;
  }

  return `${selected[0].title} +${selected.length - 1}`;
}

function compareItems(left, right, sortMode) {
  switch (sortMode) {
    case "oldest":
      return left.updatedAtTs - right.updatedAtTs;
    case "title":
      return left.title.localeCompare(right.title, "ru");
    case "status": {
      const leftRank = STATUS_SORT_ORDER[left.statusKey] ?? 99;
      const rightRank = STATUS_SORT_ORDER[right.statusKey] ?? 99;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return right.updatedAtTs - left.updatedAtTs;
    }
    default:
      return right.updatedAtTs - left.updatedAtTs;
  }
}

function getToneForItem(item) {
  if (item.brokenBinary) {
    return "danger";
  }

  if (item.archived) {
    return "muted";
  }

  if (item.statusKey === "review") {
    return "warning";
  }

  if (item.statusKey === "published") {
    return "success";
  }

  return "muted";
}

function getWarningNote(item) {
  if (item.brokenBinary) {
    return "Р‘РёРЅР°СЂРЅРёРє РЅРµ С‡РёС‚Р°РµС‚СЃСЏ С‡РµСЂРµР· РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°.";
  }

  if (item.archived) {
    return "РљР°СЂС‚РѕС‡РєР° СѓР¶Рµ РІ Р°СЂС…РёРІРµ Рё РЅРµ РґРѕР»Р¶РЅР° СѓС‡Р°СЃС‚РІРѕРІР°С‚СЊ РІ РЅРѕРІС‹С… РїСЂРёРІСЏР·РєР°С…, РїРѕРєР° РІС‹ РЅРµ РІРµСЂРЅС‘С‚Рµ РµС‘ РІ Р°РєС‚РёРІРЅС‹Р№ СЃРїРёСЃРѕРє.";
  }

  if (item.publishedRevisionNumber) {
    return `РЈ РєР°СЂС‚РѕС‡РєРё РµСЃС‚СЊ РґРµР№СЃС‚РІСѓСЋС‰Р°СЏ РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅР°СЏ РІРµСЂСЃРёСЏ (СЂРµРІРёР·РёСЏ #${item.publishedRevisionNumber}). РЈРґР°Р»РµРЅРёРµ Рё РїСЂСЏРјС‹Рµ РїСЂР°РІРєРё С‚РµРїРµСЂСЊ РёРґСѓС‚ С‡РµСЂРµР· РѕС‚РґРµР»СЊРЅСѓСЋ РїСЂРѕРІРµСЂРєСѓ РїРµСЂРµРґ РґРµР№СЃС‚РІРёРµРј.`;
  }

  if (item.missingAlt) {
    return "РќСѓР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ alt, С‡С‚РѕР±С‹ РЅРµ РѕСЃС‚Р°РІР»СЏС‚СЊ Р°СЃСЃРµС‚ СЃС‹СЂС‹Рј.";
  }

  if (item.orphaned) {
    return "РљР°СЂС‚РѕС‡РєР° РїРѕРєР° СЃРёСЂРѕС‚Р°: РµС‘ РјРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РѕС‚РґРµР»СЊРЅС‹Рј Р°СЃСЃРµС‚РѕРј РёР»Рё Р±С‹СЃС‚СЂРѕ РІРєР»СЋС‡РёС‚СЊ РІ РѕРґРЅСѓ РёР· РєРѕР»Р»РµРєС†РёР№.";
  }

  if (!item.ownershipNote) {
    return "РЎС‚РѕРёС‚ РґРѕР±Р°РІРёС‚СЊ Р·Р°РјРµС‚РєСѓ Рѕ РїСЂР°РІР°С…, С‡С‚РѕР±С‹ РЅРµ РїРѕС‚РµСЂСЏС‚СЊ РїСЂРѕРёСЃС…РѕР¶РґРµРЅРёРµ С„Р°Р№Р»Р°.";
  }

  return "РљР°СЂС‚РѕС‡РєР° РІС‹РіР»СЏРґРёС‚ СЂР°Р±РѕС‡РµР№. РџСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РѕС‚РєСЂРѕР№С‚Рµ СЂР°СЃС€РёСЂРµРЅРЅРѕРµ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РёР»Рё РєРѕР»Р»РµРєС†РёРё.";
}

function getGridColumns(nodes) {
  const first = nodes.find(Boolean);

  if (!first) {
    return 1;
  }

  const firstTop = first.offsetTop;
  let count = 0;

  for (const node of nodes) {
    if (!node) {
      continue;
    }

    if (node.offsetTop !== firstTop) {
      break;
    }

    count += 1;
  }

  return Math.max(1, count);
}

function updateWorkspaceUrl({ assetId, compose, collectionId }) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (assetId) {
    url.searchParams.set("asset", assetId);
  } else {
    url.searchParams.delete("asset");
  }

  if (compose) {
    url.searchParams.set("compose", compose);
  } else {
    url.searchParams.delete("compose");
  }

  if (collectionId) {
    url.searchParams.set("collection", collectionId);
  } else {
    url.searchParams.delete("collection");
  }

  window.history.replaceState({}, "", url);
}

function getImageEditAvailability({ mode, item, file }) {
  if (mode === "create") {
    return {
      canEdit: Boolean(file),
      reason: file ? "" : "РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РґР»СЏ Р·Р°РіСЂСѓР·РєРё."
    };
  }

  if (!item) {
    return {
      canEdit: false,
      reason: "РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ РєР°СЂС‚РѕС‡РєСѓ РґР»СЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ."
    };
  }

  if (item.archived) {
    return {
      canEdit: false,
      reason: "РђСЂС…РёРІРЅС‹Рµ Р°СЃСЃРµС‚С‹ СЃРЅР°С‡Р°Р»Р° РЅСѓР¶РЅРѕ РІРµСЂРЅСѓС‚СЊ РІ Р°РєС‚РёРІРЅС‹Р№ СЃРїРёСЃРѕРє."
    };
  }

  if (item.publishedRevisionNumber) {
    return {
      canEdit: false,
      reason: "Р”Р»СЏ РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹С… РјРµРґРёР° РїСЂСЏРјРѕРµ РїРµСЂРµР·Р°РїРёСЃС‹РІР°РЅРёРµ Р·Р°РїСЂРµС‰РµРЅРѕ. Р”Р»СЏ РЅРёС… РЅСѓР¶РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ СЃС†РµРЅР°СЂРёР№ РїСЂР°РІРѕРє."
    };
  }

  if (item.statusKey !== "draft") {
    return {
      canEdit: false,
      reason: "РР·РѕР±СЂР°Р¶РµРЅРёРµ РјРѕР¶РЅРѕ РїСЂР°РІРёС‚СЊ С‚РѕР»СЊРєРѕ РІ С‡РµСЂРЅРѕРІРёРєРµ."
    };
  }

  if (!item.hasPreview && mode === "edit") {
    return {
      canEdit: false,
      reason: "РќРµС‚ РґРѕСЃС‚СѓРїРЅРѕРіРѕ РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂР°, РїРѕСЌС‚РѕРјСѓ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ СЃРµР№С‡Р°СЃ РЅРµРґРѕСЃС‚СѓРїРЅРѕ."
    };
  }

  return {
    canEdit: true,
    reason: ""
  };
}

function mergeById(currentItems, nextItems) {
  const map = new Map(currentItems.map((item) => [item.id, item]));

  for (const item of nextItems) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

function MediaInspector({
  item,
  onEdit,
  onOpenCollectionManager,
  onCreateCollection,
  onLifecycleAction,
  lifecycleBusy,
  deleteHref = "",
  returnTo = ""
}) {
  if (!item) {
    return (
      <aside className={`${styles.panel} ${styles.mediaInspector}`} aria-live="polite">
        <h3 className={styles.mediaInspectorTitle}>РљР°СЂС‚РѕС‡РєР° РЅРµ РІС‹Р±СЂР°РЅР°</h3>
        <p className={styles.helpText}>
          Р’С‹Р±РµСЂРёС‚Рµ РєР°СЂС‚РѕС‡РєСѓ РІ РјРµРґРёР°С‚РµРєРµ, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РєСЂСѓРїРЅРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ, СЃРёРіРЅР°Р»С‹, РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ Рё СЃРѕСЃС‚РѕСЏРЅРёРµ РєРѕР»Р»РµРєС†РёР№.
        </p>
      </aside>
    );
  }

  return (
    <aside className={`${styles.panel} ${styles.mediaInspector}`} aria-live="polite">
      <div className={styles.mediaInspectorHeader}>
        <div className={styles.stack}>
          <p className={styles.eyebrow}>РРЅСЃРїРµРєС‚РѕСЂ</p>
          <h3 className={styles.mediaInspectorTitle}>{item.title}</h3>
          <p className={styles.helpText}>{item.originalFilename || "РРјСЏ С„Р°Р№Р»Р° РїРѕРєР° РЅРµ Р·Р°РґР°РЅРѕ"}</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={onEdit}>
          Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ
        </button>
      </div>

      <div className={styles.mediaInspectorPreview}>
        {item.hasPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewUrl} alt={item.alt || item.title || item.originalFilename || "РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ"} />
        ) : (
          <div className={styles.mediaInspectorPlaceholder}>РќРµС‚ РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂР°</div>
        )}
      </div>

      <div className={styles.badgeRow}>
        {item.publishedRevisionNumber ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Р•СЃС‚СЊ РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅР°СЏ РІРµСЂСЃРёСЏ</span> : null}
        <span className={`${styles.badge} ${styles[`mediaBadge${getToneForItem(item)}`]}`}>{item.statusLabel}</span>
        {item.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>РўРµСЃС‚РѕРІС‹Рµ</span> : null}
        {item.markedForRemovalAt ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>РџРѕРјРµС‡РµРЅРѕ РЅР° СѓРґР°Р»РµРЅРёРµ</span> : null}
        {item.archived ? <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>{item.lifecycleLabel}</span> : null}
        <span className={`${styles.badge} ${item.missingAlt ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
          {item.missingAlt ? "РќРµС‚ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅРѕРіРѕ С‚РµРєСЃС‚Р°" : "РђР»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹Р№ С‚РµРєСЃС‚ РµСЃС‚СЊ"}
        </span>
        <span className={`${styles.badge} ${item.orphaned ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
          {item.orphaned ? "РЎРёСЂРѕС‚Р°" : item.collectionShortLabel}
        </span>
        <span className={`${styles.badge} ${item.usageCount ? styles.mediaBadgesuccess : styles.mediaBadgemuted}`}>
          {item.whereUsedLabel}
        </span>
        {item.brokenBinary ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>РЎР»РѕРјР°РЅ</span> : null}
      </div>

      <dl className={styles.mediaMetaList}>
        <div>
          <dt>Р¤РѕСЂРјР°С‚</dt>
          <dd>{item.mimeType || "РќРµ СѓРєР°Р·Р°РЅ"}</dd>
        </div>
        <div>
          <dt>Р Р°Р·РјРµСЂ</dt>
          <dd>{formatBytes(item.sizeBytes)}</dd>
        </div>
        <div>
          <dt>РћР±РЅРѕРІР»РµРЅРѕ</dt>
          <dd>{formatDate(item.updatedAt)}</dd>
        </div>
        <div>
          <dt>Р—Р°РіСЂСѓР·РёР»</dt>
          <dd>{item.uploadedBy || "РќРµ СѓРєР°Р·Р°РЅРѕ"}</dd>
        </div>
      </dl>

      <section className={styles.mediaInspectorSection}>
        <h4>Р‘С‹СЃС‚СЂС‹Рµ СЃРёРіРЅР°Р»С‹</h4>
        <p className={styles.helpText}>{getWarningNote(item)}</p>
        {item.caption ? <p className={styles.mediaSnippet}>{item.caption}</p> : null}
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ</h4>
        <dl className={styles.mediaMetaList}>
          {item.usageSummaryItems.map((summaryItem) => (
            <div key={summaryItem.key}>
              <dt>{summaryItem.label}</dt>
              <dd>{summaryItem.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>РљРѕР»Р»РµРєС†РёРё</h4>
        {item.collectionEntries.length === 0 ? (
          <p className={styles.helpText}>
            РљР°СЂС‚РѕС‡РєР° РїРѕРєР° РЅРёРєСѓРґР° РЅРµ РІС…РѕРґРёС‚. Р­С‚Рѕ С‡РµСЃС‚РЅС‹Р№ СЃС‚Р°С‚СѓСЃ СЃРёСЂРѕС‚С‹: Р°СЃСЃРµС‚ Р¶РёРІС‘С‚ РѕС‚РґРµР»СЊРЅРѕ, РїРѕРєР° РІС‹ РЅРµ РїСЂРёРІСЏР¶РµС‚Рµ РµРіРѕ Рє РїРѕРґР±РѕСЂРєРµ.
          </p>
        ) : (
          <div className={styles.mediaUsageList}>
            {item.collectionEntries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={styles.mediaUsageButton}
                onClick={() => onOpenCollectionManager({ collectionId: entry.id, seedAssetId: item.id })}
              >
                <strong>{entry.title}</strong>
                <span>{entry.memberCount} С„Р°Р№Р»РѕРІ</span>
                <span className={styles.mutedText}>{entry.statusLabel}</span>
              </button>
            ))}
          </div>
        )}
        <div className={styles.inlineActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onOpenCollectionManager({ seedAssetId: item.id })}
          >
            Р’ РєРѕР»Р»РµРєС†РёСЋ
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onCreateCollection(item.id)}
          >
            РќРѕРІР°СЏ РєРѕР»Р»РµРєС†РёСЏ
          </button>
        </div>
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Р“РґРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ</h4>
        {item.usageEntries.length === 0 ? (
          <p className={styles.helpText}>
            РџРѕРєР° РЅРµС‚ СЃСЃС‹Р»РѕРє РЅР° СЌС‚РѕС‚ Р°СЃСЃРµС‚. Р­С‚Рѕ С…РѕСЂРѕС€РёР№ РјРѕРјРµРЅС‚ РґР»СЏ СЃРїРѕРєРѕР№РЅРѕР№ РґРѕРІРѕРґРєРё РјРµС‚Р°РґР°РЅРЅС‹С… Рё РєРѕР»Р»РµРєС†РёР№.
          </p>
        ) : (
          <div className={styles.mediaUsageList}>
            {item.usageEntries.map((entry) => (
              <Link key={entry.key} href={appendAdminReturnTo(entry.href, returnTo)} className={styles.mediaUsageItem}>
                <strong>{entry.entityLabel}</strong>
                <span>{entry.title}</span>
                <span className={styles.mutedText}>{entry.relationLabel} вЂў {entry.statusLabel}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ</h4>
        <p className={styles.helpText}>{item.archiveReason}</p>
        {item.markedForRemovalAt ? (
          <p className={styles.helpText}>
            Р­С‚РѕС‚ РјРµРґРёР°С„Р°Р№Р» СѓР¶Рµ РїРѕРјРµС‡РµРЅ РЅР° СѓРґР°Р»РµРЅРёРµ. РќРѕРІС‹Рµ СЃСЃС‹Р»РєРё РЅР° РЅРµРіРѕ Р±Р»РѕРєРёСЂСѓСЋС‚СЃСЏ, Р° С„РёРЅР°Р»СЊРЅР°СЏ РѕС‡РёСЃС‚РєР° Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ РёР· С†РµРЅС‚СЂР° РѕС‡РёСЃС‚РєРё.
          </p>
        ) : null}
        <div className={styles.inlineActions}>
          {!item.markedForRemovalAt ? (
            <ConfirmActionForm
              action={getRemovalMarkHref("media_asset", item.id)}
              confirmMessage="РџРѕРјРµС‚РёС‚СЊ РјРµРґРёР°С„Р°Р№Р» РЅР° СѓРґР°Р»РµРЅРёРµ? РќРѕРІС‹Рµ СЃСЃС‹Р»РєРё РЅР° РЅРµРіРѕ Р±СѓРґСѓС‚ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅС‹."
            >
              <input type="hidden" name="redirectTo" value={returnTo} />
              <input type="hidden" name="failureRedirectTo" value={returnTo} />
              <button type="submit" className={styles.secondaryButton}>РџРѕРјРµС‚РёС‚СЊ РЅР° СѓРґР°Р»РµРЅРёРµ</button>
            </ConfirmActionForm>
          ) : null}
          {item.markedForRemovalAt ? (
            <ConfirmActionForm
              action={getRemovalUnmarkHref("media_asset", item.id)}
              confirmMessage="РЎРЅСЏС‚СЊ РїРѕРјРµС‚РєСѓ СѓРґР°Р»РµРЅРёСЏ?"
            >
              <input type="hidden" name="redirectTo" value={returnTo} />
              <input type="hidden" name="failureRedirectTo" value={returnTo} />
              <button type="submit" className={styles.secondaryButton}>РЎРЅСЏС‚СЊ РїРѕРјРµС‚РєСѓ СѓРґР°Р»РµРЅРёСЏ</button>
            </ConfirmActionForm>
          ) : null}
          <Link href={getRemovalSweepHref()} className={item.markedForRemovalAt ? styles.primaryButton : styles.secondaryButton}>
            Р¦РµРЅС‚СЂ РѕС‡РёСЃС‚РєРё
          </Link>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onLifecycleAction(item.archived ? "restore" : "archive")}
            disabled={lifecycleBusy || (!item.canArchive && !item.canRestore)}
          >
            {lifecycleBusy ? "РЎРѕС…СЂР°РЅСЏРµРј..." : item.archived ? "Р’РµСЂРЅСѓС‚СЊ РёР· Р°СЂС…РёРІР°" : "Р’ Р°СЂС…РёРІ"}
          </button>
          <Link href={deleteHref} className={styles.secondaryButton}>Проверить удаление (legacy)</Link>
          {item.isTestData ? (
            <Link href={appendAdminReturnTo(getTestGraphTeardownHref("media_asset", item.id), returnTo)} className={styles.secondaryButton}>
              РЈРґР°Р»РёС‚СЊ С‚РµСЃС‚РѕРІС‹Р№ РіСЂР°С„
            </Link>
          ) : null}
          <Link href={appendAdminReturnTo(`/admin/entities/media_asset/${item.id}/history`, returnTo)} className={styles.secondaryButton}>
            РСЃС‚РѕСЂРёСЏ
          </Link>
        </div>
      </section>
    </aside>
  );
}

function MediaOverlay({
  mode,
  item,
  fields,
  collections,
  file,
  editedBinary,
  previewUrl,
  busy,
  error,
  dragActive,
  onClose,
  onFieldChange,
  onToggleCollection,
  onFileSelect,
  onImageCommit,
  onImageReset,
  onSubmit,
  onDragEnter,
  onDragLeave,
  onDrop
}) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const [activeTab, setActiveTab] = useState("metadata");
  const imageEdit = getImageEditAvailability({ mode, item, file });
  const selectedCollectionsLabel = summarizeOverlayCollections(fields.collectionIds ?? [], collections ?? []);

  useEffect(() => {
    if (!mode) {
      return;
    }

    const focusTarget = mode === "create" && !file ? dialogRef.current : titleRef.current;
    focusTarget?.focus();
  }, [mode, file]);

  useEffect(() => {
    setActiveTab("metadata");
  }, [mode, item?.id]);

  if (!mode) {
    return null;
  }

  return (
    <div className={styles.mediaOverlayBackdrop}>
      <div
        ref={dialogRef}
        className={styles.mediaOverlayDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-overlay-title"
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
            <p className={styles.eyebrow}>{mode === "create" ? "РќРѕРІС‹Р№ Р°СЃСЃРµС‚" : "Р РµРґР°РєС‚РѕСЂ Р°СЃСЃРµС‚Р°"}</p>
            <h3 id="media-overlay-title" className={styles.mediaOverlayTitle}>
              {mode === "create" ? "Р—Р°РіСЂСѓР·РєР° Рё РјРµС‚Р°РґР°РЅРЅС‹Рµ" : "РњРµС‚Р°РґР°РЅРЅС‹Рµ С‚РµРєСѓС‰РµРіРѕ Р°СЃСЃРµС‚Р°"}
            </h3>
          </div>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
            Р—Р°РєСЂС‹С‚СЊ
          </button>
        </div>

        {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}

        <div className={styles.mediaOverlayTabs} role="tablist" aria-label="Р РµР¶РёРјС‹ СЂРµРґР°РєС‚РѕСЂР° РјРµРґРёР°">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "metadata"}
            className={`${styles.filterPill} ${activeTab === "metadata" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveTab("metadata")}
          >
            РњРµС‚Р°РґР°РЅРЅС‹Рµ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "image"}
            className={`${styles.filterPill} ${activeTab === "image" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveTab("image")}
          >
            РР·РѕР±СЂР°Р¶РµРЅРёРµ
          </button>
        </div>

        <div className={styles.mediaOverlayBody}>
          <section className={styles.mediaOverlayPreview}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={fields.alt || fields.title || fields.originalFilename || "РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ"} />
            ) : (
              <div
                className={`${styles.mediaOverlayDropzone} ${dragActive ? styles.mediaOverlayDropzoneActive : ""}`}
                onDragEnter={onDragEnter}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <p>Р’С‹Р±РµСЂРёС‚Рµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РёР»Рё РїРµСЂРµС‚Р°С‰РёС‚Рµ РµРіРѕ СЃСЋРґР°</p>
                <label className={styles.secondaryButton}>
                  <span>Р’С‹Р±СЂР°С‚СЊ С„Р°Р№Р»</span>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.visuallyHidden}
                    onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
                  />
                </label>
                <p className={styles.helpText}>V1 РѕСЃС‚Р°С‘С‚СЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ РёР·РѕР±СЂР°Р¶РµРЅРёР№. Р’РёРґРµРѕ Рё РґРѕРєСѓРјРµРЅС‚С‹ СЃСЋРґР° РЅРµ РґРѕР±Р°РІР»СЏРµРј.</p>
              </div>
            )}
          </section>

          {activeTab === "metadata" ? (
            <form className={styles.mediaOverlayForm} onSubmit={onSubmit}>
              <div className={styles.gridTwo}>
                <label className={styles.label}>
                  <span>РќР°Р·РІР°РЅРёРµ</span>
                  <input
                    ref={titleRef}
                    name="title"
                    value={fields.title}
                    onChange={(event) => onFieldChange("title", event.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  <span>РђР»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹Р№ С‚РµРєСЃС‚</span>
                  <input
                    name="alt"
                    value={fields.alt}
                    onChange={(event) => onFieldChange("alt", event.target.value)}
                  />
                </label>
                <label className={`${styles.label} ${styles.gridWide}`}>
                  <span>РџРѕРґРїРёСЃСЊ</span>
                  <textarea
                    name="caption"
                    value={fields.caption}
                    onChange={(event) => onFieldChange("caption", event.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  <span>РСЃС‚РѕС‡РЅРёРє</span>
                  <input
                    name="sourceNote"
                    value={fields.sourceNote}
                    onChange={(event) => onFieldChange("sourceNote", event.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  <span>РџСЂР°РІР°</span>
                  <input
                    name="ownershipNote"
                    value={fields.ownershipNote}
                    onChange={(event) => onFieldChange("ownershipNote", event.target.value)}
                  />
                </label>
                <label className={`${styles.label} ${styles.gridWide}`}>
                  <span>РљРѕРјРјРµРЅС‚Р°СЂРёР№ Рє РёР·РјРµРЅРµРЅРёСЋ</span>
                  <input
                    name="changeIntent"
                    value={fields.changeIntent}
                    onChange={(event) => onFieldChange("changeIntent", event.target.value)}
                  />
                  <p className={styles.helpText}>
                    РљРѕРјРјРµРЅС‚Р°СЂРёР№ РЅРµ РѕР±СЏР·Р°С‚РµР»РµРЅ, РЅРѕ РѕРЅ РїРѕС‚РѕРј РїРѕРјРѕРіР°РµС‚ Р±С‹СЃС‚СЂРµРµ РїРѕРЅСЏС‚СЊ СЃРјС‹СЃР» РІРµСЂСЃРёРё РІ РёСЃС‚РѕСЂРёРё Рё РїСЂРѕРІРµСЂРєРµ.
                  </p>
                </label>
                {mode === "edit" ? (
                  <details className={`${styles.collectionField} ${styles.gridWide}`}>
                    <summary className={styles.collectionFieldSummary}>
                      <span className={styles.collectionFieldLabel}>Р’ РєРѕР»Р»РµРєС†РёСЏС…</span>
                      <span className={styles.collectionFieldValue}>{selectedCollectionsLabel}</span>
                    </summary>
                    <div className={styles.collectionFieldPanel}>
                      {collections.length === 0 ? (
                      <p className={styles.helpText}>
                          РљРѕР»Р»РµРєС†РёР№ РїРѕРєР° РЅРµС‚. РЎРЅР°С‡Р°Р»Р° СЃРѕР·РґР°Р№С‚Рµ РїРѕРґР±РѕСЂРєСѓ РІ РѕСЃРЅРѕРІРЅРѕР№ РјРµРґРёР°С‚РµРєРµ, Р° РїРѕС‚РѕРј РІРµСЂРЅРёС‚РµСЃСЊ Рє РєР°СЂС‚РѕС‡РєРµ.
                        </p>
                      ) : (
                        <div className={styles.collectionFieldList} role="list">
                          {collections.map((collection) => {
                            const checked = (fields.collectionIds ?? []).includes(collection.id);

                            return (
                              <label key={collection.id} className={styles.collectionFieldOption}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggleCollection(collection.id)}
                                />
                                <span className={styles.collectionFieldOptionBody}>
                                  <strong>{collection.title}</strong>
                                  <span className={styles.mutedText}>{collection.memberCount} С„Р°Р№Р»РѕРІ</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <p className={styles.helpText}>
                        Р—РґРµСЃСЊ РјРµРЅСЏРµС‚СЃСЏ С‚РѕР»СЊРєРѕ membership С‚РµРєСѓС‰РµРіРѕ Р°СЃСЃРµС‚Р°. РЎРѕСЃС‚Р°РІ РєРѕР»Р»РµРєС†РёРё Рё РіР»Р°РІРЅС‹Р№ РєР°РґСЂ РїРѕ-РїСЂРµР¶РЅРµРјСѓ Р¶РёРІСѓС‚ РІ СЂРµРґР°РєС‚РѕСЂРµ РєРѕР»Р»РµРєС†РёР№.
                      </p>
                    </div>
                  </details>
                ) : null}
              </div>

              <div className={styles.mediaOverlayMeta}>
                <span>{fields.originalFilename || "Р¤Р°Р№Р» РїРѕРєР° РЅРµ РІС‹Р±СЂР°РЅ"}</span>
                {fields.originalFilename ? <span>{formatBytes(fields.sizeBytes)}</span> : null}
                {editedBinary ? <span>РР·РѕР±СЂР°Р¶РµРЅРёРµ РёР·РјРµРЅРµРЅРѕ Р»РѕРєР°Р»СЊРЅРѕ</span> : null}
              </div>

              <div className={styles.mediaOverlayActions}>
                <button type="submit" className={styles.primaryButton} disabled={busy || (mode === "create" && !file)}>
                  {busy ? "РЎРѕС…СЂР°РЅСЏРµРј..." : mode === "create" ? "РЎРѕС…СЂР°РЅРёС‚СЊ Р°СЃСЃРµС‚" : "РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ"}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
                  РћС‚РјРµРЅР°
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.mediaOverlayForm}>
              <MediaImageEditorPanel
                sourceUrl={previewUrl}
                filename={fields.originalFilename}
                mimeType={item?.mimeType || file?.type || "image/png"}
                disabledReason={imageEdit.reason}
                busy={busy}
                hasEdits={Boolean(editedBinary)}
                onCommit={onImageCommit}
                onReset={onImageReset}
              />
              <div className={styles.mediaOverlayActions}>
                <button type="button" className={styles.primaryButton} onClick={() => setActiveTab("metadata")}>
                  Р’РµСЂРЅСѓС‚СЊСЃСЏ Рє РјРµС‚Р°РґР°РЅРЅС‹Рј
                </button>
                <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
                  РћС‚РјРµРЅР°
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MediaGalleryWorkspace({
  initialItems,
  initialCollections,
  initialSelectedId,
  initialCollectionId = "",
  initialCompose = "",
  initialFilterKey = "all",
  currentUsername,
  initialMessage = "",
  initialError = "",
  workspaceContextHref = ""
}) {
  const [items, setItems] = useState(initialItems);
  const [collections, setCollections] = useState(initialCollections);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [filterKey, setFilterKey] = useState(initialFilterKey || "all");
  const [collectionFilterId, setCollectionFilterId] = useState(initialCollectionId || COLLECTION_FILTER_ALL);
  const [sortMode, setSortMode] = useState("newest");
  const [selectedId, setSelectedId] = useState(initialSelectedId || initialItems[0]?.id || "");
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState(initialError);
  const [recentlySavedId, setRecentlySavedId] = useState("");
  const [overlayMode, setOverlayMode] = useState(
    initialCompose === "upload"
      ? "asset-create"
      : initialCompose === "collections" || initialCompose === "collection-new"
        ? "collections"
        : null
  );
  const [overlayBusy, setOverlayBusy] = useState(false);
  const [overlayError, setOverlayError] = useState("");
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draftFile, setDraftFile] = useState(null);
  const [editedBinaryFile, setEditedBinaryFile] = useState(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState("");
  const [createSourceFile, setCreateSourceFile] = useState(null);
  const [createSourcePreviewUrl, setCreateSourcePreviewUrl] = useState("");
  const [editSourcePreviewUrl, setEditSourcePreviewUrl] = useState("");
  const [assetFields, setAssetFields] = useState({
    title: "",
    alt: "",
    caption: "",
    sourceNote: "",
    ownershipNote: "",
    changeIntent: "",
    collectionIds: [],
    originalFilename: "",
    sizeBytes: 0
  });
  const [collectionContext, setCollectionContext] = useState({
    selectedCollectionId: initialCollectionId || "",
    seedAssetId: initialCompose === "collection-new" ? (initialSelectedId || initialItems[0]?.id || "") : "",
    createNew: initialCompose === "collection-new"
  });
  const cardRefs = useRef([]);

  useEffect(() => {
    if (!selectedId && items[0]?.id) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    if (selectedId && items.length > 0 && !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    setSelectedDeleteIds((current) => current.filter((entityId) => items.some((item) => item.id === entityId && item.isTestData)));
  }, [items]);

  useEffect(() => {
    if (!draftPreviewUrl.startsWith("blob:")) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(draftPreviewUrl);
    };
  }, [draftPreviewUrl]);

  useEffect(() => {
    if (!createSourcePreviewUrl.startsWith("blob:")) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(createSourcePreviewUrl);
    };
  }, [createSourcePreviewUrl]);

  useEffect(() => {
    setRecentlySavedId("");
  }, [query, filterKey, collectionFilterId, sortMode]);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const collectionOptions = [...collections].sort((left, right) => left.title.localeCompare(right.title, "ru"));
  const filtered = [...items]
    .filter((item) => matchesQuery(item, normalizedQuery))
    .filter((item) => matchesFilter(item, filterKey, currentUsername))
    .filter((item) => matchesCollectionFilter(item, collectionFilterId))
    .sort((left, right) => compareItems(left, right, sortMode));
  const summaryItems = [
    { label: "РўРµСЃС‚РѕРІС‹Рµ", value: items.filter((item) => item.isTestData).length },
    { label: "Р’СЃРµРіРѕ", value: items.length },
    { label: "РќРµС‚ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅРѕРіРѕ С‚РµРєСЃС‚Р°", value: items.filter((item) => item.missingAlt).length },
    { label: "РЎРёСЂРѕС‚С‹", value: items.filter((item) => item.orphaned).length },
    { label: "РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ", value: items.filter((item) => item.usageCount > 0).length },
    { label: "Р’ Р°СЂС…РёРІРµ", value: items.filter((item) => item.archived).length },
    { label: "РЎР»РѕРјР°РЅРЅС‹Рµ", value: items.filter((item) => item.brokenBinary).length }
  ];
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const selectedTestDeleteCount = selectedDeleteIds.length;
  const currentWorkspaceHref = typeof window === "undefined"
    ? workspaceContextHref
    : `${window.location.pathname}${window.location.search}`;
  const selectedDeleteHref = selectedItem
    ? getDeletePreviewHref("media_asset", selectedItem.id, currentWorkspaceHref)
    : "";
  const selectedHiddenByFilter = Boolean(selectedItem && !filtered.some((item) => item.id === selectedItem.id));

  const displayedItems = (() => {
    if (!recentlySavedId) {
      return filtered;
    }

    const savedItem = items.find((item) => item.id === recentlySavedId);

    if (!savedItem || filtered.some((item) => item.id === recentlySavedId)) {
      return filtered;
    }

    return [{ ...savedItem, forcedVisible: true }, ...filtered];
  })();

  function resetAssetOverlayState() {
    setOverlayBusy(false);
    setOverlayError("");
    setDraftFile(null);
    setEditedBinaryFile(null);
    setDraftPreviewUrl("");
    setCreateSourceFile(null);
    setCreateSourcePreviewUrl("");
    setEditSourcePreviewUrl("");
    setAssetFields({
      title: "",
      alt: "",
      caption: "",
      sourceNote: "",
      ownershipNote: "",
      changeIntent: "",
      collectionIds: [],
      originalFilename: "",
      sizeBytes: 0
    });
  }

  function openCreateOverlay() {
    resetAssetOverlayState();
    setOverlayMode("asset-create");
    updateWorkspaceUrl({ assetId: selectedId, compose: "upload", collectionId: "" });
  }

  function openEditOverlay(item) {
    setOverlayBusy(false);
    setOverlayError("");
    setDraftFile(null);
    setEditedBinaryFile(null);
    setDraftPreviewUrl(item?.previewUrl || "");
    setEditSourcePreviewUrl(item?.previewUrl || "");
    setAssetFields({
      title: item?.title || "",
      alt: item?.alt || "",
      caption: item?.caption || "",
      sourceNote: item?.sourceNote || "",
      ownershipNote: item?.ownershipNote || "",
      changeIntent: "",
      collectionIds: item?.collectionEntries?.map((entry) => entry.id) || [],
      originalFilename: item?.originalFilename || "",
      sizeBytes: item?.sizeBytes || 0
    });
    setOverlayMode("asset-edit");
    updateWorkspaceUrl({ assetId: item?.id || selectedId, compose: null, collectionId: "" });
  }

  function openCollectionManager({ collectionId = "", seedAssetId = "", createNew = false } = {}) {
    setOverlayBusy(false);
    setOverlayError("");
    setOverlayMode("collections");
    setCollectionContext({
      selectedCollectionId: collectionId,
      seedAssetId,
      createNew
    });
    updateWorkspaceUrl({
      assetId: seedAssetId || selectedId,
      compose: createNew ? "collection-new" : "collections",
      collectionId
    });
  }

  function closeOverlay() {
    if (overlayMode === "asset-create" || overlayMode === "asset-edit") {
      resetAssetOverlayState();
    } else {
      setOverlayBusy(false);
      setOverlayError("");
    }

    setOverlayMode(null);
    updateWorkspaceUrl({ assetId: selectedId, compose: null, collectionId: "" });
  }

  function selectCard(itemId) {
    setSelectedId(itemId);
    setMessage("");
    setError("");
    updateWorkspaceUrl({
      assetId: itemId,
      compose: overlayMode === "asset-create"
        ? "upload"
        : overlayMode === "collections"
          ? (collectionContext.createNew ? "collection-new" : "collections")
          : null,
      collectionId: overlayMode === "collections" ? collectionContext.selectedCollectionId : ""
    });
  }

  function toggleDeleteSelection(entityId) {
    setSelectedDeleteIds((current) => (
      current.includes(entityId)
        ? current.filter((value) => value !== entityId)
        : [...current, entityId]
    ));
  }

  async function performDeleteRequest(entityIds, { testOnly = false } = {}) {
    const formData = new FormData();

    for (const entityId of entityIds) {
      formData.append("entityId", entityId);
    }

    if (testOnly) {
      formData.set("testOnly", "true");
    }

    formData.set("responseMode", "json");
    const response = await fetch("/api/admin/entities/media_asset/delete", {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    if ((payload.deletedIds ?? []).length > 0) {
      setItems((current) => current.filter((item) => !(payload.deletedIds ?? []).includes(item.id)));
      setSelectedDeleteIds((current) => current.filter((entityId) => !(payload.deletedIds ?? []).includes(entityId)));
    }

    if (payload.message) {
      setMessage(payload.message);
    }

    if (payload.error) {
      setError(payload.error);
    } else {
      setError("");
    }

    if (!response.ok && (payload.deletedCount ?? 0) === 0) {
      throw new Error(payload.error || "РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РІС‹Р±СЂР°РЅРЅС‹Рµ РѕР±СЉРµРєС‚С‹.");
    }

    return payload;
  }

  async function handleBulkDeleteTestData() {
    if (selectedDeleteIds.length === 0) {
      setError("РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ С‚РµСЃС‚РѕРІС‹Рµ РѕР±СЉРµРєС‚С‹ РґР»СЏ СѓРґР°Р»РµРЅРёСЏ.");
      return;
    }

    if (!window.confirm("РЈРґР°Р»РёС‚СЊ РІС‹Р±СЂР°РЅРЅС‹Рµ С‚РµСЃС‚РѕРІС‹Рµ РѕР±СЉРµРєС‚С‹? Р”РµР№СЃС‚РІРёРµ РЅРµРѕР±СЂР°С‚РёРјРѕ.")) {
      return;
    }

    setDeleteBusy(true);
    setMessage("");
    setError("");

    try {
      await performDeleteRequest(selectedDeleteIds, { testOnly: true });
    } catch (deleteError) {
      setError(deleteError.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ С‚РµСЃС‚РѕРІС‹Рµ РѕР±СЉРµРєС‚С‹.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function handleAssetFieldChange(field, value) {
    setAssetFields((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleCollectionToggle(collectionId) {
    setAssetFields((current) => {
      const currentIds = current.collectionIds ?? [];
      const nextIds = currentIds.includes(collectionId)
        ? currentIds.filter((value) => value !== collectionId)
        : [...currentIds, collectionId];

      return {
        ...current,
        collectionIds: nextIds
      };
    });
  }

  function handleFileSelect(file) {
    if (!file) {
      return;
    }

    const sourcePreviewUrl = URL.createObjectURL(file);
    const nextPreviewUrl = URL.createObjectURL(file);
    setCreateSourceFile(file);
    setCreateSourcePreviewUrl(sourcePreviewUrl);
    setDraftFile(file);
    setEditedBinaryFile(null);
    setDraftPreviewUrl(nextPreviewUrl);
    setAssetFields((current) => ({
      ...current,
      title: current.title || buildTitleFromFilename(file.name),
      originalFilename: file.name,
      sizeBytes: file.size
    }));
  }

  function handleImageCommit(nextFile, nextPreviewUrl) {
    if (overlayMode === "asset-create") {
      setDraftFile(nextFile);
      setDraftPreviewUrl(nextPreviewUrl);
    } else {
      setEditedBinaryFile(nextFile);
      setDraftPreviewUrl(nextPreviewUrl);
    }

    setAssetFields((current) => ({
      ...current,
      sizeBytes: nextFile.size,
      mimeType: nextFile.type || current.mimeType
    }));
  }

  function handleImageReset() {
    if (overlayMode === "asset-create") {
      if (!createSourceFile) {
        return;
      }

      setDraftFile(createSourceFile);
      setDraftPreviewUrl(URL.createObjectURL(createSourceFile));
      setAssetFields((current) => ({
        ...current,
        sizeBytes: createSourceFile.size
      }));
      return;
    }

    setEditedBinaryFile(null);
    setDraftPreviewUrl(editSourcePreviewUrl || selectedItem?.previewUrl || "");
    setAssetFields((current) => ({
      ...current,
      sizeBytes: selectedItem?.sizeBytes || current.sizeBytes
    }));
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();

    if (!draftFile) {
      setOverlayError("РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.");
      return;
    }

    setOverlayBusy(true);
    setOverlayError("");

    const formData = new FormData();
    formData.set("file", draftFile);
    formData.set("title", assetFields.title);
    formData.set("alt", assetFields.alt);
    formData.set("caption", assetFields.caption);
    formData.set("sourceNote", assetFields.sourceNote);
    formData.set("ownershipNote", assetFields.ownershipNote);
    formData.set("changeIntent", assetFields.changeIntent);

    try {
      const response = await fetch("/api/admin/media/library/create", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р°СЃСЃРµС‚.");
      }

      setItems((current) => [payload.item, ...current.filter((item) => item.id !== payload.item.id)]);
      setSelectedId(payload.item.id);
      setRecentlySavedId(payload.item.id);
      setMessage(payload.message || "РђСЃСЃРµС‚ СЃРѕС…СЂР°РЅС‘РЅ.");
      setError("");
      closeOverlay();
      updateWorkspaceUrl({ assetId: payload.item.id, compose: null, collectionId: "" });
    } catch (submitError) {
      setOverlayError(submitError.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р°СЃСЃРµС‚.");
    } finally {
      setOverlayBusy(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();

    if (!selectedItem) {
      setOverlayError("РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ РєР°СЂС‚РѕС‡РєСѓ РґР»СЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ.");
      return;
    }

    setOverlayBusy(true);
    setOverlayError("");

    const formData = new FormData();
    formData.set("title", assetFields.title);
    formData.set("alt", assetFields.alt);
    formData.set("caption", assetFields.caption);
    formData.set("sourceNote", assetFields.sourceNote);
    formData.set("ownershipNote", assetFields.ownershipNote);
    formData.set("changeIntent", assetFields.changeIntent);
    formData.set("collectionsTouched", "true");
    for (const collectionId of assetFields.collectionIds ?? []) {
      formData.append("collectionIds", collectionId);
    }
    if (editedBinaryFile) {
      formData.set("binary", editedBinaryFile);
    }

    try {
      const response = await fetch(`/api/admin/media/library/${selectedItem.id}`, {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ.");
      }

      setItems((current) => current.map((item) => (item.id === payload.item.id ? payload.item : item)));
      if (payload.collections?.length) {
        setCollections((current) => {
          const updates = new Map(payload.collections.map((item) => [item.id, item]));
          const merged = current.map((item) => updates.get(item.id) ?? item);
          const knownIds = new Set(merged.map((item) => item.id));

          for (const item of payload.collections) {
            if (!knownIds.has(item.id)) {
              merged.unshift(item);
            }
          }

          return merged;
        });
      }
      setSelectedId(payload.item.id);
      setRecentlySavedId(payload.item.id);
      setMessage(payload.message || "РР·РјРµРЅРµРЅРёСЏ СЃРѕС…СЂР°РЅРµРЅС‹.");
      setError(payload.warning || "");
      closeOverlay();
      updateWorkspaceUrl({ assetId: payload.item.id, compose: null, collectionId: "" });
    } catch (submitError) {
      setOverlayError(submitError.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ.");
    } finally {
      setOverlayBusy(false);
    }
  }

  async function handleCollectionSubmit({ entityId, fields }) {
    setOverlayBusy(true);
    setOverlayError("");

    const formData = new FormData();
    formData.set("title", fields.title);
    formData.set("caption", fields.caption);
    formData.set("primaryAssetId", fields.primaryAssetId);
    formData.set("changeIntent", fields.changeIntent);
    formData.set("metaTitle", fields.metaTitle);
    formData.set("metaDescription", fields.metaDescription);
    formData.set("canonicalIntent", fields.canonicalIntent);
    formData.set("indexationFlag", fields.indexationFlag);
    formData.set("openGraphTitle", fields.openGraphTitle);
    formData.set("openGraphDescription", fields.openGraphDescription);
    formData.set("openGraphImageAssetId", fields.openGraphImageAssetId);

    for (const assetId of fields.assetIds) {
      formData.append("assetIds", assetId);
    }

    try {
      const response = await fetch(
        entityId ? `/api/admin/media/collections/${entityId}` : "/api/admin/media/collections/create",
        {
          method: "POST",
          body: formData
        }
      );
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РєРѕР»Р»РµРєС†РёСЋ.");
      }

      if (payload.collection) {
        setCollections((current) => {
          const withoutCurrent = current.filter((item) => item.id !== payload.collection.id);
          return [payload.collection, ...withoutCurrent];
        });
      }

      if (payload.affectedItems?.length) {
        setItems((current) => mergeById(current, payload.affectedItems));
        const focusItem = collectionContext.seedAssetId || payload.affectedItems[0]?.id || "";

        if (focusItem) {
          setSelectedId(focusItem);
          setRecentlySavedId(focusItem);
        }
      }

      setMessage(payload.message || "РљРѕР»Р»РµРєС†РёСЏ СЃРѕС…СЂР°РЅРµРЅР°.");
      setError("");
      closeOverlay();
    } catch (submitError) {
      setOverlayError(submitError.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РєРѕР»Р»РµРєС†РёСЋ.");
    } finally {
      setOverlayBusy(false);
    }
  }

  async function handleLifecycleAction(action) {
    if (!selectedItem) {
      return;
    }

    setLifecycleBusy(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("action", action);

      const response = await fetch(`/api/admin/media/library/${selectedItem.id}/lifecycle`, {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ Р¶РёР·РЅРµРЅРЅС‹Р№ С†РёРєР» Р°СЃСЃРµС‚Р°.");
      }

      setItems((current) => current.map((item) => (item.id === payload.item.id ? payload.item : item)));
      setSelectedId(payload.item.id);
      setRecentlySavedId(payload.item.id);
      setMessage(payload.message || "Р–РёР·РЅРµРЅРЅС‹Р№ С†РёРєР» Р°СЃСЃРµС‚Р° РѕР±РЅРѕРІР»С‘РЅ.");
    } catch (actionError) {
      setError(actionError.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ Р¶РёР·РЅРµРЅРЅС‹Р№ С†РёРєР» Р°СЃСЃРµС‚Р°.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  function handleCardKeyDown(event, index) {
    const navigableKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

    if (!navigableKeys.includes(event.key)) {
      return;
    }

    event.preventDefault();
    const columns = getGridColumns(cardRefs.current);
    let nextIndex = index;

    if (event.key === "ArrowRight") {
      nextIndex = Math.min(displayedItems.length - 1, index + 1);
    }

    if (event.key === "ArrowLeft") {
      nextIndex = Math.max(0, index - 1);
    }

    if (event.key === "ArrowDown") {
      nextIndex = Math.min(displayedItems.length - 1, index + columns);
    }

    if (event.key === "ArrowUp") {
      nextIndex = Math.max(0, index - columns);
    }

    const nextNode = cardRefs.current[nextIndex];
    const nextItem = displayedItems[nextIndex];

    nextNode?.focus();

    if (nextItem) {
      selectCard(nextItem.id);
    }
  }

  const activeFilterLabel = FILTERS.find((filter) => filter.key === filterKey)?.label || "Р’СЃРµ";
  const activeCollectionFilterLabel = getActiveCollectionFilterLabel(collectionFilterId, collectionOptions);

  return (
    <div className={styles.stack}>
      {message ? <div className={styles.statusPanelInfo}>{message}</div> : null}
      {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}

      <section className={styles.panel}>
        <div className={styles.mediaToolbar}>
          <div className={styles.mediaToolbarIntro}>
            <p className={styles.eyebrow}>Р Р°Р±РѕС‡РµРµ РјРµСЃС‚Рѕ</p>
            <h3 className={styles.mediaToolbarTitle}>РњРµРґРёР°С‚РµРєР°</h3>
            <p className={styles.helpText}>
              Р—РґРµСЃСЊ Р¶РёРІС‘С‚ Р±РёР±Р»РёРѕС‚РµРєР° РјРµРґРёР° Рё РІСЃС‚СЂРѕРµРЅРЅС‹Р№ СЃР»РѕР№ РєРѕР»Р»РµРєС†РёР№: СЃР»РµРІР° Рё РІ С†РµРЅС‚СЂРµ РѕСЃС‚Р°СЋС‚СЃСЏ РєР°СЂС‚РѕС‡РєРё, СЃРїСЂР°РІР° Р±С‹СЃС‚СЂС‹Р№ РёРЅСЃРїРµРєС‚РѕСЂ, Р° Р±РѕР»СЊС€РѕРµ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ РїРѕРІРµСЂС… С‚РѕРіРѕ Р¶Рµ СЌРєСЂР°РЅР°.
            </p>
            <div className={styles.mediaToolbarStats} aria-label="РЎРІРѕРґРєР° РјРµРґРёР°С‚РµРєРё">
              {summaryItems.map((item) => (
                <span key={item.label} className={styles.mediaToolbarStat}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className={styles.mediaToolbarControls}>
            <label className={styles.searchLabel}>
              <span>РџРѕРёСЃРє</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={styles.searchInput}
                placeholder="РќР°Р·РІР°РЅРёРµ, Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹Р№ С‚РµРєСЃС‚, РїРѕРґРїРёСЃСЊ, РёРјСЏ С„Р°Р№Р»Р°, РєРѕР»Р»РµРєС†РёСЏ"
              />
            </label>
            <label className={styles.label}>
              <span>РЎРѕСЂС‚РёСЂРѕРІРєР°</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                <option value="newest">РЎРЅР°С‡Р°Р»Р° РЅРѕРІС‹Рµ</option>
                <option value="oldest">РЎРЅР°С‡Р°Р»Р° СЃС‚Р°СЂС‹Рµ</option>
                <option value="title">РџРѕ РЅР°Р·РІР°РЅРёСЋ</option>
                <option value="status">РџРѕ СЃС‚Р°С‚СѓСЃСѓ</option>
              </select>
            </label>
            <button type="button" className={styles.primaryButton} onClick={openCreateOverlay}>
              Р—Р°РіСЂСѓР·РёС‚СЊ
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => openCollectionManager()}>
              РљРѕР»Р»РµРєС†РёРё
            </button>
            {selectedItem ? (
              <Link href={selectedDeleteHref} className={styles.secondaryButton}>Проверить удаление (legacy)</Link>
            ) : null}
            {selectedTestDeleteCount > 0 ? (
              <button type="button" className={styles.dangerButton} onClick={handleBulkDeleteTestData} disabled={deleteBusy}>
                {deleteBusy ? "РЈРґР°Р»СЏРµРј..." : `РЈРґР°Р»РёС‚СЊ С‚РµСЃС‚РѕРІС‹Рµ (${selectedTestDeleteCount})`}
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.mediaFilterRow} role="toolbar" aria-label="Р‘С‹СЃС‚СЂС‹Рµ С„РёР»СЊС‚СЂС‹ РјРµРґРёР°С‚РµРєРё">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`${styles.filterPill} ${filterKey === filter.key ? styles.filterPillActive : ""}`}
              onClick={() => setFilterKey(filter.key)}
            >
              {filter.label}
            </button>
          ))}
          <label className={`${styles.label} ${styles.mediaFilterSelect}`}>
            <span>РљРѕР»Р»РµРєС†РёСЏ</span>
            <select value={collectionFilterId} onChange={(event) => setCollectionFilterId(event.target.value)}>
              <option value={COLLECTION_FILTER_ALL}>Р’СЃРµ РєРѕР»Р»РµРєС†РёРё</option>
              <option value={COLLECTION_FILTER_ORPHAN}>Р‘РµР· РєРѕР»Р»РµРєС†РёРё</option>
              {collectionOptions.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.mediaWorkspace}>
          <section className={styles.mediaCanvas}>
            <div className={styles.mediaCanvasMeta}>
              <span>Р¤РёР»СЊС‚СЂ: {activeFilterLabel}</span>
              <span>РљРѕР»Р»РµРєС†РёСЏ: {activeCollectionFilterLabel}</span>
              <span>РџРѕРєР°Р·Р°РЅРѕ: {displayedItems.length}</span>
              <span>РљРѕР»Р»РµРєС†РёР№: {collections.length}</span>
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Р‘РёР±Р»РёРѕС‚РµРєР° РїРѕРєР° РїСѓСЃС‚Р°СЏ.</p>
                <p className={styles.helpText}>
                  РќР°С‡РЅРёС‚Рµ СЃ Р·Р°РіСЂСѓР·РєРё РїРµСЂРІРѕРіРѕ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ, Рё РѕРЅРѕ СЃСЂР°Р·Сѓ РїРѕСЏРІРёС‚СЃСЏ РІ РјРµРґРёР°С‚РµРєРµ РєР°Рє СЂР°Р±РѕС‡Р°СЏ РєР°СЂС‚РѕС‡РєР°.
                </p>
                <div className={styles.inlineActions}>
                  <button type="button" className={styles.primaryButton} onClick={openCreateOverlay}>
                    Р—Р°РіСЂСѓР·РёС‚СЊ РїРµСЂРІРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ
                  </button>
                </div>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className={styles.emptyState}>
                <p>РџРѕ С‚РµРєСѓС‰РµРјСѓ С„РёР»СЊС‚СЂСѓ РЅРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ.</p>
                <p className={styles.helpText}>
                  РЎР±СЂРѕСЃСЊС‚Рµ РїРѕРёСЃРє РёР»Рё РїРµСЂРµРєР»СЋС‡РёС‚Рµ Р±С‹СЃС‚СЂС‹Р№ С„РёР»СЊС‚СЂ, С‡С‚РѕР±С‹ СЃРЅРѕРІР° СѓРІРёРґРµС‚СЊ РєР°СЂС‚РѕС‡РєРё.
                </p>
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setQuery("");
                      setFilterKey("all");
                      setCollectionFilterId(COLLECTION_FILTER_ALL);
                    }}
                  >
                    РЎР±СЂРѕСЃРёС‚СЊ С„РёР»СЊС‚СЂС‹
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.mediaGalleryGrid}>
                {displayedItems.map((item, index) => {
                  const selected = item.id === selectedId;

                  return (
                    <button
                      key={item.id}
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                      type="button"
                      className={`${styles.mediaLibraryCardButton} ${selected ? styles.mediaLibraryCardButtonActive : ""} ${item.forcedVisible ? styles.mediaLibraryCardPinned : ""}`}
                      onClick={() => selectCard(item.id)}
                      onKeyDown={(event) => handleCardKeyDown(event, index)}
                      aria-pressed={selected}
                    >
                      <span className={styles.mediaLibraryThumb}>
                        {item.isTestData ? (
                          <label
                            className={styles.mediaDeleteMarker}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDeleteIds.includes(item.id)}
                              onChange={() => toggleDeleteSelection(item.id)}
                            />
                          </label>
                        ) : null}
                        {item.hasPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.previewUrl} alt={item.alt || item.title || item.originalFilename || "РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ"} />
                        ) : (
                          <span className={styles.mediaPlaceholder}>РќРµС‚ РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂР°</span>
                        )}
                      </span>
                      <span className={styles.mediaLibraryBody}>
                        <strong>{item.title}</strong>
                        <span className={styles.mutedText}>{item.originalFilename || "РРјСЏ С„Р°Р№Р»Р° РЅРµ Р·Р°РґР°РЅРѕ"}</span>
                        <span className={styles.mutedText}>РљРѕР»Р»РµРєС†РёРё: {item.collectionLabel}</span>
                        <span className={styles.mediaBadgeCluster}>
                          <span className={`${styles.badge} ${styles[`mediaBadge${getToneForItem(item)}`]}`}>{item.statusLabel}</span>
                          {item.publishedRevisionNumber ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ</span> : null}
                          {item.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>РўРµСЃС‚</span> : null}
                          {item.markedForRemovalAt ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>РЈРґР°Р»РµРЅРёРµ</span> : null}
                          {item.archived ? <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>РђСЂС…РёРІ</span> : null}
                          <span className={`${styles.badge} ${item.missingAlt ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
                          {item.missingAlt ? "РќРµС‚ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅРѕРіРѕ С‚РµРєСЃС‚Р°" : "РђР»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹Р№ С‚РµРєСЃС‚"}
                          </span>
                          <span className={`${styles.badge} ${item.usageCount ? styles.mediaBadgesuccess : styles.mediaBadgemuted}`}>
                            {item.usageCount ? `РЎРІСЏР·Рё ${item.usageCount}` : "РќРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ"}
                          </span>
                          {item.brokenBinary ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>РЎР»РѕРјР°РЅ</span> : null}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedHiddenByFilter ? (
              <div className={styles.statusPanelWarning}>
                Р’С‹Р±СЂР°РЅРЅР°СЏ РєР°СЂС‚РѕС‡РєР° СЃРµР№С‡Р°СЃ СЃРєСЂС‹С‚Р° С„РёР»СЊС‚СЂРѕРј, РЅРѕ РёРЅСЃРїРµРєС‚РѕСЂ СЃРѕС…СЂР°РЅС‘РЅ, С‡С‚РѕР±С‹ РІС‹ РЅРµ РїРѕС‚РµСЂСЏР»Рё РєРѕРЅС‚РµРєСЃС‚.
              </div>
            ) : null}
          </section>

          <MediaInspector
            item={selectedItem}
            onEdit={() => openEditOverlay(selectedItem)}
            onOpenCollectionManager={openCollectionManager}
            onCreateCollection={(assetId) => openCollectionManager({ seedAssetId: assetId, createNew: true })}
            onLifecycleAction={handleLifecycleAction}
            lifecycleBusy={lifecycleBusy}
            deleteHref={selectedDeleteHref}
            returnTo={currentWorkspaceHref}
          />
        </div>
      </section>

      <MediaOverlay
        mode={overlayMode === "asset-create" ? "create" : overlayMode === "asset-edit" ? "edit" : null}
        item={selectedItem}
        fields={assetFields}
        collections={collectionOptions}
        file={draftFile}
        editedBinary={editedBinaryFile}
        previewUrl={draftPreviewUrl}
        busy={overlayBusy}
        error={overlayError}
        dragActive={dragActive}
        onClose={closeOverlay}
        onFieldChange={handleAssetFieldChange}
        onToggleCollection={handleCollectionToggle}
        onFileSelect={handleFileSelect}
        onImageCommit={handleImageCommit}
        onImageReset={handleImageReset}
        onSubmit={overlayMode === "asset-create" ? handleCreateSubmit : handleEditSubmit}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFileSelect(event.dataTransfer.files?.[0] ?? null);
        }}
      />

      <MediaCollectionOverlay
        open={overlayMode === "collections"}
        busy={overlayBusy}
        error={overlayError}
        collections={collections}
        mediaItems={items}
        initialCollectionId={collectionContext.selectedCollectionId}
        seedAssetId={collectionContext.seedAssetId}
        createNew={collectionContext.createNew}
        returnTo={currentWorkspaceHref}
        onClose={closeOverlay}
        onSave={handleCollectionSubmit}
      />
    </div>
  );
}
