import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://mundialito-dmo.vercel.app";
const SITE_NAME = "Pronostico";
const SITE_TITLE = "Pronostico - Disfruta el mundial junto a DMO S.R.L.";
const SITE_DESC =
  "Pronosticá los partidos, sumá puntos y podrás ganar excelentes premios mientras te diviertes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Pronostico",
  description: SITE_DESC,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "es_BO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

// Aplica el tema guardado antes de pintar, para evitar el parpadeo.
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
