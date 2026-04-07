import { getRevisionStateLabel, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { SurfacePacket } from "./SurfacePacket";
import styles from "./admin-ui.module.css";

const PREVIEW_MODE_LABELS = {
  desktop: "компьютер",
  tablet: "планшет",
  mobile: "телефон"
};

function formatPreviewMode(value) {
  return PREVIEW_MODE_LABELS[value] || value || "—";
}

function renderValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  return normalizeLegacyCopy(value || "—");
}

export function LandingWorkspaceMemoryPanel({ memoryCard }) {
  if (!memoryCard) {
    return null;
  }

  const sessionIdentity = memoryCard.sessionIdentity ?? {};
  const editorialIntent = memoryCard.editorialIntent ?? {};
  const proofSelection = memoryCard.proofSelection ?? {};
  const artifactState = memoryCard.artifactState ?? {};
  const editorialDecisions = memoryCard.editorialDecisions ?? {};
  const traceState = memoryCard.traceState ?? {};
  const archivePointer = memoryCard.archivePointer ?? {};
  const recentTurn = memoryCard.recentTurn ?? {};
  const candidatePointer = artifactState.candidatePointer ?? null;
  const derivedSlice = artifactState.derivedArtifactSlice ?? null;
  const summary = artifactState.verificationSummary || "Сессионное рабочее состояние для рабочей зоны лендинга.";

  return (
    <SurfacePacket
      eyebrow="Память сессии"
      title="Состояние рабочей зоны"
      summary={normalizeLegacyCopy(summary)}
      legend="Это только сессионное рабочее состояние. Оно не является исходной страницей, не является состоянием публикации и не может стать вторым источником истины."
      meta={[
        sessionIdentity.sessionId ? `Сессия: ${sessionIdentity.sessionId}` : "Сессия: недоступна",
        sessionIdentity.entityId ? `Страница: ${sessionIdentity.entityId}` : "Страница: не привязана",
        artifactState.reviewStatus ? `Проверка: ${getRevisionStateLabel(artifactState.reviewStatus)}` : "Проверка: ожидается",
        candidatePointer?.candidateId ? `Черновик: ${candidatePointer.candidateId}` : "Черновик: нет"
      ]}
    >
      <div className={styles.stack}>
        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Сессия</strong>
            <p className={styles.mutedText}>
              {sessionIdentity.actor?.displayName || sessionIdentity.actor?.username || "Неизвестный оператор"} ·
              {" "}{sessionIdentity.entityType === "page" ? "страница" : sessionIdentity.entityType || "страница"} · {sessionIdentity.entityId || "не привязана"}
            </p>
            <p className={styles.mutedText}>
              Маршрут зафиксирован: {sessionIdentity.routeLocked ? "да" : "нет"} · Страница зафиксирована: {sessionIdentity.entityLocked ? "да" : "нет"}
            </p>
            <p className={styles.mutedText}>
              Обновлено: {sessionIdentity.timestamps?.memoryCardUpdatedAt || "—"}
            </p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Намерение правки</strong>
            <p className={styles.mutedText}>Изменение: {renderValue(editorialIntent.changeIntent)}</p>
            <p className={styles.mutedText}>Цель: {renderValue(editorialIntent.editorialGoal)}</p>
            <p className={styles.mutedText}>Вариант: {renderValue(editorialIntent.variantDirection)}</p>
          </div>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Выбор доказательств</strong>
            <p className={styles.mutedText}>Кейсы: {renderValue(proofSelection.selectedCaseIds)}</p>
            <p className={styles.mutedText}>Коллекции: {renderValue(proofSelection.selectedGalleryIds)}</p>
            <p className={styles.mutedText}>Медиа: {renderValue(proofSelection.selectedMedia)}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Состояние черновика</strong>
            <p className={styles.mutedText}>
              Черновик: {candidatePointer?.candidateId || "—"}
            </p>
            <p className={styles.mutedText}>
              Спецификация: {artifactState.specVersion || "—"} · Проверка: {getRevisionStateLabel(artifactState.reviewStatus) || "—"}
            </p>
            <p className={styles.mutedText}>
              Предпросмотр: {formatPreviewMode(artifactState.previewMode)}
            </p>
          </div>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Трассировка</strong>
            <p className={styles.mutedText}>LLM-трассировка: {traceState.lastLlmTraceId || "—"}</p>
            <p className={styles.mutedText}>Запрос: {traceState.requestId || "—"}</p>
            <p className={styles.mutedText}>Сформировано: {traceState.generationTimestamp || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Принятые решения</strong>
            <p className={styles.mutedText}>Принято: {renderValue(editorialDecisions.acceptedDecisions)}</p>
            <p className={styles.mutedText}>Отклонено: {renderValue(editorialDecisions.rejectedDirections)}</p>
            <p className={styles.mutedText}>Блокирующие: {renderValue(editorialDecisions.activeBlockers)}</p>
            <p className={styles.mutedText}>Предупреждения: {renderValue(editorialDecisions.warnings)}</p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <strong>Последний шаг</strong>
          <p className={styles.mutedText}>Последнее изменение: {renderValue(recentTurn.lastChange)}</p>
          <p className={styles.mutedText}>Последний блокер: {renderValue(recentTurn.lastBlocker)}</p>
          <p className={styles.mutedText}>Результат: {renderValue(recentTurn.generationOutcome)}</p>
          <p className={styles.mutedText}>Указатель архива: {renderValue(archivePointer.pointer)}</p>
          {derivedSlice ? (
            <p className={styles.mutedText}>
              Текущая проекция: {derivedSlice.candidateId || "—"} · {getRevisionStateLabel(derivedSlice.reviewStatus) || "—"}
            </p>
          ) : null}
        </div>
      </div>
    </SurfacePacket>
  );
}
