import { ENTITY_TYPES } from "../content-core/content-types.js";
import { buildPageWorkspaceBaseValue, getPageCardPreviewUrl, PAGE_TYPE_LABELS } from "./page-workspace.js";
import { getEntityTypeLabel, getOwnerApprovalStatusLabel, getPreviewStatusLabel } from "../ui-copy.js";
import { REVIEW_WORKFLOW_PRIORITIES, getReviewWorkflowStatusModel as getSharedReviewWorkflowStatusModel } from "./review-workflow-status.js";

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
  const status = getSharedReviewWorkflowStatusModel(revision);

  if (status.key === "needs_owner") {
    return {
      ...status,
      description: "Собственнику нужно подтвердить материал."
    };
  }

  if (status.key === "returned") {
    return {
      ...status,
      description: revision.reviewComment ? excerpt(revision.reviewComment, 120) : "Есть замечание для доработки."
    };
  }

  if (status.key === "approved") {
    return {
      ...status,
      description: "Согласование получено. Следующий шаг выполняется в карточке сущности, а не на экране проверки."
    };
  }

  return {
    ...status,
    description: "Материал проходит согласование. Публикация и снятие с публикации выполняются в карточке сущности."
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

function buildEquipmentCard(item) {
  const { payload } = item.revision;

  return {
    title: payload.title || "Техника без названия",
    summary: pickFirstExcerpt(
      [payload.shortSummary, payload.capabilitySummary, payload.usageScenarios],
      "Проверьте, что техника описана по сути: та ли это единица, для каких задач она подходит и соответствует ли фото."
    ),
    facts: uniqueCompactFacts([
      payload.equipmentType,
      payload.keySpecs,
      payload.usageScenarios
    ]),
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
    mediaUrl: getPageCardPreviewUrl(pageValue.primaryMediaAssetId),
    previewTitle: pageValue.h1 || pageValue.title || "Страница",
    previewIntro: pageValue.intro || "",
    previewThemeKey: pageValue.pageThemeKey || "earth_sand",
    previewHeroLayout: pageValue.mediaSettings?.heroLayout || "stacked",
    pageType: pageValue.pageType,
    slug: pageValue.slug || item.revision.payload?.slug || "",
    hasLivePublishedRevision: Boolean(item.revision.publishedAt)
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

function compactSections(sections) {
  return sections.filter((section) => section && section.value);
}

function buildServiceModalModel(item) {
  const { payload } = item.revision;
  const card = buildServiceCard(item);

  return {
    title: card.title,
    summary: card.summary,
    mediaUrl: card.mediaUrl,
    sections: compactSections([
      { label: "Что входит", value: excerpt(payload.serviceScope, 260) },
      { label: "Какую задачу решает", value: excerpt(payload.problemsSolved, 260) },
      { label: "Как выполняем", value: excerpt(payload.methods, 260) }
    ]),
    commentPlaceholder: "Например: услуга описана верно, но нужно точнее обозначить состав работ или убрать лишнее."
  };
}

function buildCaseModalModel(item) {
  const { payload } = item.revision;
  const card = buildCaseCard(item);

  return {
    title: card.title,
    summary: card.summary,
    mediaUrl: card.mediaUrl,
    sections: compactSections([
      { label: "Где и на каком объекте", value: excerpt([payload.location, payload.projectType], 220) },
      { label: "Что делали", value: excerpt([payload.task, payload.workScope], 260) },
      { label: "Какой результат", value: excerpt(payload.result, 260) }
    ]),
    commentPlaceholder: "Например: кейс реальный, но нужно поправить формулировку задачи или результата."
  };
}

function buildMediaModalModel(item) {
  const { payload } = item.revision;
  const card = buildMediaCard(item);

  return {
    title: card.title,
    summary: card.summary,
    mediaUrl: card.mediaUrl,
    sections: compactSections([
      { label: "Подпись", value: excerpt(payload.caption, 220) },
      { label: "Описание фото", value: excerpt(payload.alt, 220) },
      { label: "Примечание", value: excerpt([payload.ownershipNote, payload.sourceNote], 220) }
    ]),
    commentPlaceholder: "Например: фото подходит, но подпись нужно уточнить или заменить изображение."
  };
}

function buildEquipmentModalModel(item) {
  const { payload } = item.revision;
  const card = buildEquipmentCard(item);

  return {
    title: card.title,
    summary: card.summary,
    mediaUrl: card.mediaUrl,
    sections: compactSections([
      { label: "Тип техники", value: excerpt(payload.equipmentType, 180) },
      { label: "Для каких задач", value: excerpt(payload.capabilitySummary, 260) },
      { label: "Ключевые характеристики", value: excerpt(payload.keySpecs, 240) },
      { label: "Сценарии применения", value: excerpt(payload.usageScenarios, 240) }
    ]),
    commentPlaceholder: "Например: техника выбрана верно, но нужно уточнить описание возможностей или заменить фото."
  };
}

function buildPageModalModel(item) {
  const pageValue = buildPageWorkspaceBaseValue(item.revision);
  const card = buildPageCard(item);

  return {
    title: card.title,
    summary: card.summary,
    mediaUrl: card.mediaUrl,
    pageValue,
    sections: compactSections([
      { label: "Тип страницы", value: PAGE_TYPE_LABELS[pageValue.pageType] || "" },
      { label: "Вводный блок", value: excerpt(pageValue.intro, 240) },
      { label: "Секции", value: pageValue.sections?.length ? `На странице ${pageValue.sections.length} смысловых секций.` : "" }
    ]),
    commentPlaceholder: "Например: страница передает услугу верно, но нужно поправить акцент в тексте или заменить фото."
  };
}

function buildFallbackModalModel(item) {
  const card = buildFallbackCard(item);

  return {
    title: card.title,
    summary: card.summary,
    mediaUrl: card.mediaUrl,
    sections: [],
    commentPlaceholder: "Опишите коротко, что подтвердить или что нужно поправить."
  };
}

function buildCardPayload(item) {
  switch (item.entityType) {
    case ENTITY_TYPES.SERVICE:
      return buildServiceCard(item);
    case ENTITY_TYPES.CASE:
      return buildCaseCard(item);
    case ENTITY_TYPES.EQUIPMENT:
      return buildEquipmentCard(item);
    case ENTITY_TYPES.MEDIA_ASSET:
      return buildMediaCard(item);
    case ENTITY_TYPES.PAGE:
      return buildPageCard(item);
    default:
      return buildFallbackCard(item);
  }
}

export function buildOwnerReviewModalModel(item) {
  switch (item.entityType) {
    case ENTITY_TYPES.SERVICE:
      return buildServiceModalModel(item);
    case ENTITY_TYPES.CASE:
      return buildCaseModalModel(item);
    case ENTITY_TYPES.EQUIPMENT:
      return buildEquipmentModalModel(item);
    case ENTITY_TYPES.MEDIA_ASSET:
      return buildMediaModalModel(item);
    case ENTITY_TYPES.PAGE:
      return buildPageModalModel(item);
    default:
      return buildFallbackModalModel(item);
  }
}

export function buildOwnerReviewGalleryCards(queue = []) {
  return queue
    .map((item) => {
      const status = getOwnerReviewStatusModel(item.revision);
      const card = buildCardPayload(item);

      return {
        id: item.revision.id,
        href: `/admin/review?selected=${item.revision.id}`,
        entityId: item.entityId,
        entityType: item.entityType,
        entityTypeLabel: getEntityTypeLabel(item.entityType),
        title: card.title,
        summary: card.summary,
        facts: card.facts,
        mediaUrl: card.mediaUrl,
        previewTitle: card.previewTitle || "",
        previewIntro: card.previewIntro || "",
        previewThemeKey: card.previewThemeKey || "",
        previewHeroLayout: card.previewHeroLayout || "",
        pageType: card.pageType || "",
        slug: card.slug || "",
        hasLivePublishedRevision: card.hasLivePublishedRevision || false,
        submittedAtLabel: formatReviewDate(item.revision.submittedAt || item.revision.updatedAt),
        status,
        ownerApprovalLabel: getOwnerApprovalStatusLabel(item.revision.ownerApprovalStatus),
        previewStatusLabel: getPreviewStatusLabel(item.revision.previewStatus),
        needsAttention: status.attention,
        sortPriority: REVIEW_WORKFLOW_PRIORITIES[status.key] ?? REVIEW_WORKFLOW_PRIORITIES.in_review,
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
