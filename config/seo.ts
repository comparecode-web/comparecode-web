import type { Metadata } from "next";

export const SITE_URL = "https://comparecodeweb.com";
export const SITE_NAME = "CompareCode";
export const SITE_LOGO_PATH = "/brand/comparecode-logo.png";

export const defaultDescription = "CompareCode is a free, open-source comparison tool for code, text, and images. Compare changes in your browser with local processing and no account required.";

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
  title: "CompareCode - Free Online Code and Image Comparison Tool",
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
    "Local comparison history",
    "Merge controls",
    "Image alignment"
  ]
};
