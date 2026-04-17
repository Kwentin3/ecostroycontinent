const DEFAULT_CONTACT_ROUTE = "/contacts#contact-request";
const CONTACT_ROUTE_ON_CONTACTS_PAGE = "#contact-request";
const DEFAULT_CTA_LABEL = "Open contacts";
const DEFAULT_CTA_DESCRIPTION = "Contact details will appear after owner confirmation.";

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
      message: "Contact truth is confirmed."
    };
  }

  if (truthConfirmed) {
    return {
      code: "partial",
      message: "Contact truth is confirmed partially. Complete missing required fields before launch."
    };
  }

  if (phone || email || serviceArea) {
    return {
      code: "pending_confirmation",
      message: "Contact truth is not confirmed yet."
    };
  }

  return {
    code: "missing",
    message: "Contact truth is missing."
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
      label: "Call now"
    };
  }

  if (truthConfirmed && emailHref) {
    return {
      kind: "email",
      href: emailHref,
      label: "Send email"
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
      label: "Email"
    });
  }

  if (messengers.length > 0) {
    const href = currentPath === "/contacts" ? "#contact-messengers" : "/contacts#contact-messengers";
    actions.push({
      key: "secondary-messengers",
      kind: "route",
      href,
      label: truthConfirmed ? "Messengers" : "Messenger channels"
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
  const displayRegion = serviceArea || primaryRegion || "Service area is pending confirmation.";
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
    displayPhone: truthConfirmed && phone ? phone : "Contact details are pending confirmation.",
    displayEmail: truthConfirmed && email ? email : "Public email is pending confirmation.",
    displayRegion,
    defaultCtaLabel,
    defaultCtaDescription,
    messengers,
    primaryAction,
    secondaryActions
  };
}
