import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home, { metadata } from "@/app/(workspace)/page";

function renderHome() {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<Home />);
  return container;
}

describe("Home", () => {
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
