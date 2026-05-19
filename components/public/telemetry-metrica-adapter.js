"use client";

import {
  METRICA_GOALS,
  normalizeMetricaPublicConfig,
  resolveMetricaGoalForTelemetryEvent
} from "../../lib/telemetry/metrica-goals.js";

const DEFAULT_DEDUPE_TTL_MS = 10_000;
const APPROVED_GOAL_SET = new Set(METRICA_GOALS);

function nowMs() {
  return Date.now();
}

export function createClientEventId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function createMetricaDedupeStore({ ttlMs = DEFAULT_DEDUPE_TTL_MS, now = nowMs } = {}) {
  const seen = new Map();

  return {
    has(key) {
      const expiresAt = seen.get(key);

      if (!expiresAt) {
        return false;
      }

      if (expiresAt <= now()) {
        seen.delete(key);
        return false;
      }

      return true;
    },
    add(key) {
      seen.set(key, now() + ttlMs);
    },
    clear() {
      seen.clear();
    }
  };
}

const defaultDedupeStore = createMetricaDedupeStore();

function resolveYm(ym) {
  if (typeof ym === "function") {
    return ym;
  }

  return typeof window !== "undefined" && typeof window.ym === "function"
    ? window.ym
    : null;
}

export function mirrorTelemetryEventToMetrica({
  payload,
  clientEventId,
  config,
  telemetryAccepted = false,
  fallbackAllowed = false,
  dedupeStore = defaultDedupeStore,
  ym
} = {}) {
  const normalizedConfig = normalizeMetricaPublicConfig(config);
  const goalName = resolveMetricaGoalForTelemetryEvent(payload);

  if (!normalizedConfig.enabled || !goalName || !APPROVED_GOAL_SET.has(goalName)) {
    return { mirrored: false, reason: "not_eligible", goalName: goalName || "" };
  }

  if (!telemetryAccepted && !fallbackAllowed) {
    return { mirrored: false, reason: "telemetry_not_accepted", goalName };
  }

  const resolvedYm = resolveYm(ym);

  if (!resolvedYm) {
    return { mirrored: false, reason: "ym_unavailable", goalName };
  }

  const dedupeKey = `${clientEventId || ""}:${goalName}`;

  if (!clientEventId || dedupeStore.has(dedupeKey)) {
    return { mirrored: false, reason: "duplicate_or_missing_client_event_id", goalName };
  }

  dedupeStore.add(dedupeKey);

  try {
    resolvedYm(Number(normalizedConfig.counterId), "reachGoal", goalName);
    return { mirrored: true, reason: "sent", goalName };
  } catch {
    return { mirrored: false, reason: "send_failed", goalName };
  }
}
