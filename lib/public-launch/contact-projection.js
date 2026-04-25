const DEFAULT_CONTACT_ROUTE = "/contacts#contact-request";
const CONTACT_ROUTE_ON_CONTACTS_PAGE = "#contact-request";
const DEFAULT_CTA_LABEL = "Открыть контакты";
const DEFAULT_CTA_DESCRIPTION = "Контактные данные появятся после подтверждения владельца.";

const MESSENGER_LABELS = Object.freeze({
  telegram: "Telegram",
  whatsapp: "WhatsApp"
});

function asText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeMessengers(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const list = [];

  for (const raw of value) {
    const key = asText(raw).toLowerCase();

    if (!key || !MESSENGER_LABELS[key] || seen.has(key)) {
      continue;
    }

    seen.add(key);
    list.push({
      key,
      label: MESSENGER_LABELS[key]
    });
  }

  return list;
}

function toPhoneHref(phone) {
  const normalized = asText(phone).replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

function toEmailHref(email) {
  const normalized = asText(email);
  return normalized ? `mailto:${normalized}` : "";
}

function resolveReadiness({ truthConfirmed, phone, serviceArea, email }) {
  if (truthConfirmed && phone && serviceArea) {
    return {
      code: "ready",
      message: "Контактные данные подтверждены."
    };
  }

  if (truthConfirmed) {
    return {
      code: "partial",
      message: "Контактные данные подтверждены частично. Закройте недостающие поля перед запуском."
    };
  }

  if (phone || email || serviceArea) {
    return {
      code: "pending_confirmation",
      message: "Контактные данные еще не подтверждены."
    };
  }

  return {
    code: "missing",
    message: "Контактные данные отсутствуют."
  };
}

function resolveFallbackRoute(currentPath) {
  return currentPath === "/contacts" ? CONTACT_ROUTE_ON_CONTACTS_PAGE : DEFAULT_CONTACT_ROUTE;
}

function resolvePrimaryAction({ truthConfirmed, phoneHref, emailHref, currentPath, fallbackLabel }) {
  if (truthConfirmed && phoneHref) {
    return {
      kind: "call",
      href: phoneHref,
      label: "Позвонить"
    };
  }

  if (truthConfirmed && emailHref) {
    return {
      kind: "email",
      href: emailHref,
      label: "Написать на почту"
    };
  }

  return {
    kind: "route",
    href: resolveFallbackRoute(currentPath),
    label: fallbackLabel || DEFAULT_CTA_LABEL
  };
}

function resolveSecondaryActions({ truthConfirmed, emailHref, primaryAction, currentPath, messengers }) {
  const actions = [];

  if (truthConfirmed && emailHref && primaryAction.kind !== "email") {
    actions.push({
      key: "secondary-email",
      kind: "email",
      href: emailHref,
      label: "Почта"
    });
  }

  if (messengers.length > 0) {
    const href = currentPath === "/contacts" ? "#contact-messengers" : "/contacts#contact-messengers";
    actions.push({
      key: "secondary-messengers",
      kind: "route",
      href,
      label: truthConfirmed ? "Мессенджеры" : "Каналы в мессенджерах"
    });
  }

  return actions;
}

function buildContactConsistencyToken({ bindingMode, readinessCode, displayRegion }) {
  const normalizedRegion = asText(displayRegion).toLowerCase() || "region_pending_confirmation";
  return `${bindingMode}|${readinessCode}|${encodeURIComponent(normalizedRegion)}`;
}

export function buildPublicContactProjection(globalSettings, { currentPath = "/" } = {}) {
  const phone = asText(globalSettings?.primaryPhone);
  const email = asText(globalSettings?.publicEmail);
  const serviceArea = asText(globalSettings?.serviceArea);
  const primaryRegion = asText(globalSettings?.primaryRegion);
  const truthConfirmed = globalSettings?.contactTruthConfirmed === true;
  const messengers = normalizeMessengers(globalSettings?.activeMessengers);
  const defaultCtaLabel = asText(globalSettings?.defaultCtaLabel) || DEFAULT_CTA_LABEL;
  const defaultCtaDescription = asText(globalSettings?.defaultCtaDescription) || DEFAULT_CTA_DESCRIPTION;
  const phoneHref = toPhoneHref(phone);
  const emailHref = toEmailHref(email);
  const readiness = resolveReadiness({ truthConfirmed, phone, serviceArea, email });
  const primaryAction = resolvePrimaryAction({
    truthConfirmed,
    phoneHref,
    emailHref,
    currentPath,
    fallbackLabel: defaultCtaLabel
  });
  const secondaryActions = resolveSecondaryActions({
    truthConfirmed,
    emailHref,
    primaryAction,
    currentPath,
    messengers
  });
  const publicRegion = serviceArea || primaryRegion;
  const displayRegion = publicRegion || "Зона обслуживания ожидает подтверждения.";
  const bindingMode = truthConfirmed ? "confirmed_truth" : "fallback_projection";
  const consistencyToken = buildContactConsistencyToken({
    bindingMode,
    readinessCode: readiness.code,
    displayRegion
  });

  return {
    truthConfirmed,
    bindingMode,
    consistencyToken,
    readiness,
    phone: truthConfirmed ? phone : "",
    email: truthConfirmed ? email : "",
    serviceArea,
    primaryRegion,
    publicRegion,
    hasPublicRegion: Boolean(publicRegion),
    displayPhone: truthConfirmed && phone ? phone : "Контактные данные еще не подтверждены.",
    displayEmail: truthConfirmed && email ? email : "Публичная почта еще не подтверждена.",
    displayRegion,
    defaultCtaLabel,
    defaultCtaDescription,
    messengers,
    primaryAction,
    secondaryActions
  };
}
