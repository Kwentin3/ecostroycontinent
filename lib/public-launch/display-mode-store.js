import { query, withTransaction } from "../db/client.js";
import { createId } from "../utils/id.js";
import {
  DEFAULT_PUBLIC_DISPLAY_MODE,
  normalizePublicDisplayMode,
  parsePublicDisplayMode
} from "./display-mode.js";

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

function buildFallbackModeState(reason = "display mode storage unavailable") {
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

function toStorageUnavailableError(error) {
  if (!isStorageMissingError(error)) {
    return error;
  }

  return new Error("Display mode storage is not initialized. Run DB migrations before switching display mode.");
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

    return mapModeStateRow(result.rows[0]) || buildFallbackModeState("default bootstrap mode");
  } catch (error) {
    if (isStorageMissingError(error)) {
      return buildFallbackModeState();
    }

    throw error;
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
    if (isStorageMissingError(error)) {
      return [];
    }

    throw error;
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
      const currentState = mapModeStateRow(currentResult.rows[0]) || buildFallbackModeState("default bootstrap mode");

      if (currentState.mode === parsedMode) {
        return {
          changed: false,
          previous: currentState,
          current: currentState
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
        [parsedMode, reason.trim(), actorUserId ?? null]
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
        [createId("display_mode_audit"), actorUserId ?? null, currentState.mode, parsedMode, reason.trim()]
      );

      return {
        changed: true,
        previous: currentState,
        current: nextState
      };
    });
  } catch (error) {
    throw toStorageUnavailableError(error);
  }
}
