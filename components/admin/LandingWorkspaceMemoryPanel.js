import { normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { SurfacePacket } from "./SurfacePacket";
import styles from "./admin-ui.module.css";

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
  const summary = artifactState.verificationSummary || "Session-scoped working state for the landing workspace.";

  return (
    <SurfacePacket
      eyebrow="Memory Card"
      title="Landing workspace state"
      summary={normalizeLegacyCopy(summary)}
      legend="Session-scoped working state only. It is not canonical truth, not publish state, and not a second source of truth."
      meta={[
        sessionIdentity.sessionId ? `Session: ${sessionIdentity.sessionId}` : "Session: unavailable",
        sessionIdentity.entityId ? `Page: ${sessionIdentity.entityId}` : "Page: not anchored",
        artifactState.reviewStatus ? `Review: ${artifactState.reviewStatus}` : "Review: pending",
        candidatePointer?.candidateId ? `Candidate: ${candidatePointer.candidateId}` : "Candidate: none"
      ]}
    >
      <div className={styles.stack}>
        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Session identity</strong>
            <p className={styles.mutedText}>
              {sessionIdentity.actor?.displayName || sessionIdentity.actor?.username || "Unknown actor"} ·
              {" "}{sessionIdentity.entityType || "page"} · {sessionIdentity.entityId || "unanchored"}
            </p>
            <p className={styles.mutedText}>
              Route locked: {sessionIdentity.routeLocked ? "yes" : "no"} · Entity locked: {sessionIdentity.entityLocked ? "yes" : "no"}
            </p>
            <p className={styles.mutedText}>
              Updated: {sessionIdentity.timestamps?.memoryCardUpdatedAt || "—"}
            </p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Editorial intent</strong>
            <p className={styles.mutedText}>Change: {renderValue(editorialIntent.changeIntent)}</p>
            <p className={styles.mutedText}>Goal: {renderValue(editorialIntent.editorialGoal)}</p>
            <p className={styles.mutedText}>Variant: {renderValue(editorialIntent.variantDirection)}</p>
          </div>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Proof selection</strong>
            <p className={styles.mutedText}>Cases: {renderValue(proofSelection.selectedCaseIds)}</p>
            <p className={styles.mutedText}>Galleries: {renderValue(proofSelection.selectedGalleryIds)}</p>
            <p className={styles.mutedText}>Media: {renderValue(proofSelection.selectedMedia)}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Artifact state</strong>
            <p className={styles.mutedText}>
              Candidate: {candidatePointer?.candidateId || "—"}
            </p>
            <p className={styles.mutedText}>
              Spec: {artifactState.specVersion || "—"} · Review: {artifactState.reviewStatus || "—"}
            </p>
            <p className={styles.mutedText}>
              Preview: {artifactState.previewMode || "desktop"}
            </p>
          </div>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.timelineItem}>
            <strong>Trace</strong>
            <p className={styles.mutedText}>LLM trace: {traceState.lastLlmTraceId || "—"}</p>
            <p className={styles.mutedText}>Request: {traceState.requestId || "—"}</p>
            <p className={styles.mutedText}>Generated: {traceState.generationTimestamp || "—"}</p>
          </div>
          <div className={styles.timelineItem}>
            <strong>Decisions</strong>
            <p className={styles.mutedText}>Accepted: {renderValue(editorialDecisions.acceptedDecisions)}</p>
            <p className={styles.mutedText}>Rejected: {renderValue(editorialDecisions.rejectedDirections)}</p>
            <p className={styles.mutedText}>Blockers: {renderValue(editorialDecisions.activeBlockers)}</p>
            <p className={styles.mutedText}>Warnings: {renderValue(editorialDecisions.warnings)}</p>
          </div>
        </div>

        <div className={styles.timelineItem}>
          <strong>Recent turn</strong>
          <p className={styles.mutedText}>Last change: {renderValue(recentTurn.lastChange)}</p>
          <p className={styles.mutedText}>Last blocker: {renderValue(recentTurn.lastBlocker)}</p>
          <p className={styles.mutedText}>Outcome: {renderValue(recentTurn.generationOutcome)}</p>
          <p className={styles.mutedText}>Archive pointer: {renderValue(archivePointer.pointer)}</p>
          {derivedSlice ? (
            <p className={styles.mutedText}>
              Derived slice: {derivedSlice.candidateId || "—"} · {derivedSlice.reviewStatus || "—"}
            </p>
          ) : null}
        </div>
      </div>
    </SurfacePacket>
  );
}
