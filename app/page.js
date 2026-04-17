import Link from "next/link";

import { PublicPageShell } from "../components/public/PublicRenderers";
import styles from "../components/public/public-ui.module.css";
import { getPublishedGlobalSettings, getPublishedServices } from "../lib/read-side/public-content";
import {
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../lib/public-launch/placeholder-fixtures";
import { buildPlaceholderRobotsMetadata, resolvePlaceholderMode } from "../lib/public-launch/placeholder-mode";

// Temporary decorative shell only. Keep these tiles local to the homepage.
// Do not move them into Content Core or any second media truth.
const homeTiles = [
  {
    src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
    className: styles.mosaicLead,
    position: "center 38%"
  },
  {
    src: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
    className: styles.mosaicSupportLeft,
    position: "center center"
  },
  {
    src: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=80",
    className: styles.mosaicSupportRight,
    position: "center center"
  }
];

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  return buildPlaceholderRobotsMetadata(placeholderMode);
}

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);

  const [globalSettings, services] = await Promise.all([
    getPublishedGlobalSettings(),
    getPublishedServices()
  ]);

  const resolvedServices = services.length > 0
    ? services
    : (placeholderMode ? getPlaceholderServices() : services);
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);

  return (
    <PublicPageShell
      globalSettings={resolvedGlobalSettings}
      currentPath="/"
      serviceLinks={resolvedServices}
      placeholderMarker={placeholderMode}
    >
      <main className={styles.homeShell}>
        {/* Minimal auth entry: keep it visible, but do not turn it into a heavy CTA. */}
        <Link href="/admin/login" className={styles.loginIcon} aria-label="Войти в админку" title="Войти в админку">
          ↗
        </Link>

        <section className={styles.homeCopy}>
          <h1 className={styles.homeTitle}>Экостройконтинент</h1>
          <p className={styles.homeStatus}>В разработке</p>
        </section>

        {/* Keep the first viewport poster-like; this shell should not read as a feed. */}
        <section className={styles.homeMosaic} aria-hidden="true">
          {homeTiles.map((tile) => (
            <div
              key={tile.src}
              className={`${styles.mosaicCard} ${tile.className}`}
              style={{
                "--tile-image": `url("${tile.src}")`,
                backgroundPosition: tile.position
              }}
            />
          ))}
        </section>
      </main>
    </PublicPageShell>
  );
}
