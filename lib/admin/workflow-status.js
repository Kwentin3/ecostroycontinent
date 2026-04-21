function hasRevisionNumber(revision = null) {
  return Number.isFinite(Number(revision?.revisionNumber));
}

function formatRevisionLabel(revision = null) {
  if (!hasRevisionNumber(revision)) {
    return "актуальная live-версия";
  }

  return `версия №${revision.revisionNumber}`;
}

export function getWorkingRevisionStatusModel({
  currentRevision = null,
  activePublishedRevision = null
} = {}) {
  if (!currentRevision) {
    return {
      key: "new",
      label: "Новая карточка",
      tone: "unknown",
      description: "Карточка ещё не сохранена как рабочая версия."
    };
  }

  const hasLivePublishedRevision = Boolean(activePublishedRevision);
  const currentRevisionIsLive = Boolean(
    currentRevision?.id
    && activePublishedRevision?.id
    && currentRevision.id === activePublishedRevision.id
  );

  if (currentRevision.state === "draft") {
    if (currentRevision.ownerApprovalStatus === "rejected") {
      return {
        key: "changes_requested",
        label: "Требует доработки",
        tone: "danger",
        description: "Есть замечания по прошлому согласованию. Обновите карточку и отправьте её на согласование повторно."
      };
    }

    return {
      key: hasLivePublishedRevision ? "draft_changes" : "draft",
      label: hasLivePublishedRevision ? "Черновик изменений" : "Черновик",
      tone: hasLivePublishedRevision ? "warning" : "unknown",
      description: hasLivePublishedRevision
        ? "В live остаётся опубликованная версия, а новые правки пока сохранены только в черновике."
        : "Карточка заполняется и ещё не отправлена на согласование."
    };
  }

  if (currentRevision.state === "review") {
    if (currentRevision.ownerReviewRequired && currentRevision.ownerApprovalStatus === "pending") {
      return {
        key: "owner_review",
        label: "На согласовании",
        tone: "warning",
        description: "Карточка ждёт решения собственника."
      };
    }

    return {
      key: "ready_to_publish",
      label: "Готово к публикации",
      tone: "healthy",
      description: hasLivePublishedRevision
        ? "Согласование получено. Новые изменения можно опубликовать отдельно от уже живой версии."
        : "Согласование получено. Карточку можно публиковать."
    };
  }

  if (currentRevision.state === "published") {
    if (!hasLivePublishedRevision || !currentRevisionIsLive) {
      return {
        key: "withdrawn",
        label: "Снято с публикации",
        tone: "warning",
        description: "Опубликованная версия сохранена в истории, но сейчас не активна в live."
      };
    }

    return {
      key: "synced_live",
      label: "Изменений нет",
      tone: "healthy",
      description: "В работе нет отдельного черновика: активна текущая опубликованная версия."
    };
  }

  return {
    key: currentRevision.state || "unknown",
    label: currentRevision.state || "Статус неизвестен",
    tone: "unknown",
    description: "Статус карточки требует уточнения."
  };
}

export function getLivePublicationStatusModel({
  currentRevision = null,
  activePublishedRevision = null
} = {}) {
  const hasLivePublishedRevision = Boolean(activePublishedRevision);
  const currentRevisionIsLive = Boolean(
    currentRevision?.id
    && activePublishedRevision?.id
    && currentRevision.id === activePublishedRevision.id
  );

  if (hasLivePublishedRevision) {
    return {
      key: currentRevisionIsLive ? "published" : "published_with_pending_changes",
      label: "Опубликовано",
      tone: "healthy",
      description: currentRevisionIsLive
        ? `В live активна ${formatRevisionLabel(activePublishedRevision)}.`
        : `В live активна ${formatRevisionLabel(activePublishedRevision)}, а новые правки ещё не опубликованы.`
    };
  }

  if (currentRevision?.state === "published") {
    return {
      key: "withdrawn",
      label: "Не опубликовано",
      tone: "warning",
      description: "Активной live-версии сейчас нет: карточка уже снята с публикации."
    };
  }

  return {
    key: "not_published",
    label: "Не опубликовано",
    tone: "unknown",
    description: "Карточка пока не выведена в live."
  };
}

export function getPublishActionCopy({ activePublishedRevision = null } = {}) {
  const hasLivePublishedRevision = Boolean(activePublishedRevision);

  return {
    label: hasLivePublishedRevision ? "Опубликовать изменения" : "Опубликовать",
    confirmMessage: hasLivePublishedRevision
      ? "Опубликовать изменения и заменить текущую live-версию?"
      : "Опубликовать эту версию?"
  };
}
