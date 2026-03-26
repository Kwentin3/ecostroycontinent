export const metadata = {
  title: "Экостройконтинент",
  description: "Русский интерфейс проекта Экостройконтинент."
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
