export const metadata = {
  title: "Экостройконтинент Admin Placeholder"
};

export default function AdminPlaceholderPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "#65736a" }}>
        Internal surface
      </p>
      <h1 style={{ fontSize: 36, lineHeight: 1.1 }}>
        Admin placeholder
      </h1>
      <p style={{ maxWidth: 720, fontSize: 18, lineHeight: 1.6 }}>
        Эта страница подтверждает, что phase-1 <code>next-app</code> уже держит
        в одном runtime и public read-side, и будущий internal write-side surface,
        не смешивая их доменные роли.
      </p>
    </main>
  );
}
