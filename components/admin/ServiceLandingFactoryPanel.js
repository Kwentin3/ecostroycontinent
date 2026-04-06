import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  buildServiceLandingVerificationReport,
  getLatestServiceLandingFactoryRecord
} from "../../lib/landing-factory/service.js";
import { normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { SurfacePacket } from "./SurfacePacket";
import styles from "./admin-ui.module.css";

function renderIssues(issues = []) {
  if (!issues.length) {
    return <span className={styles.badge}>OK</span>;
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
      eyebrow="Landing factory"
      title="Service candidate report"
      summary={normalizeLegacyCopy(report.summary)}
      legend="Factory metadata, section projection, and verification state for the current service candidate."
      meta={[
        `Status: ${report.overallStatus}`,
        `Sections: ${visibleSectionCount}/${report.sections.length}`,
        report.approvalEligible ? "Approval-eligible" : "Not approval-eligible",
        report.renderCompatible ? "Render compatible" : "Render blocked",
        report.publishReady ? "Publish-ready" : "Not publish-ready"
      ]}
    >
      <div className={styles.stack}>
        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Candidate</strong>
            <p className={styles.mutedText}>{derivedArtifactSlice.candidateId}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Base revision</strong>
            <p className={styles.mutedText}>{derivedArtifactSlice.baseRevisionId || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Route family</strong>
            <p className={styles.mutedText}>{derivedArtifactSlice.routeFamily}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Spec version</strong>
            <p className={styles.mutedText}>{derivedArtifactSlice.specVersion}</p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <strong>Source context</strong>
          <p className={styles.mutedText}>{normalizeLegacyCopy(report.sourceContextSummary || derivedArtifactSlice.sourceContextSummary || "—")}</p>
        </div>

        {report.llm ? (
          <div className={styles.timelineItem}>
            <strong>LLM path</strong>
            <p className={styles.mutedText}>
              {report.llm.providerId}/{report.llm.modelId} · {report.llm.status} · {report.llm.transportState} · {report.llm.structuredOutputState} · {report.llm.validationState}
            </p>
          </div>
        ) : null}

        <section className={styles.panelMuted}>
          <h4>Section projection</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Section</th>
                <th>Status</th>
                <th>Render target</th>
              </tr>
            </thead>
            <tbody>
              {report.sections.map((section) => (
                <tr key={section.id}>
                  <td>{section.label}</td>
                  <td><span className={styles.badge}>{section.status}</span></td>
                  <td>{section.renderTarget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.panelMuted}>
          <h4>Verification classes</h4>
          <div className={styles.stack}>
            {report.classResults.map((classResult) => (
              <div key={classResult.classId} className={styles.timelineItem}>
                <strong>{classResult.classId}</strong>
                <p className={styles.mutedText}>
                  <span className={styles.badge}>{classResult.status}</span>
                </p>
                {renderIssues(classResult.issues)}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panelMuted}>
          <h4>Blocking issues</h4>
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
            <p className={styles.emptyHint}>No blocking issues.</p>
          )}
        </section>
      </div>
    </SurfacePacket>
  );
}
