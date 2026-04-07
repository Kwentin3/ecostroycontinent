import { buildLandingWorkspaceVerificationReport } from "../../lib/landing-workspace/landing.js";
import { normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { SurfacePacket } from "./SurfacePacket";
import styles from "./admin-ui.module.css";

function getLatestLandingWorkspaceRecord(auditItems = []) {
  return (Array.isArray(auditItems) ? auditItems : []).find((item) => item?.details?.landingWorkspace) ?? null;
}

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
  const visibleSectionCount = effectiveReport.sections.filter((section) => section.status === "present").length;

  return (
    <SurfacePacket
      eyebrow="Landing report"
      title="Landing candidate report"
      summary={normalizeLegacyCopy(effectiveReport.summary)}
      legend="Preview, verification, and review visibility all read this same derived artifact slice."
      meta={[
        `Status: ${effectiveReport.overallStatus}`,
        `Sections: ${visibleSectionCount}/${effectiveReport.sections.length}`,
        effectiveReport.approvalEligible ? "Approval-eligible" : "Not approval-eligible",
        effectiveReport.renderCompatible ? "Render compatible" : "Render blocked",
        effectiveReport.publishReady ? "Publish-ready" : "Not publish-ready"
      ]}
    >
      <div className={styles.stack}>
        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Candidate</strong>
            <p className={styles.mutedText}>{slice.candidateId}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Page anchor</strong>
            <p className={styles.mutedText}>{slice.pageId || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Draft handle</strong>
            <p className={styles.mutedText}>{slice.landingDraftId || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Spec</strong>
            <p className={styles.mutedText}>{slice.routeFamily} · {slice.specVersion}</p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <strong>Source context</strong>
          <p className={styles.mutedText}>{normalizeLegacyCopy(effectiveReport.sourceContextSummary || slice.sourceContextSummary || "—")}</p>
        </div>

        {effectiveReport.llm ? (
          <div className={styles.timelineItem}>
            <strong>LLM path</strong>
            <p className={styles.mutedText}>
              {effectiveReport.llm.providerId}/{effectiveReport.llm.modelId} · {effectiveReport.llm.status} · {effectiveReport.llm.transportState} · {effectiveReport.llm.structuredOutputState} · {effectiveReport.llm.validationState}
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
              {effectiveReport.sections.map((section) => (
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
            {effectiveReport.classResults.map((classResult) => (
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
            <p className={styles.emptyHint}>No blocking issues.</p>
          )}
        </section>
      </div>
    </SurfacePacket>
  );
}
