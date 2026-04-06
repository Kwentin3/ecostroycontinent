function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeLines(content) {
  if (Array.isArray(content)) {
    return content.map((line) => asString(line)).filter(Boolean);
  }

  const text = asString(content);
  return text ? [text] : [];
}

function renderJsonBlock(label, value) {
  return [
    `# ${label}`,
    "```json",
    JSON.stringify(value ?? {}, null, 2),
    "```"
  ].join("\n");
}

function normalizeActionSlice(slice, index) {
  if (!slice || typeof slice !== "object") {
    return null;
  }

  const id = asString(slice.id) || `action_slice_${index + 1}`;
  const title = asString(slice.title);
  const content = normalizeLines(slice.content ?? slice.body ?? slice.instructions ?? []);

  return {
    id,
    title,
    content
  };
}

function renderActionSlice(slice) {
  const lines = [`# Action slice: ${slice.id}`];

  if (slice.title) {
    lines.push(`## ${slice.title}`);
  }

  if (slice.content.length > 0) {
    lines.push(...slice.content);
  }

  return lines.join("\n");
}

export function assemblePromptPacket({
  requestScope = {},
  memoryContext = {},
  canonicalContext = {},
  artifactContract = {},
  actionSlices = []
} = {}) {
  const normalizedActionSlices = actionSlices
    .map((slice, index) => normalizeActionSlice(slice, index))
    .filter(Boolean);

  const promptParts = [
    renderJsonBlock("Request scope", asObject(requestScope)),
    renderJsonBlock("Memory context", asObject(memoryContext)),
    renderJsonBlock("Canonical context", asObject(canonicalContext)),
    renderJsonBlock("Artifact contract", asObject(artifactContract))
  ];

  for (const slice of normalizedActionSlices) {
    promptParts.push(renderActionSlice(slice));
  }

  return {
    requestScope: asObject(requestScope),
    memoryContext: asObject(memoryContext),
    canonicalContext: asObject(canonicalContext),
    artifactContract: asObject(artifactContract),
    actionSlices: normalizedActionSlices,
    prompt: promptParts.join("\n\n")
  };
}
