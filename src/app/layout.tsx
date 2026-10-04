import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Press_Start_2P } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { profile } from "@/content/profile";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

const chakra = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "swap",
});

/**
 * Runs during HTML parsing, before first paint: if this tab already pressed START,
 * mark <html> so CSS hides the server-rendered boot overlay (no flash on repeat visits).
 * Keys must match createWebStore("session"|"local") + STORAGE_KEYS.booted / STORAGE_KEYS.quickView.
 * Quick view also skips the boot screen.
 */
const BOOT_FLAG_SCRIPT = `try{var d=document.documentElement.dataset;if(sessionStorage.getItem("portfolio.exe:booted"))d.booted="1";if(localStorage.getItem("portfolio.exe:quickView")==="true"){d.quick="1";d.booted="1"}}catch(e){}`;
const NO_JS_CSS = ".boot-overlay{display:none!important}[data-hero-item]{opacity:1!important;transform:none!important}";

const title = `${profile.name} · ${profile.headline}`;
const description =
  "Data & AI engineer building lakehouses, pipelines and AI agents on Azure. Explore my quest log, galaxy of projects and skills in PORTFOLIO.EXE.";

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: title, template: `%s · ${profile.name}` },
  description,
  applicationName: "PORTFOLIO.EXE",
  authors: [{ name: profile.name, url: profile.siteUrl }],
  keywords: [
    "Data Engineer",
    "AI Engineer",
    "Azure",
    "Databricks",
    "Microsoft Fabric",
    "PySpark",
    "Lakehouse",
    "RAG",
    "Hyderabad",
  ],
  openGraph: {
    type: "website",
    url: profile.siteUrl,
    title,
    description,
    siteName: "PORTFOLIO.EXE",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0b1e",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${pressStart.variable} ${chakra.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_FLAG_SCRIPT }} />
        <noscript>
          <style>{NO_JS_CSS}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#main"
          className="font-pixel text-px-sm bg-coin text-on-accent sr-only z-[100] p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
