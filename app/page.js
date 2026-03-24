import Link from "next/link";

import { getRuntimeConfig } from "../lib/runtime-config";

export default function HomePage() {
  const config = getRuntimeConfig();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "#65736a" }}>
        Экостройконтинент
      </p>
      <h1 style={{ marginBottom: 12, fontSize: 40, lineHeight: 1.1 }}>
        Phase-1 app baseline is now materialized
      </h1>
      <p style={{ maxWidth: 720, fontSize: 18, lineHeight: 1.6 }}>
        Этот Next.js runtime служит минимальным честным baseline для дальнейшей
        реализации публичного сайта, админки и deploy surface без архитектурных
        догадок.
      </p>

      <section style={{ marginTop: 32, padding: 24, borderRadius: 16, background: "#ffffff", boxShadow: "0 8px 32px rgba(31, 42, 34, 0.08)" }}>
        <h2 style={{ marginTop: 0 }}>Runtime facts</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Framework: Next.js App Router</li>
          <li>Node environment: {config.nodeEnv}</li>
          <li>Runtime port: {config.port}</li>
          <li>Database wiring configured: {config.databaseConfigured ? "yes" : "no"}</li>
        </ul>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/admin">Admin placeholder</Link>
          <Link href="/api/health">Health endpoint</Link>
        </div>
      </section>
    </main>
  );
}
