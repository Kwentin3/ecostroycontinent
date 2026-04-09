export const ENTITY_CREATION_ORIGINS = Object.freeze({
  AGENT_TEST: "agent_test"
});

export function normalizeEntityCreationOrigin(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === ENTITY_CREATION_ORIGINS.AGENT_TEST) {
    return normalized;
  }

  throw new Error("Неподдерживаемый origin для создания сущности.");
}

export function isAgentTestCreationOrigin(value) {
  return String(value ?? "").trim().toLowerCase() === ENTITY_CREATION_ORIGINS.AGENT_TEST;
}
