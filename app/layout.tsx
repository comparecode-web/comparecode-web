import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SettingsProvider } from "@/components/layout/SettingsProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { GlobalTooltip } from "@/components/layout/GlobalTooltip";
import { ToastViewport } from "@/components/layout/ToastViewport";
import { defaultDescription, SITE_LOGO_PATH, SITE_NAME, SITE_URL } from "@/config/seo";

const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var raw = localStorage.getItem("comparecode_settings");
      if (!raw) {
        return;
      }

      var parsed = JSON.parse(raw);
      var theme = parsed && parsed.theme;

      if (!theme) {
        return;
      }

      var darkThemes = ["dark", "dracula", "monokai", "solarized-dark", "nord"];
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.colorScheme = darkThemes.indexOf(theme) >= 0 ? "dark" : "light";
    } catch (_) {
      // no-op
    }
  })();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "CompareCode - Free Online Code and Image Comparison Tool",
    template: "%s"
  },
  description: defaultDescription,
  alternates: {
    canonical: SITE_URL
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "CompareCode - Free Online Code, Image, and Markdown Tools",
    description: defaultDescription,
    url: SITE_URL,
    images: [
      {
        url: SITE_LOGO_PATH,
        width: 512,
        height: 512,
        alt: SITE_NAME
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "CompareCode - Free Online Code, Image, and Markdown Tools",
    description: defaultDescription,
    images: [SITE_LOGO_PATH]
  },
  icons: {
    icon: SITE_LOGO_PATH,
    shortcut: SITE_LOGO_PATH,
    apple: SITE_LOGO_PATH
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SettingsProvider>
          <ThemeProvider>
            {children}
            <GlobalTooltip />
            <ToastViewport />
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
