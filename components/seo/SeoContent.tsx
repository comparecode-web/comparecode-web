import type { ComponentType, ReactNode } from "react";
import { MdArticle, MdCode, MdHistory, MdImage } from "react-icons/md";
import { FaqAccordion, type FaqItem } from "./FaqAccordion";

const homeFaqItems: Array<FaqItem> = [
  {
    question: "What is this site for?",
    answer: "You can compare text, code, and images, and you can preview and edit Markdown files."
  },
  {
    question: "Do I need an account?",
    answer: "No. CompareCode runs directly in your browser, so the main workflows do not require registration or sign-in."
  },
  {
    question: "Is the site free?",
    answer: "Yes, and it will stay free. The open-source code is available on GitHub. If you have any suggestion, feedback is welcome."
  },
  {
    question: "Where is comparison history stored?",
    answer: "Comparison history is stored locally in your browser's IndexedDB storage. The current Markdown draft is stored in localStorage, and Markdown undo/redo session history is stored in sessionStorage."
  },
  {
    question: "Are there ads?",
    answer: "No, and there will not be ads. The goal is to keep the interface fast, calm, and user-friendly. This site is not where I am trying to get rich."
  },
  {
    question: "I found a bug. What should I do?",
    answer: "Please report it through the GitHub repository linked below.",
    links: [
      { href: "https://github.com/comparecode-web/comparecode-web", label: "comparecode-web/comparecode-web" }
    ]
  },
  {
    question: "How can I support the site?",
    answer: "Reporting bugs or sharing ideas is already a big help. You can find more information on the GitHub repository.",
    links: [
      { href: "https://github.com/comparecode-web/comparecode-web", label: "comparecode-web/comparecode-web" }
    ]
  }
];

function SeoBand({ children, className = "" }: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <section className={`w-full border-t border-border-default bg-bg-primary px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, body }: Readonly<{ eyebrow: string; title: string; body: string }>) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold text-text-primary sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">{body}</p>
    </div>
  );
}

function FeatureGrid({ items }: Readonly<{ items: Array<{ title: string; body: string; icon: ComponentType<{ className?: string }> }> }>) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {items.map(({ title, body, icon: Icon }) => (
        <article key={title} className="rounded-lg border border-border-default bg-bg-secondary p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-bg-primary text-accent-primary">
            <Icon className="text-xl" />
          </div>
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{body}</p>
        </article>
      ))}
    </div>
  );
}

function TagList({ items }: Readonly<{ items: Array<string> }>) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-md border border-border-default bg-bg-secondary px-3 py-1.5 text-sm font-semibold text-text-primary">
          {item}
        </span>
      ))}
    </div>
  );
}

export function HomeSeoContent() {
  return (
    <SeoBand>
      <SectionHeading
        eyebrow="Browser-based comparison"
        title="Compare code, text, images, and Markdown without switching tools"
        body="CompareCode is built for developers who need fast visual review of text changes, code diffs, screenshots, image differences, and Markdown drafts. The core workflows run in the browser and do not require an account."
      />

      <FeatureGrid
        items={[
          {
            title: "Text and code diff",
            body: "Review changes in source code, JSON, XML, logs, configuration files, Markdown, and plain text with split or unified views.",
            icon: MdCode
          },
          {
            title: "Visual image diff",
            body: "Compare screenshots and images with side-by-side, fade, slider, heatmap, threshold, and alignment tools.",
            icon: MdImage
          },
          {
            title: "Markdown preview",
            body: "Draft Markdown with live preview, GitHub-style formatting, rich paste support, Mermaid diagrams, KaTeX formulas, and session undo/redo.",
            icon: MdArticle
          },
          {
            title: "Local workflow",
            body: "Use local comparison history, browser draft persistence, and session history tools without creating an account.",
            icon: MdHistory
          }
        ]}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className="text-xl font-bold text-text-primary">How it works</h3>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-text-secondary">
            <li><span className="font-bold text-text-primary">1.</span> Choose text comparison, image comparison, or Markdown preview.</li>
            <li><span className="font-bold text-text-primary">2.</span> Paste text, drop images, write Markdown, or use the browser inputs for your files.</li>
            <li><span className="font-bold text-text-primary">3.</span> Review highlighted differences, adjust options, merge text changes, or preview Markdown output.</li>
          </ol>
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-primary">Supported comparison types</h3>
          <TagList items={["Code", "Plain text", "JSON", "XML", "HTML", "CSS", "JavaScript", "TypeScript", "Markdown", "Mermaid", "KaTeX", "Logs", "Screenshots", "Images"]} />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-bold text-text-primary">CompareCode FAQ</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
          Quick answers about what CompareCode supports, how it works, and what is stored locally in your browser.
        </p>
        <div className="mt-5">
          <FaqAccordion items={homeFaqItems} />
        </div>
      </div>
    </SeoBand>
  );
}
