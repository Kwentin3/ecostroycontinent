import { query, withTransaction } from "../db/client.js";
import { createId } from "../utils/id.js";
import {
  DEFAULT_PUBLIC_DISPLAY_MODE,
  normalizePublicDisplayMode,
  parsePublicDisplayMode
} from "./display-mode.js";

const DISPLAY_MODE_AUDIT_EVENT_KEY = "public_display_mode_changed";

function queryWithDb(db, text, params = []) {
  if (db) {
    return db.query(text, params);
  }

  return query(text, params);
}

function mapModeStateRow(row) {
  if (!row) {
    return null;
  }

  return {
    mode: normalizePublicDisplayMode(row.mode),
    reason: row.reason || "",
    changedBy: row.changed_by,
    changedAt: row.changed_at
  };
}

function mapAuditRow(row) {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    previousMode: row.previous_mode,
    nextMode: row.next_mode,
    reason: row.reason || "",
    changedAt: row.changed_at
  };
}

function buildFallbackModeState(reason = "default bootstrap mode") {
  return {
    mode: DEFAULT_PUBLIC_DISPLAY_MODE,
    reason,
    changedBy: null,
    changedAt: null
  };
}

function isStorageMissingError(error) {
  if (!error) {
    return false;
  }

  if (error.code === "42P01") {
    return true;
  }

  const message = typeof error.message === "string" ? error.message : "";
  return /site_display_mode_(state|audit)/i.test(message) && /does not exist/i.test(message);
}

function normalizeReason(rawReason = "") {
  return typeof rawReason === "string" ? rawReason.trim() : "";
}

function mapAuditFallbackStateRow(row) {
  if (!row) {
    return buildFallbackModeState();
  }

  const details = row.details && typeof row.details === "object" ? row.details : {};
  return {
    mode: normalizePublicDisplayMode(details.nextMode || details.mode || DEFAULT_PUBLIC_DISPLAY_MODE),
    reason: normalizeReason(details.reason) || normalizeReason(row.summary),
    changedBy: row.actor_user_id,
    changedAt: row.created_at
  };
}

function mapAuditFallbackTrailRow(row) {
  const details = row.details && typeof row.details === "object" ? row.details : {};

  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    previousMode: normalizePublicDisplayMode(details.previousMode || DEFAULT_PUBLIC_DISPLAY_MODE),
    nextMode: normalizePublicDisplayMode(details.nextMode || details.mode || DEFAULT_PUBLIC_DISPLAY_MODE),
    reason: normalizeReason(details.reason) || normalizeReason(row.summary),
    changedAt: row.created_at
  };
}

async function getAuditFallbackState(db = null) {
  const result = await queryWithDb(
    db,
    `SELECT actor_user_id, summary, details, created_at
     FROM audit_events
     WHERE event_key = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [DISPLAY_MODE_AUDIT_EVENT_KEY]
  );

  return mapAuditFallbackStateRow(result.rows[0]);
}

async function listAuditFallbackTrail({ limit = 20 } = {}, db = null) {
  const cappedLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20;
  const result = await queryWithDb(
    db,
    `SELECT id, actor_user_id, summary, details, created_at
     FROM audit_events
     WHERE event_key = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [DISPLAY_MODE_AUDIT_EVENT_KEY, cappedLimit]
  );

  return result.rows.map(mapAuditFallbackTrailRow);
}

async function setDisplayModeStateViaAuditFallback({
  mode,
  actorUserId,
  reason = ""
} = {}) {
  return withTransaction(async (db) => {
    const currentState = await getAuditFallbackState(db);
    const trimmedReason = normalizeReason(reason);

    if (currentState.mode === mode) {
      return {
        changed: false,
        previous: currentState,
        current: currentState,
        backend: "audit_events_fallback"
      };
    }

    const insertResult = await queryWithDb(
      db,
      `INSERT INTO audit_events (id, entity_id, revision_id, actor_user_id, event_key, summary, details)
       VALUES ($1, NULL, NULL, $2, $3, $4, $5::jsonb)
       RETURNING created_at`,
      [
        createId("audit"),
        actorUserId ?? null,
        DISPLAY_MODE_AUDIT_EVENT_KEY,
        `Display mode switched to ${mode}`,
        JSON.stringify({
          source: "audit_events_fallback",
          previousMode: currentState.mode,
          nextMode: mode,
          reason: trimmedReason
        })
      ]
    );

    const current = {
      mode,
      reason: trimmedReason,
      changedBy: actorUserId ?? null,
      changedAt: insertResult.rows[0]?.created_at || new Date().toISOString()
    };

    return {
      changed: true,
      previous: currentState,
      current,
      backend: "audit_events_fallback"
    };
  });
}

export async function ensureDisplayModeState(db = null) {
  await queryWithDb(
    db,
    `INSERT INTO site_display_mode_state (id, mode, reason)
     VALUES (TRUE, $1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [DEFAULT_PUBLIC_DISPLAY_MODE, "default bootstrap mode"]
  );
}

export async function getDisplayModeState(db = null) {
  try {
    await ensureDisplayModeState(db);

    const result = await queryWithDb(
      db,
      `SELECT mode, reason, changed_by, changed_at
       FROM site_display_mode_state
       WHERE id = TRUE
       LIMIT 1`
    );

    return mapModeStateRow(result.rows[0]) || buildFallbackModeState();
  } catch (error) {
    if (!isStorageMissingError(error)) {
      throw error;
    }

    return getAuditFallbackState(db);
  }
}

export async function listDisplayModeAuditTrail({ limit = 20 } = {}, db = null) {
  try {
    const cappedLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20;
    const result = await queryWithDb(
      db,
      `SELECT id, actor_user_id, previous_mode, next_mode, reason, changed_at
       FROM site_display_mode_audit
       ORDER BY changed_at DESC
       LIMIT $1`,
      [cappedLimit]
    );

    return result.rows.map(mapAuditRow);
  } catch (error) {
    if (!isStorageMissingError(error)) {
      throw error;
    }

    return listAuditFallbackTrail({ limit }, db);
  }
}

export async function setDisplayModeState({
  mode,
  actorUserId,
  reason = ""
} = {}) {
  const parsedMode = parsePublicDisplayMode(mode);

  if (!parsedMode) {
    throw new Error(`Unsupported display mode: ${String(mode)}`);
  }

  try {
    return await withTransaction(async (db) => {
      await ensureDisplayModeState(db);

      const currentResult = await queryWithDb(
        db,
        `SELECT mode, reason, changed_by, changed_at
         FROM site_display_mode_state
         WHERE id = TRUE
         FOR UPDATE`
      );
      const currentState = mapModeStateRow(currentResult.rows[0]) || buildFallbackModeState();
      const trimmedReason = normalizeReason(reason);

      if (currentState.mode === parsedMode) {
        return {
          changed: false,
          previous: currentState,
          current: currentState,
          backend: "display_mode_tables"
        };
      }

      const updatedResult = await queryWithDb(
        db,
        `UPDATE site_display_mode_state
         SET mode = $1,
             reason = $2,
             changed_by = $3,
             changed_at = NOW()
         WHERE id = TRUE
         RETURNING mode, reason, changed_by, changed_at`,
        [parsedMode, trimmedReason, actorUserId ?? null]
      );
      const nextState = mapModeStateRow(updatedResult.rows[0]);

      await queryWithDb(
        db,
        `INSERT INTO site_display_mode_audit (
           id,
           actor_user_id,
           previous_mode,
           next_mode,
           reason
         ) VALUES ($1, $2, $3, $4, $5)`,
        [createId("display_mode_audit"), actorUserId ?? null, currentState.mode, parsedMode, trimmedReason]
      );

      return {
        changed: true,
        previous: currentState,
        current: nextState,
        backend: "display_mode_tables"
      };
    });
  } catch (error) {
    if (!isStorageMissingError(error)) {
      throw error;
    }

    return setDisplayModeStateViaAuditFallback({
      mode: parsedMode,
      actorUserId,
      reason
    });
  }
}
