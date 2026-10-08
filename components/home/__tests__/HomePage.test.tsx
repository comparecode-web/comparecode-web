import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home, { metadata } from "@/app/(workspace)/page";

function renderHome() {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<Home />);
  return container;
}

describe("Home", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("offers labelled project links and licenses in its footer", () => {
    const footer = renderHome().querySelector("footer");
    const links = [...footer!.querySelectorAll("a")];
    expect(links.map((link) => [link.textContent?.trim(), link.getAttribute("href")])).toEqual([
      ["GitHub", "https://github.com/comparecode-web/comparecode-web"],
      ["Support the project", "https://ko-fi.com/gabrieltm"],
      ["Open-source licenses", "/licenses/third-party.txt"]
    ]);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("shows the embedded version without a timezone or commit suffix", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "20261008.1510");
    const footer = renderHome().querySelector("footer");
    expect(footer?.lastElementChild?.textContent).toBe("Version 20261008.1510");
  });

  it("identifies local builds as Development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "");
    const footer = renderHome().querySelector("footer");
    expect(footer?.lastElementChild?.textContent).toBe("Development");
    expect(footer).not.toHaveTextContent("Version");
  });

  it("keeps discovery content and all FAQ answers in the initial HTML", () => {
    const container = renderHome();

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")).toHaveTextContent("Small tools. Good work.");
    expect(container).toHaveTextContent("CompareCode / Free and open source");
    expect(container).toHaveTextContent("Compare text, code and images. Write Markdown and create QR codes.");
    for (const route of ["/text", "/image", "/markdown", "/qr", "/history", "/settings"]) {
      expect(container.querySelector(`a[href="${route}"]`)).not.toBeNull();
    }

    const questions = container.querySelectorAll("button[aria-controls]");
    expect(questions).toHaveLength(4);
    for (const question of questions) {
      const answerId = question.getAttribute("aria-controls");
      const answer = container.querySelector(`[id="${answerId}"]`);
      expect(answer?.textContent?.trim().length).toBeGreaterThan(0);
      expect(answer?.textContent).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("retains the public Home metadata and application structured data", () => {
    const container = renderHome();
    expect(metadata.alternates?.canonical).toBe("https://www.comparecodeweb.com/");
    expect(metadata.title).toBe("CompareCode - Free Code, Image, Markdown, and QR Tools");
    expect(metadata.robots).toBeUndefined();

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? "")).toMatchObject({
      "@type": "SoftwareApplication",
      name: "CompareCode",
      url: "https://www.comparecodeweb.com/",
      isAccessibleForFree: true,
    });
  });
});
