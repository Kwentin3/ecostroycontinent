import { getTopLevelFieldsForEntityType } from "./schemas.js";

const FIELD_LABELS = {
  publicBrandName: "Public brand name",
  legalName: "Legal name",
  primaryPhone: "Primary phone",
  activeMessengers: "Active messengers",
  publicEmail: "Public email",
  serviceArea: "Service area",
  primaryRegion: "Primary region",
  defaultCtaLabel: "Default CTA label",
  defaultCtaDescription: "Default CTA description",
  contactTruthConfirmed: "Contact truth confirmed",
  title: "Title",
  alt: "Alt",
  caption: "Caption",
  ownershipNote: "Ownership note",
  sourceNote: "Source note",
  storageKey: "Storage key",
  mimeType: "MIME type",
  originalFilename: "Original filename",
  status: "Status",
  primaryAssetId: "Primary asset",
  assetIds: "Asset refs",
  relatedEntityIds: "Related entities",
  slug: "Slug",
  h1: "H1",
  summary: "Summary",
  serviceScope: "Service scope",
  problemsSolved: "Problems solved",
  methods: "Methods",
  ctaVariant: "CTA variant",
  relatedCaseIds: "Related cases",
  galleryIds: "Galleries",
  primaryMediaAssetId: "Primary media",
  location: "Location",
  projectType: "Project type",
  task: "Task",
  workScope: "Work scope",
  result: "Result",
  serviceIds: "Related services",
  pageType: "Page type",
  intro: "Intro",
  blocks: "Page blocks"
};

function summarizeBlock(block) {
  if (!block) {
    return "—";
  }

  const pieces = [block.type];

  if (block.title) {
    pieces.push(block.title);
  }

  if (block.body && block.type !== "rich_text") {
    pieces.push(block.body);
  }

  if (block.ctaLabel) {
    pieces.push(`CTA: ${block.ctaLabel}`);
  }

  return pieces.join(" | ");
}

function summarizeValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }

    if (field === "blocks") {
      return value.map(summarizeBlock).join(" • ");
    }

    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function buildHumanReadableDiff(entityType, previousPayload, nextPayload) {
  return getTopLevelFieldsForEntityType(entityType)
    .filter((field) => JSON.stringify(previousPayload?.[field] ?? null) !== JSON.stringify(nextPayload?.[field] ?? null))
    .map((field) => ({
      field,
      label: FIELD_LABELS[field] || field,
      before: summarizeValue(field, previousPayload?.[field] ?? null),
      after: summarizeValue(field, nextPayload?.[field] ?? null)
    }));
}
