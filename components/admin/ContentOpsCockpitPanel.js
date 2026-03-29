import Link from "next/link";

import { CockpitNextActions } from "./CockpitNextActions";
import { LaunchCoreCoveragePanel } from "./LaunchCoreCoveragePanel";
import { buildCockpitSurfaceViewModel } from "../../lib/admin/content-ops-cockpit-view.js";
import styles from "./admin-ui.module.css";

function getTonePanelClass(tone) {
  switch (tone) {
    case "danger":
      return styles.statusPanelBlocking;
    case "warning":
      return styles.statusPanelWarning;
    case "healthy":
      return styles.statusPanelInfo;
    default:
      return styles.panelMuted;
  }
}

function getToneValueClass(tone) {
  switch (tone) {
    case "danger":
      return styles.cockpitToneDanger;
    case "warning":
      return styles.cockpitToneWarning;
    case "healthy":
      return styles.cockpitToneHealthy;
    default:
      return styles.cockpitToneUnknown;
  }
}

export function ContentOpsCockpitPanel({ cockpit = null }) {
  const viewModel = buildCockpitSurfaceViewModel(cockpit ?? {});
  const statePanelClass = getTonePanelClass(viewModel.stateTone);

  return (
    <section className={styles.cockpitShell} aria-labelledby="content-ops-cockpit-title">
      <header className={styles.cockpitHeader}>
        <p className={styles.cockpitBlockKicker}>Рабочее место SEO/content operator</p>
        <div className={styles.cockpitHeaderBody}>
          <h3 id="content-ops-cockpit-title" className={styles.cockpitHeaderTitle}>Content ops cockpit</h3>
          <p className={styles.cockpitHeaderLead}>
            Сначала what to do, затем state, затем coverage. Интерфейс показывает, что есть, чего не хватает, почему не хватает и куда нажать.
          </p>
        </div>
        <div className={styles.inlineActions}>
          <Link href="#evidence-register" className={styles.secondaryButton}>
            Open evidence register
          </Link>
        </div>
      </header>

      <CockpitNextActions
        primaryAction={viewModel.primaryAction}
        secondaryActions={viewModel.secondaryActions}
        stateNote={viewModel.stateNote}
      />

      <section className={`${styles.panel} ${statePanelClass}`} aria-labelledby="cockpit-state-title">
        <div className={styles.cockpitBlockHeader}>
          <div>
            <p className={styles.cockpitBlockKicker}>State</p>
            <h4 id="cockpit-state-title" className={styles.cockpitBlockTitle}>Состояние</h4>
          </div>
          <p className={styles.cockpitBlockNote}>Ready / blocked / missing / needs proof. No healthy rendering for empty coverage.</p>
        </div>

        <div className={styles.cockpitStateGrid}>
          {viewModel.stateEntries.map((entry) => (
            <article key={entry.key} className={styles.cockpitStateCard}>
              <span className={styles.cockpitStateLabel}>{entry.label}</span>
              <strong className={`${styles.cockpitStateValue} ${getToneValueClass(entry.tone)}`}>{entry.count}</strong>
              <p className={styles.cockpitStateCopy}>{entry.description}</p>
            </article>
          ))}
        </div>

        <p className={styles.cockpitStateNote}>{viewModel.stateNote}</p>
      </section>

      <LaunchCoreCoveragePanel coverageTiles={viewModel.coverageTiles} coverageNote={viewModel.coverageNote} />
    </section>
  );
}
