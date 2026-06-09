import "./globals.css";

export const metadata = {
  title: "Last Team Standing",
  description: "World Cup 2026 Last Man Standing pool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
