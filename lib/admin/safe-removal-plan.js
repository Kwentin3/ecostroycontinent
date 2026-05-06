import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "../content-core/content-types.js";
import { assessEntityDelete, isDeleteToolEntityTypeSupported } from "./entity-delete.js";
import {
  evaluateLegacyTestFixtureNormalization,
  isLegacyTestFixtureNormalizationEntityTypeSupported
} from "./legacy-test-fixture-normalization.js";
import { evaluateLiveDeactivation, isLiveDeactivationEntityTypeSupported } from "./live-deactivation.js";
import { appendAdminReturnTo } from "./relation-navigation.js";
import { evaluateTestGraphTeardown, isTestGraphTeardownEntityTypeSupported } from "./test-graph-teardown.js";

function buildLinkAction({ label, href, tone = "secondary", permission = null }) {
  return {
    type: "link",
    label,
    href,
    tone,
    permission
  };
}

function buildFormAction({
  label,
  action,
  confirmMessage,
  fields = [],
  tone = "danger",
  permission = "edit"
}) {
  return {
    type: "form",
    label,
    action,
    confirmMessage,
    fields,
    tone,
    permission
  };
}

function buildRefreshAction(currentHref) {
  return buildLinkAction({
    label: "Проверить снова",
    href: currentHref,
    tone: "secondary"
  });
}

const ENTITY_TYPE_WORD_FORMS = {
  [ENTITY_TYPES.GLOBAL_SETTINGS]: {
    nominative: "глобальные настройки",
    accusative: "глобальные настройки",
    genitive: "глобальных настроек",
    prepositional: "глобальных настройках",
    instrumental: "глобальными настройками"
  },
  [ENTITY_TYPES.MEDIA_ASSET]: {
    nominative: "медиафайл",
    accusative: "медиафайл",
    genitive: "медиафайла",
    prepositional: "медиафайле",
    instrumental: "медиафайлом"
  },
  [ENTITY_TYPES.GALLERY]: {
    nominative: "коллекция",
    accusative: "коллекцию",
    genitive: "коллекции",
    prepositional: "коллекции",
    instrumental: "коллекцией"
  },
  [ENTITY_TYPES.SERVICE]: {
    nominative: "услуга",
    accusative: "услугу",
    genitive: "услуги",
    prepositional: "услуге",
    instrumental: "услугой"
  },
  [ENTITY_TYPES.EQUIPMENT]: {
    nominative: "техника",
    accusative: "технику",
    genitive: "техники",
    prepositional: "технике",
    instrumental: "техникой"
  },
  [ENTITY_TYPES.CASE]: {
    nominative: "кейс",
    accusative: "кейс",
    genitive: "кейса",
    prepositional: "кейсе",
    instrumental: "кейсом"
  },
  [ENTITY_TYPES.PAGE]: {
    nominative: "страница",
    accusative: "страницу",
    genitive: "страницы",
    prepositional: "странице",
    instrumental: "страницей"
  }
};

function getEntityTypeLabel(entityType, grammaticalCase = "nominative") {
  return ENTITY_TYPE_WORD_FORMS[entityType]?.[grammaticalCase]
    || (ENTITY_TYPE_LABELS[entityType] || "сущность").toLowerCase();
}

function getRootStateLabel(root) {
  if (!root) {
    return "Состояние объекта не удалось определить.";
  }

  if (root.published && root.hasReviewRevision) {
    return "Есть опубликованная версия и ревизия на проверке.";
  }

  if (root.published) {
    return "Есть действующая опубликованная версия.";
  }

  if (root.hasReviewRevision) {
    return "Есть ревизия на проверке.";
  }

  return "Живой публикации нет.";
}

function buildManualRefAction(ref, currentHref) {
  if (!ref?.href) {
    return buildRefreshAction(currentHref);
  }

  const entityLabel = getEntityTypeLabel(ref.entityType, ref.state === "draft" ? "genitive" : "accusative");

  return buildLinkAction({
    label: ref.state === "draft"
      ? `Открыть черновик ${entityLabel} и убрать связь`
      : `Открыть ${entityLabel} и освободить ссылку`,
    href: appendAdminReturnTo(ref.href, currentHref),
    tone: "primary"
  });
}

function buildBlockerAction(blocker, currentHref) {
  if (!blocker?.href) {
    return buildRefreshAction(currentHref);
  }

  return buildLinkAction({
    label: blocker.kind === "review_revision" ? "Открыть ревизию" : "Открыть и снять блокировку",
    href: appendAdminReturnTo(blocker.href, currentHref),
    tone: "secondary"
  });
}

function buildDeleteAction(entityType, entityId, redirectTo, failureRedirectTo) {
  return buildFormAction({
    label: "Удалить объект",
    action: `/api/admin/entities/${entityType}/delete`,
    confirmMessage: "Удалить объект? Действие необратимо.",
    fields: [
      { name: "entityId", value: entityId },
      { name: "redirectTo", value: redirectTo },
      { name: "failureRedirectTo", value: failureRedirectTo }
    ],
    tone: "danger",
    permission: "edit"
  });
}

function buildLiveDeactivationAction(entityType, entityId, currentHref) {
  return buildFormAction({
    label: "Снять с публикации",
    action: `/api/admin/entities/${entityType}/${entityId}/live-deactivation`,
    confirmMessage: "Снять объект с публикации? Публичный маршрут перестанет быть доступным.",
    fields: [
      { name: "redirectTo", value: currentHref },
      { name: "failureRedirectTo", value: currentHref }
    ],
    tone: "danger",
    permission: "publish"
  });
}

function buildTestGraphTeardownAction(entityType, entityId, redirectTo, failureRedirectTo) {
  return buildFormAction({
    label: "Удалить тестовый граф",
    action: `/api/admin/entities/${entityType}/${entityId}/test-graph-teardown`,
    confirmMessage: "Удалить тестовый граф? Действие необратимо.",
    fields: [
      { name: "redirectTo", value: redirectTo },
      { name: "failureRedirectTo", value: failureRedirectTo }
    ],
    tone: "danger",
    permission: "edit"
  });
}

function buildNormalizationAction(entityType, entityId, currentHref) {
  return buildFormAction({
    label: "Пометить как тестовый объект",
    action: `/api/admin/entities/${entityType}/${entityId}/normalize-test-fixture`,
    confirmMessage: "Пометить объект как устаревший тестовый набор? Это изменит путь безопасного удаления.",
    fields: [
      { name: "redirectTo", value: currentHref },
      { name: "failureRedirectTo", value: currentHref }
    ],
    tone: "secondary",
    permission: "publish"
  });
}

function makeDoneStep(id, title, description) {
  return {
    id,
    title,
    description,
    status: "done",
    action: null
  };
}

function makeCurrentStep(id, title, description, action = null) {
  return {
    id,
    title,
    description,
    status: "current",
    action
  };
}

function makeWaitingStep(id, title, description) {
  return {
    id,
    title,
    description,
    status: "waiting",
    action: null
  };
}

function makeBlockedStep(id, title, description, action = null) {
  return {
    id,
    title,
    description,
    status: "blocked",
    action
  };
}

function buildPublishedRefStep(publishedIncomingRefs, currentHref) {
  if (publishedIncomingRefs.length === 0) {
    return makeDoneStep(
      "published-incoming",
      "Освободить объект из опубликованных связей",
      "Опубликованных входящих ссылок не найдено."
    );
  }

  const [firstRef] = publishedIncomingRefs;
  return makeCurrentStep(
    "published-incoming",
    "Освободить объект из опубликованных связей",
    `Этот объект всё ещё используется в опубликованной ${getEntityTypeLabel(firstRef.entityType, "prepositional")} «${firstRef.label}». Сначала уберите связь и перепубликуйте связанный объект.`,
    buildManualRefAction(firstRef, currentHref)
  );
}

function buildDraftRefStep(publishedIncomingRefs, draftIncomingRefs, currentHref) {
  if (draftIncomingRefs.length === 0) {
    return makeDoneStep(
      "draft-incoming",
      "Разобрать рабочие черновики",
      "Нет нетестовых черновиков, которые держат этот объект."
    );
  }

  const [firstRef] = draftIncomingRefs;
  const description = `В рабочем черновике ${getEntityTypeLabel(firstRef.entityType, "genitive")} «${firstRef.label}» всё ещё есть ссылка на этот объект. Уберите связь и сохраните черновик.`;

  if (publishedIncomingRefs.length > 0) {
    return makeWaitingStep("draft-incoming", "Разобрать рабочие черновики", description);
  }

  return makeCurrentStep(
    "draft-incoming",
    "Разобрать рабочие черновики",
    description,
    buildManualRefAction(firstRef, currentHref)
  );
}

function buildStateBlockerStep(publishedIncomingRefs, draftIncomingRefs, stateBlockers, currentHref) {
  if (stateBlockers.length === 0) {
    return makeDoneStep(
      "state-blockers",
      "Закрыть состояния, которые мешают удалению",
      "Ревизий на проверке, открытых обязательств и других state-blockers не найдено."
    );
  }

  const [firstBlocker] = stateBlockers;
  const description = firstBlocker.reason;

  if (publishedIncomingRefs.length > 0 || draftIncomingRefs.length > 0) {
    return makeWaitingStep("state-blockers", "Закрыть состояния, которые мешают удалению", description);
  }

  return makeCurrentStep(
    "state-blockers",
    "Закрыть состояния, которые мешают удалению",
    description,
    buildBlockerAction(firstBlocker, currentHref)
  );
}

function buildLiveRemovalStep({
  root,
  publishedIncomingRefs,
  draftIncomingRefs,
  stateBlockers,
  liveEvaluation,
  liveAction
}) {
  if (!root?.published) {
    return makeDoneStep(
      "live-removal",
      "Вывести объект из живого контура",
      "Объект уже не опубликован."
    );
  }

  if (publishedIncomingRefs.length > 0 || draftIncomingRefs.length > 0 || stateBlockers.length > 0) {
    return makeWaitingStep(
      "live-removal",
      "Вывести объект из живого контура",
      "Этот шаг станет доступен после очистки входящих ссылок, черновиков и блокирующих состояний."
    );
  }

  if (liveEvaluation?.allowed) {
    return makeCurrentStep(
      "live-removal",
      "Вывести объект из живого контура",
      "Система снимет действующую опубликованную версию, обновит публичный контур и сохранит историю объекта.",
      liveAction
    );
  }

  return makeBlockedStep(
    "live-removal",
    "Вывести объект из живого контура",
    liveEvaluation?.blockers?.[0] || "Снять объект с публикации пока нельзя.",
    buildRefreshAction(liveAction?.fields?.[0]?.value || "#")
  );
}

function buildDeleteFinalStep({
  root,
  deleteEvaluation,
  publishedIncomingRefs,
  draftIncomingRefs,
  stateBlockers,
  liveEvaluation,
  deleteAction
}) {
  if (deleteEvaluation.allowed) {
    return makeCurrentStep(
      "delete-final",
      "Подтвердить удаление",
      "Все safety-проверки пройдены. Можно удалить объект необратимо.",
      deleteAction
    );
  }

  if (root?.published && liveEvaluation?.allowed && publishedIncomingRefs.length === 0 && draftIncomingRefs.length === 0 && stateBlockers.length === 0) {
    return makeWaitingStep(
      "delete-final",
      "Подтвердить удаление",
      "Сначала снимите объект с публикации, затем экран пересчитается и откроет финальное удаление."
    );
  }

  return makeWaitingStep(
    "delete-final",
    "Подтвердить удаление",
    "Финальное удаление станет доступно после выполнения шагов выше."
  );
}

function buildStandardPlan({
  entityType,
  entityId,
  currentHref,
  redirectTo,
  failureRedirectTo,
  deleteEvaluation,
  liveEvaluation
}) {
  const publishedIncomingRefs = deleteEvaluation.publishedIncomingRefs ?? [];
  const draftIncomingRefs = deleteEvaluation.draftIncomingRefs ?? [];
  const stateBlockers = (deleteEvaluation.stateBlockers ?? []).filter((blocker) => blocker.kind !== "published_truth");
  const deleteAction = buildDeleteAction(entityType, entityId, redirectTo, failureRedirectTo);
  const liveAction = buildLiveDeactivationAction(entityType, entityId, currentHref);
  const steps = [
    buildPublishedRefStep(publishedIncomingRefs, currentHref),
    buildDraftRefStep(publishedIncomingRefs, draftIncomingRefs, currentHref),
    buildStateBlockerStep(publishedIncomingRefs, draftIncomingRefs, stateBlockers, currentHref),
    buildLiveRemovalStep({
      root: deleteEvaluation.root,
      publishedIncomingRefs,
      draftIncomingRefs,
      stateBlockers,
      liveEvaluation,
      liveAction
    }),
    buildDeleteFinalStep({
      root: deleteEvaluation.root,
      deleteEvaluation,
      publishedIncomingRefs,
      draftIncomingRefs,
      stateBlockers,
      liveEvaluation,
      deleteAction
    })
  ];
  const manualStateBlockers = stateBlockers.length > 0;
  let mode = "delete_blocked";
  let summary = "Система ещё не готова безопасно удалить объект. Выполните шаги ниже и затем вернитесь к финальному подтверждению.";
  let primaryAction = buildRefreshAction(currentHref);

  if (deleteEvaluation.allowed) {
    mode = "delete_ready";
    summary = "Объект больше не удерживается живыми связями и готов к необратимому удалению.";
    primaryAction = deleteAction;
  } else if (publishedIncomingRefs.length > 0) {
    mode = "blocked_by_published_refs";
    summary = "Удаление остановлено опубликованными входящими связями. Сначала освободите объект из live-контура связанных сущностей.";
    primaryAction = buildManualRefAction(publishedIncomingRefs[0], currentHref);
  } else if (draftIncomingRefs.length > 0) {
    mode = "blocked_by_draft_refs";
    summary = "Удаление остановлено рабочими черновиками. Сначала уберите висящие ссылки из draft-объектов.";
    primaryAction = buildManualRefAction(draftIncomingRefs[0], currentHref);
  } else if (manualStateBlockers) {
    mode = "blocked_by_state";
    summary = "Удаление остановлено состоянием самого объекта: сначала нужно закрыть проверку, обязательства или другие блокирующие статусы.";
    primaryAction = buildBlockerAction(stateBlockers[0], currentHref);
  } else if (deleteEvaluation.root?.published && liveEvaluation?.allowed) {
    mode = "live_deactivation_ready";
    summary = "Объект всё ещё опубликован. Сначала безопасно выведите его из live-контура, а затем вернитесь к финальному удалению.";
    primaryAction = liveAction;
  }

  return {
    mode,
    summary,
    primaryAction,
    steps
  };
}

function buildTestGraphPlan({
  entityType,
  entityId,
  currentHref,
  redirectTo,
  failureRedirectTo,
  deleteEvaluation,
  testGraphEvaluation
}) {
  const blockingRefs = testGraphEvaluation?.blockingRefs ?? [];
  const teardownAction = buildTestGraphTeardownAction(entityType, entityId, redirectTo, failureRedirectTo);
  const steps = [];

  if (blockingRefs.length === 0) {
    steps.push(makeDoneStep(
      "test-graph-links",
      "Освободить тестовый граф от живых зависимостей",
      "Граф не удерживается живыми нетестовыми ссылками."
    ));
  } else {
    const [firstRef] = blockingRefs;
    steps.push(makeCurrentStep(
      "test-graph-links",
      "Освободить тестовый граф от живых зависимостей",
      `Тестовый граф всё ещё удерживается ${getEntityTypeLabel(firstRef.entityType, "instrumental")} «${firstRef.label}». Сначала уберите эту связь или выведите связанный объект из live-контура.`,
      buildManualRefAction(firstRef, currentHref)
    ));
  }

  steps.push(
    testGraphEvaluation?.allowed
      ? makeCurrentStep(
        "test-graph-system",
        "Автоматически снять test-версии и закрыть обязательства",
        "Система сама отключит опубликованные test-версии, закроет открытые publish-обязательства и удалит участников графа в безопасном порядке."
      )
      : makeWaitingStep(
        "test-graph-system",
        "Автоматически снять test-версии и закрыть обязательства",
        "Этот шаг станет доступен после очистки блокирующих ссылок и состояний."
      )
  );

  steps.push(
    testGraphEvaluation?.allowed
      ? makeCurrentStep(
        "test-graph-delete",
        "Подтвердить удаление тестового графа",
        "После подтверждения тестовый граф будет удалён целиком.",
        teardownAction
      )
      : makeWaitingStep(
        "test-graph-delete",
        "Подтвердить удаление тестового графа",
        "Финальное удаление тестового графа откроется после выполнения шагов выше."
      )
  );

  return {
    mode: testGraphEvaluation?.allowed ? "test_graph_ready" : "test_graph_blocked",
    summary: testGraphEvaluation?.allowed
      ? "Объект помечен как тестовый. Весь тестовый граф можно удалить из одного места с одним подтверждением."
      : "Объект помечен как тестовый, но граф пока смешан с живыми или незавершёнными сущностями. Сначала освободите его от этих зависимостей.",
    primaryAction: testGraphEvaluation?.allowed
      ? teardownAction
      : (blockingRefs[0] ? buildManualRefAction(blockingRefs[0], currentHref) : buildRefreshAction(currentHref)),
    steps,
    fallbackPlan: deleteEvaluation.allowed
      ? {
        label: "Если нужно удалить только этот объект, можно использовать обычное удаление",
        action: buildDeleteAction(entityType, entityId, redirectTo, failureRedirectTo)
      }
      : null
  };
}

export async function buildSafeRemovalPlan(input, deps = {}) {
  const resolvedDeps = {
    assessEntityDelete,
    evaluateLiveDeactivation,
    evaluateLegacyTestFixtureNormalization,
    evaluateTestGraphTeardown,
    ...deps
  };
  const entityType = String(input.entityType ?? "").trim();
  const entityId = String(input.entityId ?? "").trim();
  const currentHref = String(input.currentHref ?? "").trim();
  const redirectTo = String(input.redirectTo ?? "").trim();
  const failureFallbackHref = currentHref || redirectTo;
  const failureRedirectTo = String(input.failureRedirectTo ?? failureFallbackHref).trim();

  if (!isDeleteToolEntityTypeSupported(entityType)) {
    return {
      exists: false,
      entityType,
      entityId,
      mode: "unsupported",
      summary: "Этот тип сущности пока не поддерживает безопасное удаление.",
      root: null,
      steps: [],
      primaryAction: null,
      secondaryAction: null,
      deleteEvaluation: null,
      liveDeactivationEvaluation: null,
      testGraphEvaluation: null,
      normalizationEvaluation: null,
      currentStateLabel: "Состояние объекта не удалось определить."
    };
  }

  const deleteEvaluation = await resolvedDeps.assessEntityDelete({ entityType, entityId });

  if (!deleteEvaluation?.exists) {
    return {
      exists: false,
      entityType,
      entityId,
      mode: "missing",
      summary: deleteEvaluation?.reasons?.[0] || "Сущность не найдена.",
      root: null,
      steps: [],
      primaryAction: null,
      secondaryAction: null,
      deleteEvaluation,
      liveDeactivationEvaluation: null,
      testGraphEvaluation: null,
      normalizationEvaluation: null,
      currentStateLabel: "Сущность не найдена."
    };
  }

  const root = deleteEvaluation.root ?? null;
  const [liveDeactivationEvaluation, testGraphEvaluation, normalizationEvaluation] = await Promise.all([
    isLiveDeactivationEntityTypeSupported(entityType) && root?.published
      ? resolvedDeps.evaluateLiveDeactivation({ entityType, entityId })
      : Promise.resolve(null),
    isTestGraphTeardownEntityTypeSupported(entityType) && root?.isTestData
      ? resolvedDeps.evaluateTestGraphTeardown({ entityType, entityId })
      : Promise.resolve(null),
    isLegacyTestFixtureNormalizationEntityTypeSupported(entityType) && !root?.isTestData
      ? resolvedDeps.evaluateLegacyTestFixtureNormalization({ entityType, entityId })
      : Promise.resolve(null)
  ]);

  const standardPlan = buildStandardPlan({
    entityType,
    entityId,
    currentHref,
    redirectTo,
    failureRedirectTo,
    deleteEvaluation,
    liveEvaluation: liveDeactivationEvaluation
  });
  const activePlan = root?.isTestData && testGraphEvaluation
    ? buildTestGraphPlan({
      entityType,
      entityId,
      currentHref,
      redirectTo,
      failureRedirectTo,
      deleteEvaluation,
      testGraphEvaluation
    })
    : standardPlan;
  const secondaryAction = normalizationEvaluation?.allowed
    ? buildNormalizationAction(entityType, entityId, currentHref)
    : null;

  return {
    exists: true,
    entityType,
    entityId,
    mode: activePlan.mode,
    summary: activePlan.summary,
    root,
    currentStateLabel: getRootStateLabel(root),
    steps: activePlan.steps,
    primaryAction: activePlan.primaryAction,
    fallbackPlan: activePlan.fallbackPlan ?? null,
    secondaryAction,
    deleteEvaluation,
    liveDeactivationEvaluation,
    testGraphEvaluation,
    normalizationEvaluation
  };
}
