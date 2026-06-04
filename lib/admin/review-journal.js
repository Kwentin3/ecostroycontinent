import { AUDIT_EVENT_KEYS } from "../content-core/content-types.js";
import { getEntityTypeLabel } from "../ui-copy.js";

const REVIEW_JOURNAL_TIME_ZONE = "Europe/Moscow";
const FALLBACK_TITLE = "Материал без названия";

const REVIEW_JOURNAL_PRESENTATION = Object.freeze({
  [AUDIT_EVENT_KEYS.REVIEW_REQUESTED]: {
    actionLabel: "Отправлено",
    actionText: "отправил на проверку",
    tone: "neutral"
  },
  [AUDIT_EVENT_KEYS.OWNER_APPROVED]: {
    actionLabel: "Одобрено",
    actionText: "одобрил",
    tone: "success"
  },
  [AUDIT_EVENT_KEYS.SENT_BACK_WITH_COMMENT]: {
    actionLabel: "Возврат",
    actionText: "вернул с замечанием",
    tone: "warning"
  },
  [AUDIT_EVENT_KEYS.OWNER_REJECTED]: {
    actionLabel: "Отклонено",
    actionText: "отклонил",
    tone: "danger"
  },
  [AUDIT_EVENT_KEYS.REVIEW_SUPERSEDED]: {
    actionLabel: "Новая версия",
    actionText: "заменил заявку новой версией",
    tone: "info"
  },
  [AUDIT_EVENT_KEYS.REVIEW_DUPLICATE_REQUESTED]: {
    actionLabel: "Без изменений",
    actionText: "повторно отправил без изменений",
    tone: "muted"
  }
});

function asText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function excerpt(value, maxLength = 120) {
  const text = asText(value).replace(/\s+/g, " ").trim();

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function pickTitle(payload = {}) {
  return excerpt(
    payload.title
      || payload.h1
      || payload.name
      || payload.originalFilename
      || payload.caption
      || payload.slug
      || "",
    96
  ) || FALLBACK_TITLE;
}

function getActorLabel(event = {}) {
  return excerpt(event.actorDisplayName || event.actorUsername || "", 48) || "Система";
}

export function formatReviewJournalTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: REVIEW_JOURNAL_TIME_ZONE
  }).format(date);
}

export function buildReviewJournalViewModel(events = []) {
  return events
    .map((event) => {
      const presentation = REVIEW_JOURNAL_PRESENTATION[event?.eventKey];

      if (!presentation) {
        return null;
      }

      const title = pickTitle(event.revisionPayload || {});
      const actorLabel = getActorLabel(event);
      const entityTypeLabel = event.entityType ? getEntityTypeLabel(event.entityType) : "Материал";
      const comment = excerpt(event.details?.comment || "", 140);

      return {
        id: event.id,
        actionLabel: presentation.actionLabel,
        actorLabel,
        comment,
        entityTypeLabel,
        summary: `${actorLabel} ${presentation.actionText} "${title}"`,
        timeLabel: formatReviewJournalTime(event.createdAt),
        tone: presentation.tone
      };
    })
    .filter(Boolean);
}
