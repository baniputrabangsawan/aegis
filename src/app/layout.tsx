import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aegis Control", template: "%s · Aegis Control" },
  description: "Global multi-site security operations dashboard",
};

export const viewport: Viewport = {
  themeColor: "#f6f7f8",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
