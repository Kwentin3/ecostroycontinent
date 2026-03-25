export const metadata = {
  title: "Ekostroykontinent",
  description: "Phase-1 Next.js app baseline for the Ecostroycontinent project."
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f5f2ea",
          color: "#1f2a22"
        }}
      >
        {children}
      </body>
    </html>
  );
}
