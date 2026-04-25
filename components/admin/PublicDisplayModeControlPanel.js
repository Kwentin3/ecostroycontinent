import { getRoleLabel } from "../../lib/auth/session.js";
import {
  PUBLIC_DISPLAY_MODE_VALUES,
  getPublicDisplayModeMeta
} from "../../lib/public-launch/display-mode.js";
import styles from "./admin-ui.module.css";

function formatTimestamp(value) {
  if (!value) {
    return "н/д";
  }

  const parsed = new Date(value);

  if (!Number.isFinite(parsed.getTime())) {
    return "н/д";
  }

  return parsed.toISOString();
}

function renderCurrentState(state = null, actor = null) {
  const safeState = state || { mode: null, reason: "", changedAt: null };
  const meta = getPublicDisplayModeMeta(safeState.mode);
  const changedBy = actor?.displayName || actor?.username || "unknown";

  return (
    <section className={styles.statusPanelInfo}>
      <p className={styles.eyebrow}>Текущий режим</p>
      <p><strong>{meta.label}</strong></p>
      <p className={styles.mutedText}>{meta.description}</p>
      <p className={styles.mutedText}>Изменено: {formatTimestamp(safeState.changedAt)}</p>
      <p className={styles.mutedText}>Кем: {changedBy}</p>
      {safeState.reason ? <p className={styles.mutedText}>Причина: {safeState.reason}</p> : null}
    </section>
  );
}

function renderAuditTrail(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section className={styles.panelMuted}>
        <p className={styles.mutedText}>Переходов режима пока нет.</p>
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
            <p className={styles.mutedText}>Когда: {formatTimestamp(item.changedAt)}</p>
            <p className={styles.mutedText}>Кто: {actor}</p>
            {item.reason ? <p className={styles.mutedText}>Причина: {item.reason}</p> : null}
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
      <p className={styles.eyebrow}>Операционное управление</p>
      <h3 id="public-display-mode-control">Режим отображения публичного сайта</h3>
      <p className={styles.mutedText}>
        Режим исполнения - это операционное состояние. Он не заменяет истину контента и не подменяет публикацию.
      </p>

      {renderCurrentState(currentState, currentState?.changedBy ? actorMap[currentState.changedBy] : null)}

      <form method="post" action="/api/admin/system/display-mode" className={styles.formGrid}>
        <input type="hidden" name="redirectTo" value="/admin" />
        <label className={styles.label}>
          Целевой режим
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
          Причина
          <textarea
            name="reason"
            required
            minLength={4}
            maxLength={400}
            placeholder="Почему нужен этот переключатель сейчас"
          />
        </label>
        <label className={styles.label}>
          Подтверждение для режима только опубликованного
          <div>
            <label>
              <input type="checkbox" name="confirmPublishedOnly" value="yes" />
              {" "}Подтверждаю переключение на режим только опубликованного контента.
            </label>
          </div>
        </label>
        <button type="submit" className={styles.primaryButton}>Применить режим</button>
      </form>

      <section>
        <p className={styles.eyebrow}>Лента переключений режима</p>
        {renderAuditTrail(history.map((item) => ({
          ...item,
          actorDisplayName: item.actorUserId ? actorMap[item.actorUserId]?.displayName : "",
          actorUsername: item.actorUserId ? actorMap[item.actorUserId]?.username : ""
        })))}
        <p className={styles.mutedText}>
          Метки ролей берутся из канонической RBAC: {getRoleLabel("superadmin")}.
        </p>
      </section>
    </section>
  );
}
