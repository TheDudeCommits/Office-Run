import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource/press-start-2p/400.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Office Run — Escape the 9-to-5",
    description:
      "Run with Joi through five chaotic office levels, catch coffee, recruit Bestie Bob, and protect your Social Battery.",
    applicationName: "Office Run",
    manifest: "/manifest.webmanifest",
    authors: [{ name: "Anonymous" }],
    keywords: ["runner game", "pixel game", "office game", "browser game", "retro game"],
    icons: {
      icon: "/icon-192.png",
      shortcut: "/icon-192.png",
      apple: "/icon-192.png",
    },
    openGraph: {
      title: "Office Run — Escape the 9-to-5",
      description: "Five office levels. One Social Battery. Bestie Bob has your back.",
      type: "website",
      siteName: "Office Run",
      url: origin,
      images: [{ url: `${origin}/og-joi.png`, width: 1660, height: 948, alt: "Joi running through the Office Run campaign" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Office Run — Escape the 9-to-5",
      description: "Five office levels. One Social Battery. Bestie Bob has your back.",
      images: [`${origin}/og-joi.png`],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080c18",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
