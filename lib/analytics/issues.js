import { ISSUE_TYPES } from "./constants.js";

const ISSUE_LABELS = Object.freeze({
  low_ctr: "Низкий CTR",
  traffic_no_intent: "Есть трафик, мало контактных действий",
  published_service_no_case: "У услуги нет связанного кейса",
  published_service_no_media: "У услуги нет галереи или медиа",
  mobile_low_conversion: "Мобильный трафик слабо конвертируется",
  gallery_engagement_no_conversion: "Галерею смотрят, но не обращаются",
  published_missing_sitemap: "Страница не подтверждена в sitemap",
  published_noindexed: "Страница закрыта от индексации",
  contacts_transition_no_leads: "Переходы в контакты не подтверждены лидами",
  weak_proof_path: "Слабый proof path",
  unmapped_analytics_url: "URL аналитики не сопоставлен"
});

const DEFAULT_ACTIONS = Object.freeze({
  low_ctr: "Проверить title, description и H1.",
  traffic_no_intent: "Проверить CTA и доказательства на первом экране.",
  published_service_no_case: "Связать услугу с релевантным кейсом или запросить кейс у владельца.",
  published_service_no_media: "Добавить галерею или фото выполненных работ.",
  mobile_low_conversion: "Проверить мобильные кнопки звонка и мессенджеров.",
  gallery_engagement_no_conversion: "Добавить CTA рядом с галереей и подписи к фото.",
  published_missing_sitemap: "Проверить sitemap projection после публикации.",
  published_noindexed: "Проверить indexation flag и причину noindex.",
  contacts_transition_no_leads: "Проверить контактный блок и форму, лиды отдельно недоступны.",
  weak_proof_path: "Усилить связку кейс + галерея + FAQ + CTA.",
  unmapped_analytics_url: "Разобрать старые адреса, query string, canonical или redirect."
});

function pct(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${(value * 100).toFixed(value < 0.01 ? 2 : 1)}%`;
}

function buildRecommendationId(pagePath, issueType) {
  return `rec_${issueType}_${pagePath.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "root"}`;
}

function priorityFor(issueType) {
  if (["traffic_no_intent", "low_ctr", "published_noindexed", "unmapped_analytics_url"].includes(issueType)) {
    return "high";
  }

  if (["weak_proof_path", "published_service_no_case", "mobile_low_conversion"].includes(issueType)) {
    return "medium";
  }

  return "low";
}

function confidenceFor({ sampleSize = 0, issueType, sourceFreshnessStatus = "ok" }) {
  if (sourceFreshnessStatus !== "ok") {
    return "low";
  }

  if (issueType === "published_service_no_case" || issueType === "published_service_no_media" || issueType === "weak_proof_path") {
    return "medium";
  }

  if (sampleSize >= 100) {
    return "high";
  }

  if (sampleSize >= 30) {
    return "medium";
  }

  return "low";
}

function makeIssue({ issueType, page, evidenceItems = [], evidenceText = "", sampleSize = 0, limitations = [], sourceFreshnessStatus = "ok" }) {
  return {
    recommendation_id: buildRecommendationId(page.page_path, issueType),
    issue_type: issueType,
    label: ISSUE_LABELS[issueType] || issueType,
    linked_page: {
      page_path: page.page_path,
      entity_type: page.entity_type || null,
      entity_id: page.entity_id || null,
      title: page.page_title || page.title || page.page_path
    },
    priority: priorityFor(issueType),
    severity: priorityFor(issueType),
    evidence_period: page.period || null,
    evidence_items: evidenceItems,
    evidence: evidenceText,
    hypothesis: "Это сигнал к проверке, а не доказанная причинность.",
    recommended_action: DEFAULT_ACTIONS[issueType] || "Проверить страницу.",
    owner_role: "seo_manager",
    status: "new",
    next_check_date: null,
    confidence: confidenceFor({ sampleSize, issueType, sourceFreshnessStatus }),
    limitations
  };
}

export function detectIssuesForPage(page, context = {}) {
  const issues = [];
  const metrics = page.metrics || page;
  const proof = page.proof_path_summary || {};
  const seo = page.seo_health || {};
  const sourceFreshnessStatus = context.sourceFreshnessStatus || "ok";
  const impressions = Number(metrics.impressions || 0);
  const clicks = Number(metrics.clicks || 0);
  const visits = Number(metrics.visits || 0);
  const contactActions = Number(metrics.contact_actions || 0);
  const ctr = impressions > 0 ? clicks / impressions : Number(metrics.ctr || 0);
  const mobileShare = Number(metrics.mobile_share || 0);
  const galleryOpens = Number(metrics.gallery_opens || 0);
  const isService = page.entity_type === "service";

  if (impressions >= 100 && ctr > 0 && ctr < 0.02) {
    issues.push(makeIssue({
      issueType: "low_ctr",
      page,
      sampleSize: impressions,
      evidenceText: `${impressions} показов, ${clicks} кликов, CTR ${pct(ctr)}.`,
      limitations: sourceFreshnessStatus === "ok" ? [] : ["Источник поисковой видимости не свежий."],
      sourceFreshnessStatus
    }));
  }

  if (visits >= 50 && contactActions <= Math.max(1, Math.floor(visits * 0.005))) {
    issues.push(makeIssue({
      issueType: "traffic_no_intent",
      page,
      sampleSize: visits,
      evidenceText: `${visits} визитов и ${contactActions} контактных действий.`,
      limitations: ["Это не доказывает проблему CTA, но достаточно для гипотезы проверки."]
    }));
  }

  if (isService && proof.has_case === false) {
    issues.push(makeIssue({
      issueType: "published_service_no_case",
      page,
      evidenceText: "У опубликованной услуги нет связанного кейса.",
      limitations: ["Это content gap, а не поведенческая метрика."]
    }));
  }

  if (isService && proof.has_gallery === false) {
    issues.push(makeIssue({
      issueType: "published_service_no_media",
      page,
      evidenceText: "У опубликованной услуги нет галереи или основного медиа.",
      limitations: ["Это proof-path диагностика, не вывод о конверсии."]
    }));
  }

  if (visits >= 50 && mobileShare >= 0.7 && contactActions <= Math.max(1, Math.floor(visits * 0.006))) {
    issues.push(makeIssue({
      issueType: "mobile_low_conversion",
      page,
      sampleSize: visits,
      evidenceText: `Мобильная доля ${pct(mobileShare)}, контактных действий ${contactActions}.`,
      limitations: ["Нужна проверка мобильного UI и трекинга кнопок."]
    }));
  }

  if (galleryOpens >= 20 && contactActions <= 1) {
    issues.push(makeIssue({
      issueType: "gallery_engagement_no_conversion",
      page,
      sampleSize: galleryOpens,
      evidenceText: `Галерею открыли ${galleryOpens} раз, контактных действий ${contactActions}.`,
      limitations: ["Сигнал поведения, а не доказательство причины."]
    }));
  }

  if (seo.sitemap_state === "missing") {
    issues.push(makeIssue({
      issueType: "published_missing_sitemap",
      page,
      evidenceText: "Страница опубликована, но sitemap_state = missing.",
      limitations: ["Требуется проверка projection, а не ручная публикация из дашборда."]
    }));
  }

  if (seo.indexation_state === "noindex") {
    issues.push(makeIssue({
      issueType: "published_noindexed",
      page,
      evidenceText: "Страница закрыта от индексации.",
      limitations: ["Нужно сверить intent страницы и техническое состояние."]
    }));
  }

  const proofSignals = [
    proof.has_case,
    proof.has_gallery,
    proof.has_faq,
    proof.has_cta,
    proof.has_reviews
  ];
  const missingProofSignals = proofSignals.filter((value) => value === false).length;

  if (isService && missingProofSignals >= 2) {
    issues.push(makeIssue({
      issueType: "weak_proof_path",
      page,
      evidenceText: "На странице отсутствуют несколько элементов proof path.",
      limitations: ["Это рекомендация по усилению доказательств, не обещание роста."]
    }));
  }

  return issues.filter((issue) => ISSUE_TYPES.includes(issue.issue_type));
}

export function issueToPageSignals(issues = []) {
  const primary = issues[0] || null;

  return {
    primary_issue: primary?.label || "Критичных сигналов нет",
    recommended_next_action: primary?.recommended_action || "Продолжать мониторинг.",
    recommendation_status: primary?.status || "not_needed",
    priority: primary?.priority || "low",
    confidence: primary?.confidence || "low",
    warnings: issues.flatMap((issue) => issue.limitations || [])
  };
}
