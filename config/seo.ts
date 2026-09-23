import type { Metadata } from "next";

export const SITE_URL = "https://www.comparecodeweb.com";
export const SITE_NAME = "CompareCode";
export const SITE_LOGO_PATH = "/brand/comparecode-logo.png";
export const SITE_ICON_PATH = "/brand/comparecode-logo.svg";

export const defaultDescription = "CompareCode is a free, open-source browser tool for comparing code, text, and images, previewing Markdown, and creating QR codes locally without an account.";

export function absoluteUrl(path: string): string {
  if (path === "/") {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}${path}`;
}

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
}

export function createPageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [
        {
          url: absoluteUrl(SITE_LOGO_PATH),
          width: 512,
          height: 512,
          alt: SITE_NAME
        }
      ]
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [absoluteUrl(SITE_LOGO_PATH)]
    }
  };
}

export const homeMetadata = createPageMetadata({
  path: "/",
  title: "CompareCode - Free Code, Image, Markdown, and QR Tools",
  description: defaultDescription
});

export const textMetadata = createPageMetadata({
  path: "/text",
  title: "Online Code Compare Tool - Private Text Diff Checker | CompareCode",
  description: "Paste two code or text snippets and compare differences side by side. Works with JSON, XML, HTML, CSS, JavaScript, TypeScript, Markdown, logs, and plain text."
});

export const imageMetadata = createPageMetadata({
  path: "/image",
  title: "Online Image Comparison Tool - Visual Diff Checker | CompareCode",
  description: "Compare screenshots and images visually with side-by-side, fade, slider, heatmap, perceptual, threshold, and alignment tools."
});

export const markdownMetadata = createPageMetadata({
  path: "/markdown",
  title: "Markdown Preview Tool - Live Markdown Editor and Renderer | CompareCode",
  description: "Write Markdown with live preview, line numbers, local draft persistence, GitHub-style formatting, rich paste support, Mermaid diagrams, KaTeX formulas, and session undo/redo."
});

export const qrMetadata = createPageMetadata({
  path: "/qr",
  title: "Free QR Code Generator - Create PNG and SVG Codes | CompareCode",
  description: "Create static QR codes for websites, text, and Wi-Fi in your browser. Customize colors and error correction, then download PNG or SVG without uploading content."
});

export const settingsMetadata = createPageMetadata({
  path: "/settings",
  title: "Settings | CompareCode",
  description: "Customize CompareCode appearance and comparison behavior."
});

export const historyMetadata = createPageMetadata({
  path: "/history",
  title: "History | CompareCode",
  description: "Restore recent local CompareCode comparisons."
});

export const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web browser",
  isAccessibleForFree: true,
  featureList: [
    "Text comparison",
    "Code diff",
    "Image comparison",
    "Markdown preview",
    "Live Markdown editor",
    "Mermaid and KaTeX rendering",
    "Local comparison history",
    "Merge controls",
    "Image alignment",
    "QR code generation"
  ]
};
