import type { Metadata } from "next";
import "./globals.css";
import "./camera.css";

export const metadata: Metadata = {
  title: "VCam — камера iPhone на компьютере",
  description: "Подключи телефон по QR и управляй камерой с компьютера.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}

