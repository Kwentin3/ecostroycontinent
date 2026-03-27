const DEFAULT_PATTERN_SOURCES = [
  String.raw`\bproof\b`,
  String.raw`\bfixture\b`,
  String.raw`seo[-\s]?surface`,
  String.raw`\bscratch\b`,
  String.raw`\bprobe\b`
];

function walkStrings(value, visit) {
  if (typeof value === "string") {
    visit(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      walkStrings(item, visit);
    }

    return;
  }

  if (value && typeof value === "object") {
    for (const entry of Object.values(value)) {
      walkStrings(entry, visit);
    }
  }
}

function collectPayloadStrings(payload) {
  const strings = [];
  walkStrings(payload, (value) => {
    if (value.trim()) {
      strings.push(value.trim());
    }
  });
  return strings;
}

export function createCleanupMatchers(extraPatterns = []) {
  return [...DEFAULT_PATTERN_SOURCES, ...extraPatterns]
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .map((pattern) => new RegExp(pattern, "i"));
}

export function findEntityCleanupSignals(aggregate, matchers) {
  const signals = [];
  const seen = new Set();

  function note(source, value) {
    const key = `${source}:${value}`;

    if (!seen.has(key)) {
      seen.add(key);
      signals.push({ source, value });
    }
  }

  note("entity_id", aggregate.entity.id);

  for (const revision of aggregate.revisions) {
    if (revision.changeIntent) {
      note("change_intent", revision.changeIntent);
    }

    if (revision.reviewComment) {
      note("review_comment", revision.reviewComment);
    }

    for (const value of collectPayloadStrings(revision.payload)) {
      note("payload", value);
    }
  }

  return signals.filter((signal) => matchers.some((matcher) => matcher.test(signal.value)));
}

export function matchesCleanupCandidate(aggregate, matchers, explicitEntityIds = new Set()) {
  if (explicitEntityIds.has(aggregate.entity.id)) {
    return true;
  }

  return findEntityCleanupSignals(aggregate, matchers).length > 0;
}

export function collectMediaStorageKeys(aggregate) {
  if (aggregate.entity.entityType !== "media_asset") {
    return [];
  }

  const keys = new Set();

  for (const revision of aggregate.revisions) {
    const storageKey = revision.payload?.storageKey?.trim?.() ?? "";

    if (storageKey) {
      keys.add(storageKey);
    }
  }

  return [...keys];
}

function collectExactStringValues(value, sink) {
  walkStrings(value, (entry) => sink.add(entry.trim()));
}

export function findExternalReferences(aggregates, candidateIds) {
  const references = [];
  const candidateIdSet = new Set(candidateIds);

  for (const aggregate of aggregates) {
    const stringValues = new Set();

    for (const revision of aggregate.revisions) {
      collectExactStringValues(revision.payload, stringValues);
    }

    for (const candidateId of candidateIdSet) {
      if (stringValues.has(candidateId)) {
        references.push({
          sourceEntityId: aggregate.entity.id,
          sourceEntityType: aggregate.entity.entityType,
          referencedEntityId: candidateId
        });
      }
    }
  }

  return references;
}

export function formatCandidateLabel(aggregate) {
  const latestRevision = aggregate.revisions[0] ?? null;
  const payload = latestRevision?.payload ?? {};

  return payload.title || payload.h1 || payload.slug || payload.originalFilename || aggregate.entity.id;
}
