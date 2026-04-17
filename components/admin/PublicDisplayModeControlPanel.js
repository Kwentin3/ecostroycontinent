import { getRoleLabel } from "../../lib/auth/session.js";
import {
  PUBLIC_DISPLAY_MODE_VALUES,
  getPublicDisplayModeMeta
} from "../../lib/public-launch/display-mode.js";
import styles from "./admin-ui.module.css";

function formatTimestamp(value) {
  if (!value) {
    return "n/a";
  }

  const parsed = new Date(value);

  if (!Number.isFinite(parsed.getTime())) {
    return "n/a";
  }

  return parsed.toISOString();
}

function renderCurrentState(state = null, actor = null) {
  const safeState = state || { mode: null, reason: "", changedAt: null };
  const meta = getPublicDisplayModeMeta(safeState.mode);
  const changedBy = actor?.displayName || actor?.username || "unknown";

  return (
    <section className={styles.statusPanelInfo}>
      <p className={styles.eyebrow}>Current runtime mode</p>
      <p><strong>{meta.label}</strong></p>
      <p className={styles.mutedText}>{meta.description}</p>
      <p className={styles.mutedText}>Changed at: {formatTimestamp(safeState.changedAt)}</p>
      <p className={styles.mutedText}>Changed by: {changedBy}</p>
      {safeState.reason ? <p className={styles.mutedText}>Reason: {safeState.reason}</p> : null}
    </section>
  );
}

function renderAuditTrail(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section className={styles.panelMuted}>
        <p className={styles.mutedText}>No display mode switches recorded yet.</p>
      </section>
    );
  }

  return (
    <ul className={styles.timeline}>
      {items.map((item) => {
        const previousMeta = getPublicDisplayModeMeta(item.previousMode);
        const nextMeta = getPublicDisplayModeMeta(item.nextMode);
        const actor = item.actorDisplayName || item.actorUsername || "unknown";

        return (
          <li key={item.id} className={styles.timelineItem}>
            <p>
              <strong>{previousMeta.label}</strong>
              {" -> "}
              <strong>{nextMeta.label}</strong>
            </p>
            <p className={styles.mutedText}>When: {formatTimestamp(item.changedAt)}</p>
            <p className={styles.mutedText}>Who: {actor}</p>
            {item.reason ? <p className={styles.mutedText}>Reason: {item.reason}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function PublicDisplayModeControlPanel({
  currentState = null,
  history = [],
  actorMap = {}
}) {
  return (
    <section className={styles.panel} aria-labelledby="public-display-mode-control">
      <p className={styles.eyebrow}>Operational control</p>
      <h3 id="public-display-mode-control">Public display mode</h3>
      <p className={styles.mutedText}>
        Runtime mode is operational state. It is not content truth and does not replace publish workflow.
      </p>

      {renderCurrentState(currentState, currentState?.changedBy ? actorMap[currentState.changedBy] : null)}

      <form method="post" action="/api/admin/system/display-mode" className={styles.formGrid}>
        <input type="hidden" name="redirectTo" value="/admin" />
        <label className={styles.label}>
          Target mode
          <select name="mode" defaultValue={currentState?.mode || ""} required>
            {PUBLIC_DISPLAY_MODE_VALUES.map((mode) => {
              const meta = getPublicDisplayModeMeta(mode);
              return (
                <option key={mode} value={mode}>
                  {meta.label}
                </option>
              );
            })}
          </select>
        </label>
        <label className={styles.label}>
          Reason
          <textarea
            name="reason"
            required
            minLength={4}
            maxLength={400}
            placeholder="Why this switch is needed right now"
          />
        </label>
        <label className={styles.label}>
          Safety confirmation for published mode
          <div>
            <label>
              <input type="checkbox" name="confirmPublishedOnly" value="yes" />
              {" "}I confirm switching to published-only launch-like runtime.
            </label>
          </div>
        </label>
        <button type="submit" className={styles.primaryButton}>Apply display mode</button>
      </form>

      <section>
        <p className={styles.eyebrow}>Mode switch audit trail</p>
        {renderAuditTrail(history.map((item) => ({
          ...item,
          actorDisplayName: item.actorUserId ? actorMap[item.actorUserId]?.displayName : "",
          actorUsername: item.actorUserId ? actorMap[item.actorUserId]?.username : ""
        })))}
        <p className={styles.mutedText}>
          Actor role labels come from canonical RBAC: {getRoleLabel("superadmin")}.
        </p>
      </section>
    </section>
  );
}
