import { buildLandingWorkspaceVerificationReport } from "../../lib/landing-workspace/landing.js";
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

function getLatestLandingWorkspaceRecord(auditItems = []) {
  return (Array.isArray(auditItems) ? auditItems : []).find((item) => item?.details?.landingWorkspace) ?? null;
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

export function LandingWorkspaceVerificationPanel({
  derivedArtifactSlice = null,
  readiness = null,
  revision = null,
  auditItems = [],
  report = null
}) {
  const landingWorkspaceRecord = getLatestLandingWorkspaceRecord(auditItems);
  const slice = derivedArtifactSlice
    ?? landingWorkspaceRecord?.details?.landingWorkspace?.derivedArtifactSlice
    ?? null;

  if (!slice) {
    return null;
  }

  const effectiveReport = report ?? buildLandingWorkspaceVerificationReport({
    candidateSpec: slice,
    readiness,
    revision,
    llmResult: landingWorkspaceRecord?.details?.landingWorkspace?.llm ?? slice?.llm ?? null
  });
  const blocks = effectiveReport.blocks ?? effectiveReport.sections ?? [];
  const shellRegions = effectiveReport.shellRegions ?? [];
  const visibleSectionCount = blocks.filter((section) => section.status === "present").length;

  return (
    <SurfacePacket
      eyebrow="Отчет по лендингу"
      title="Отчет по лендингу"
      summary={normalizeLegacyCopy(effectiveReport.summary)}
      legend="Предпросмотр, проверка и видимость проверки читают одну и ту же текущую проекцию."
      meta={[
        `Статус: ${formatOverallStatus(effectiveReport.overallStatus)}`,
        `Разделы: ${visibleSectionCount}/${blocks.length}`,
        formatEligibility(effectiveReport.approvalEligible, "Можно согласовать", "Нельзя согласовать"),
        formatEligibility(effectiveReport.renderCompatible, "Готов к показу", "Не готов к показу"),
        formatEligibility(effectiveReport.publishReady, "Готово к публикации", "Не готово к публикации")
      ]}
    >
      <div className={styles.stack}>
        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Черновик</strong>
            <p className={styles.mutedText}>{slice.candidateId}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Страница-источник</strong>
            <p className={styles.mutedText}>{slice.pageId || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>ID черновика</strong>
            <p className={styles.mutedText}>{slice.landingDraftId || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Спецификация</strong>
            <p className={styles.mutedText}>{formatRouteFamily(slice.routeFamily)} · {slice.specVersion}</p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <strong>Контекст источника</strong>
          <p className={styles.mutedText}>{normalizeLegacyCopy(effectiveReport.sourceContextSummary || slice.sourceContextSummary || "—")}</p>
        </div>

        {effectiveReport.llm ? (
          <div className={styles.timelineItem}>
            <strong>Путь LLM</strong>
            <p className={styles.mutedText}>
              {effectiveReport.llm.providerId}/{effectiveReport.llm.modelId} · {effectiveReport.llm.status} · {effectiveReport.llm.transportState} · {effectiveReport.llm.structuredOutputState} · {effectiveReport.llm.validationState}
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
              {blocks.map((section) => (
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
          <h4>Shell Regions</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Region</th>
                <th>Status</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {shellRegions.map((region) => (
                <tr key={region.id}>
                  <td>{region.label}</td>
                  <td><span className={styles.badge}>{region.status || "fixed"}</span></td>
                  <td>{region.ref || region.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.panelMuted}>
          <h4>Классы проверки</h4>
          <div className={styles.stack}>
            {effectiveReport.classResults.map((classResult) => (
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
          {effectiveReport.blockingIssues.length ? (
            <ul className={styles.surfacePacketList}>
              {effectiveReport.blockingIssues.map((issue) => (
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
