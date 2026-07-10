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
      "Jump meetings, duck emails, dodge coworkers, and protect your last three points of sanity in this free pixel-art endless runner.",
    applicationName: "Office Run",
    manifest: "/manifest.webmanifest",
    authors: [{ name: "Anonymous" }],
    keywords: ["endless runner", "pixel game", "office game", "browser game", "retro game"],
    icons: {
      icon: "/icon-192.png",
      shortcut: "/icon-192.png",
      apple: "/icon-192.png",
    },
    openGraph: {
      title: "Office Run — Escape the 9-to-5",
      description: "Dodge meetings. Duck emails. Keep your sanity.",
      type: "website",
      siteName: "Office Run",
      url: origin,
      images: [{ url: `${origin}/og.png`, width: 1659, height: 948, alt: "Office Run pixel-art game" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Office Run — Escape the 9-to-5",
      description: "Dodge meetings. Duck emails. Keep your sanity.",
      images: [`${origin}/og.png`],
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
