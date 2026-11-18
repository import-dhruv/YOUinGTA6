import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOUinGTA6 — Which GTA VI Character Are You?",
  description: "Your tweets. Your mindset. Your identity in Leonida. Discover your GTA VI character from your X personality — no AI model, just math.",
  openGraph: {
    title: "YOUinGTA6 — Which GTA VI Character Are You?",
    description: "Discover your identity in Leonida from your X personality.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05020f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
