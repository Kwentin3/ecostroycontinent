import { ENTITY_TYPES } from "../content-core/content-types.js";
import { buildPageWorkspaceBaseValue, getPageCardPreviewUrl, PAGE_TYPE_LABELS } from "./page-workspace.js";
import { getEntityTypeLabel, getOwnerApprovalStatusLabel, getPreviewStatusLabel } from "../ui-copy.js";

const STATUS_PRIORITIES = Object.freeze({
  needs_owner: 0,
  returned: 1,
  approved: 2,
  in_review: 3
});

function asText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => asText(item))
      .filter(Boolean)
      .join(". ")
      .trim();
  }

  if (value && typeof value === "object") {
    return "";
  }

  return "";
}

function excerpt(value, maxLength = 170) {
  const text = asText(value).replace(/\s+/g, " ").trim();

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function uniqueCompactFacts(values, maxItems = 3) {
  const result = [];
  const seen = new Set();

  for (const value of values) {
    const compact = excerpt(value, 96);

    if (!compact) {
      continue;
    }

    const key = compact.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(compact);

    if (result.length >= maxItems) {
      break;
    }
  }

  return result;
}

function pickFirstExcerpt(values, fallback) {
  for (const value of values) {
    const compact = excerpt(value);

    if (compact) {
      return compact;
    }
  }

  return fallback;
}

function formatReviewDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short"
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

export function getOwnerReviewStatusModel(revision) {
  if (revision.ownerReviewRequired && revision.ownerApprovalStatus === "pending") {
    return {
      key: "needs_owner",
      label: "Требует решения",
      description: "Собственнику нужно подтвердить материал.",
      attention: true
    };
  }

  if (revision.ownerApprovalStatus === "rejected") {
    return {
      key: "returned",
      label: "Возвращено",
      description: revision.reviewComment ? excerpt(revision.reviewComment, 120) : "Есть замечание для доработки.",
      attention: false
    };
  }

  if (revision.ownerApprovalStatus === "approved") {
    return {
      key: "approved",
      label: "Согласовано",
      description: "Решение собственника уже принято.",
      attention: false
    };
  }

  return {
    key: "in_review",
    label: "На проверке",
    description: "Материал проходит редакционную проверку.",
    attention: false
  };
}

function buildServiceCard(item) {
  const { payload } = item.revision;

  return {
    title: payload.title || payload.h1 || "Услуга без названия",
    summary: pickFirstExcerpt(
      [payload.summary, payload.serviceScope, payload.problemsSolved, payload.methods],
      "Проверьте, что услуга описывает именно то, что вы реально оказываете."
    ),
    facts: uniqueCompactFacts([payload.serviceScope, payload.problemsSolved, payload.methods]),
    mediaUrl: getPageCardPreviewUrl(payload.primaryMediaAssetId)
  };
}

function buildCaseCard(item) {
  const { payload } = item.revision;

  return {
    title: payload.title || payload.h1 || "Кейс без названия",
    summary: pickFirstExcerpt(
      [payload.summary, payload.result, payload.task, payload.workScope],
      "Проверьте, что кейс отражает реальный объект, задачу и результат."
    ),
    facts: uniqueCompactFacts([payload.location, payload.projectType, payload.task, payload.result]),
    mediaUrl: getPageCardPreviewUrl(payload.primaryMediaAssetId)
  };
}

function buildMediaCard(item) {
  const { payload } = item.revision;

  return {
    title: payload.title || payload.originalFilename || "Медиа без названия",
    summary: pickFirstExcerpt(
      [payload.caption, payload.alt, payload.ownershipNote, payload.sourceNote],
      "Проверьте фотографию и ее описание."
    ),
    facts: uniqueCompactFacts([payload.caption, payload.alt, payload.ownershipNote]),
    mediaUrl: payload.storageKey ? `/api/admin/media/${item.entityId}/preview` : ""
  };
}

function buildPageCard(item) {
  const pageValue = buildPageWorkspaceBaseValue(item.revision);

  return {
    title: pageValue.h1 || pageValue.title || "Страница без названия",
    summary: pickFirstExcerpt(
      [pageValue.intro, pageValue.sections?.map((section) => section.body || section.title || "").filter(Boolean)],
      "Проверьте, что страница передает именно тот материал, который должен увидеть посетитель."
    ),
    facts: uniqueCompactFacts([
      PAGE_TYPE_LABELS[pageValue.pageType] || "",
      pageValue.sections?.length ? `Секций: ${pageValue.sections.length}` : "",
      pageValue.targeting?.geoLabel || ""
    ]),
    mediaUrl: getPageCardPreviewUrl(pageValue.primaryMediaAssetId)
  };
}

function buildFallbackCard(item) {
  return {
    title: item.revision.payload?.title || getEntityTypeLabel(item.entityType),
    summary: "Проверьте содержимое материала и подтвердите, что он отражает реальную суть.",
    facts: [],
    mediaUrl: ""
  };
}

function buildCardPayload(item) {
  switch (item.entityType) {
    case ENTITY_TYPES.SERVICE:
      return buildServiceCard(item);
    case ENTITY_TYPES.CASE:
      return buildCaseCard(item);
    case ENTITY_TYPES.MEDIA_ASSET:
      return buildMediaCard(item);
    case ENTITY_TYPES.PAGE:
      return buildPageCard(item);
    default:
      return buildFallbackCard(item);
  }
}

export function buildOwnerReviewGalleryCards(queue = []) {
  return queue
    .map((item) => {
      const status = getOwnerReviewStatusModel(item.revision);
      const card = buildCardPayload(item);

      return {
        id: item.revision.id,
        href: `/admin/review/${item.revision.id}`,
        entityId: item.entityId,
        entityType: item.entityType,
        entityTypeLabel: getEntityTypeLabel(item.entityType),
        title: card.title,
        summary: card.summary,
        facts: card.facts,
        mediaUrl: card.mediaUrl,
        submittedAtLabel: formatReviewDate(item.revision.submittedAt || item.revision.updatedAt),
        status,
        ownerApprovalLabel: getOwnerApprovalStatusLabel(item.revision.ownerApprovalStatus),
        previewStatusLabel: getPreviewStatusLabel(item.revision.previewStatus),
        needsAttention: status.attention,
        sortPriority: STATUS_PRIORITIES[status.key] ?? STATUS_PRIORITIES.in_review,
        revision: item.revision
      };
    })
    .sort((left, right) => {
      if (left.sortPriority !== right.sortPriority) {
        return left.sortPriority - right.sortPriority;
      }

      const leftTimestamp = new Date(left.revision.submittedAt || left.revision.updatedAt || 0).getTime();
      const rightTimestamp = new Date(right.revision.submittedAt || right.revision.updatedAt || 0).getTime();

      if (leftTimestamp !== rightTimestamp) {
        return rightTimestamp - leftTimestamp;
      }

      return left.title.localeCompare(right.title, "ru");
    });
}

export function summarizeOwnerReviewGallery(cards = []) {
  return cards.reduce(
    (acc, card) => {
      acc.total += 1;
      acc.byStatus[card.status.key] = (acc.byStatus[card.status.key] || 0) + 1;
      acc.byType[card.entityType] = (acc.byType[card.entityType] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      byStatus: {},
      byType: {}
    }
  );
}

export function filterOwnerReviewGalleryCards(cards = [], filters = {}) {
  const query = typeof filters.query === "string" ? filters.query.trim().toLowerCase() : "";
  const status = typeof filters.status === "string" ? filters.status : "all";
  const type = typeof filters.type === "string" ? filters.type : "all";

  return cards.filter((card) => {
    if (status !== "all" && card.status.key !== status) {
      return false;
    }

    if (type !== "all" && card.entityType !== type) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      card.title,
      card.summary,
      card.entityTypeLabel,
      ...card.facts
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
