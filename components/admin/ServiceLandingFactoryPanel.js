import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  buildServiceLandingVerificationReport,
  getLatestServiceLandingFactoryRecord
} from "../../lib/landing-factory/service.js";
import { normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { SurfacePacket } from "./SurfacePacket";
import styles from "./admin-ui.module.css";

const OVERALL_STATUS_LABELS = {
  blocked: "Заблокировано",
  pass_with_warnings: "С предупреждениями",
  pass: "ОК"
};

const SECTION_STATUS_LABELS = {
  present: "Есть",
  missing: "Не хватает",
  absent: "Нет"
};

const ROUTE_FAMILY_LABELS = {
  landing: "лендинг",
  service: "услуга"
};

function formatOverallStatus(value) {
  return OVERALL_STATUS_LABELS[value] || value;
}

function formatSectionStatus(value) {
  return SECTION_STATUS_LABELS[value] || value;
}

function formatEligibility(value, positive, negative) {
  return value ? positive : negative;
}

function formatRouteFamily(value) {
  return ROUTE_FAMILY_LABELS[value] || value || "—";
}

function renderIssues(issues = []) {
  if (!issues.length) {
    return <span className={styles.badge}>ОК</span>;
  }

  return (
    <ul className={styles.surfacePacketList}>
      {issues.map((issue) => (
        <li key={`${issue.classId}-${issue.code}-${issue.message}`}>
          <strong>{issue.code}</strong>
          <span> · {normalizeLegacyCopy(issue.message)}</span>
        </li>
      ))}
    </ul>
  );
}

export function ServiceLandingFactoryPanel({ entityType, revision, readiness, auditItems }) {
  if (entityType !== ENTITY_TYPES.SERVICE) {
    return null;
  }

  const landingFactoryRecord = getLatestServiceLandingFactoryRecord(auditItems);
  const landingFactory = landingFactoryRecord?.details?.landingFactory ?? null;
  // Prefer the canonical run slice; the legacy candidateSpec fallback keeps older audit records readable.
  const derivedArtifactSlice = landingFactory?.derivedArtifactSlice ?? landingFactory?.candidateSpec ?? null;

  if (!derivedArtifactSlice) {
    return null;
  }

  const report = buildServiceLandingVerificationReport({
    candidateSpec: derivedArtifactSlice,
    readiness,
    revision,
    llmResult: landingFactory.llm ?? null
  });
  const visibleSectionCount = report.sections.filter((section) => section.status === "present").length;

  return (
    <SurfacePacket
      eyebrow="Отчет по карточке услуги"
      title="Отчет по карточке услуги"
      summary={normalizeLegacyCopy(report.summary)}
      legend="Метаданные фабрики, проекция разделов и состояние проверки для текущей карточки услуги."
      meta={[
        `Статус: ${formatOverallStatus(report.overallStatus)}`,
        `Разделы: ${visibleSectionCount}/${report.sections.length}`,
        formatEligibility(report.approvalEligible, "Можно согласовать", "Нельзя согласовать"),
        formatEligibility(report.renderCompatible, "Готов к показу", "Не готов к показу"),
        formatEligibility(report.publishReady, "Готово к публикации", "Не готово к публикации")
      ]}
    >
      <div className={styles.stack}>
        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Черновик</strong>
            <p className={styles.mutedText}>{derivedArtifactSlice.candidateId}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Базовая версия</strong>
            <p className={styles.mutedText}>{derivedArtifactSlice.baseRevisionId || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Маршрут</strong>
            <p className={styles.mutedText}>{formatRouteFamily(derivedArtifactSlice.routeFamily)}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Версия спецификации</strong>
            <p className={styles.mutedText}>{derivedArtifactSlice.specVersion}</p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <strong>Контекст источника</strong>
          <p className={styles.mutedText}>{normalizeLegacyCopy(report.sourceContextSummary || derivedArtifactSlice.sourceContextSummary || "—")}</p>
        </div>

        {report.llm ? (
          <div className={styles.timelineItem}>
            <strong>Путь LLM</strong>
            <p className={styles.mutedText}>
              {report.llm.providerId}/{report.llm.modelId} · {report.llm.status} · {report.llm.transportState} · {report.llm.structuredOutputState} · {report.llm.validationState}
            </p>
          </div>
        ) : null}

        <section className={styles.panelMuted}>
          <h4>Проекция разделов</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Раздел</th>
                <th>Статус</th>
                <th>Целевой блок</th>
              </tr>
            </thead>
            <tbody>
              {report.sections.map((section) => (
                <tr key={section.id}>
                  <td>{section.label}</td>
                  <td><span className={styles.badge}>{formatSectionStatus(section.status)}</span></td>
                  <td>{section.renderTarget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.panelMuted}>
          <h4>Классы проверки</h4>
          <div className={styles.stack}>
            {report.classResults.map((classResult) => (
              <div key={classResult.classId} className={styles.timelineItem}>
                <strong>{classResult.classId}</strong>
                <p className={styles.mutedText}>
                  <span className={styles.badge}>{formatOverallStatus(classResult.status)}</span>
                </p>
                {renderIssues(classResult.issues)}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panelMuted}>
          <h4>Блокирующие проблемы</h4>
          {report.blockingIssues.length ? (
            <ul className={styles.surfacePacketList}>
              {report.blockingIssues.map((issue) => (
                <li key={`${issue.classId}-${issue.code}-${issue.message}`}>
                  <strong>{issue.code}</strong>
                  <span> · {normalizeLegacyCopy(issue.message)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>Блокирующих проблем нет.</p>
          )}
        </section>
      </div>
    </SurfacePacket>
  );
}
