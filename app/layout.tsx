import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/components/layout/SettingsProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { GlobalTooltip } from "@/components/layout/GlobalTooltip";

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
  title: "CompareCode",
  description: "A fast and robust code comparison tool",
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
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}