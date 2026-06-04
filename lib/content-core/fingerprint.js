import { createHash } from "node:crypto";

function normalizeForFingerprint(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForFingerprint(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeForFingerprint(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function stringifyContentPayload(payload) {
  return JSON.stringify(normalizeForFingerprint(payload ?? null));
}

export function computeContentFingerprint(payload) {
  const serialized = stringifyContentPayload(payload);
  const digest = createHash("sha256").update(serialized).digest("hex");

  return `sha256:${digest}`;
}
