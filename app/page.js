import Link from "next/link";

import styles from "../components/public/public-ui.module.css";
import { getRuntimeConfig } from "../lib/runtime-config";

export default function HomePage() {
  const config = getRuntimeConfig();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Ekostroykontinent</p>
        <h1>Published read-side and admin first slice</h1>
        <p className={styles.note}>
          This runtime hosts the public published surface and the admin write-side console as separate layers.
        </p>
      </section>

      <section className={styles.card}>
        <h2>Runtime facts</h2>
        <ul>
          <li>Framework: Next.js App Router</li>
          <li>Node environment: {config.nodeEnv}</li>
          <li>Runtime port: {config.port}</li>
          <li>Database wiring configured: {config.databaseConfigured ? "yes" : "no"}</li>
        </ul>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Published read-side</h2>
          <p>Public routes should read only published revisions from SQL.</p>
          <Link href="/services">Services</Link>
          <Link href="/cases">Cases</Link>
          <Link href="/about">About</Link>
          <Link href="/contacts">Contacts</Link>
        </article>
        <article className={styles.card}>
          <h2>Write-side tools</h2>
          <p>Admin flows stay separate from public templates and operate through explicit domain operations.</p>
          <Link href="/admin">Admin console</Link>
          <Link href="/api/health">Health endpoint</Link>
        </article>
      </section>
    </main>
  );
}
