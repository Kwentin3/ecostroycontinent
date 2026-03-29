import { buildEditorActionabilityModel } from "../../lib/admin/readiness-actionability.js";
import { getRevisionStateLabel } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

const TONE_CLASS_BY_STATE = {
  healthy: styles.cockpitToneHealthy,
  warning: styles.cockpitToneWarning,
  danger: styles.cockpitToneDanger,
  unknown: styles.cockpitToneUnknown
};

function renderProblemItem(item) {
  const severityLabel = item.severity === "blocking" ? "Блокирующий" : item.severity === "warning" ? "Предупреждение" : "Инфо";

  return (
    <li key={item.key} className={styles.cockpitActionItem}>
      <div className={styles.cockpitActionItemTop}>
        <span className={`${styles.badge} ${TONE_CLASS_BY_STATE[item.target.isFallback ? "warning" : item.severity === "blocking" ? "danger" : "warning"]}`}>{severityLabel}</span>
        {item.target.isFallback ? <span className={styles.cockpitFallbackPill}>Резерв</span> : null}
      </div>
      <a href={item.target.href} className={styles.readinessItemLink}>
        {item.message || item.fieldLabel}
      </a>
      <p className={styles.cockpitActionPrimaryBody}>{item.target.targetLabel}</p>
    </li>
  );
}

export function EntityActionabilityPanel({
  entityType,
  readiness,
  currentRevision,
  activePublishedRevision
}) {
  const model = buildEditorActionabilityModel({
    entityType,
    readiness,
    currentRevision,
    activePublishedRevision
  });
  const currentRevisionLabel = currentRevision ? getRevisionStateLabel(currentRevision.state) : "Новая карточка";
  const readinessToneClass = TONE_CLASS_BY_STATE[model.state.tone] || styles.cockpitToneUnknown;

  return (
    <section id={model.fallbackAnchorId} className={`${styles.panel} ${styles.editorActionabilityPanel}`}>
      <div className={styles.cockpitBlockHeader}>
        <div>
          <p className={styles.cockpitBlockKicker}>Сначала исправьте это</p>
          <h3 className={styles.cockpitBlockTitle}>Состояние, проблемы и следующий шаг</h3>
          <p className={styles.cockpitBlockNote}>
            {model.state.note}
          </p>
        </div>
        <span className={`${styles.cockpitStateValue} ${readinessToneClass}`}>{model.state.label}</span>
      </div>

      <div className={styles.cockpitStateGrid}>
        <article className={styles.cockpitStateCard}>
          <span className={styles.cockpitStateLabel}>Состояние записи</span>
          <span className={styles.cockpitStateValue}>{currentRevisionLabel}</span>
          <p className={styles.cockpitStateCopy}>
            {model.currentRevisionState === "draft" ? "Черновик ещё не прошёл проверку готовности." : model.state.note}
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${readinessToneClass}`}>{model.state.label}</span>
            {activePublishedRevision ? <span className={styles.badge}>{model.activePublishedRevisionLabel}</span> : null}
          </div>
        </article>

        <article className={styles.cockpitStateCard}>
          <span className={styles.cockpitStateLabel}>Проблемы</span>
          <span className={styles.cockpitStateValue}>{model.problemItems.length}</span>
          <p className={styles.cockpitStateCopy}>
            {model.problemItems.length > 0
              ? `Показываем первые ${model.visibleProblemItems.length} проблемные строки, которые можно исправить сразу.`
              : model.state.key === "missing"
                ? "Проблемы ещё не считаны."
                : "Проблемы не обнаружены."}
          </p>
          {model.visibleProblemItems.length > 0 ? (
            <ul className={styles.cockpitActionList}>
              {model.visibleProblemItems.map(renderProblemItem)}
            </ul>
          ) : null}
          {model.hiddenProblemCount > 0 ? (
            <p className={styles.cockpitStateNote}>Ещё {model.hiddenProblemCount} проблемных строк доступны в панели готовности справа.</p>
          ) : null}
        </article>

        <article className={styles.cockpitStateCard}>
          <span className={styles.cockpitStateLabel}>Следующий шаг</span>
          <a href={model.primaryAction.href} className={`${styles.primaryButton} ${styles.stretchButton}`}>
            {model.primaryAction.label}
          </a>
          <p className={styles.cockpitStateCopy}>{model.primaryAction.note}</p>
          <div className={styles.badgeRow}>
            {model.primaryAction.isFallback ? <span className={styles.cockpitFallbackPill}>Резерв</span> : null}
            <span className={styles.badge}>{model.primaryAction.targetLabel}</span>
          </div>
        </article>
      </div>
    </section>
  );
}
