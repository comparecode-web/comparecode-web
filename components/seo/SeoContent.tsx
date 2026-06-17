import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { MdCode, MdHistory, MdImage } from "react-icons/md";
import { FaqAccordion, type FaqItem } from "./FaqAccordion";

const homeFaqItems: Array<FaqItem> = [
  {
    question: "What can I compare with CompareCode?",
    answer: "CompareCode supports text and code comparison, plus visual image comparison for screenshots, design exports, and common browser-supported image formats."
  },
  {
    question: "Do I need an account?",
    answer: "No. CompareCode is designed as a direct browser-based tool, so the main comparison workflows do not require an account."
  },
  {
    question: "Is CompareCode free and open source?",
    answer: "Yes. CompareCode is a free and open-source project, built as a practical comparison tool for developers and technical review workflows."
  },
  {
    question: "Where is comparison history stored?",
    answer: "Comparison history is stored locally in your browser, so recent work can be restored without an account-based sync workflow."
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
        title="Compare code, text, and images without switching tools"
        body="CompareCode is built for developers who need fast visual review of text changes, code diffs, screenshots, and image differences. The core workflows run in the browser and do not require an account."
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
            title: "Local workflow",
            body: "Use local history and merge controls to move through comparison work without creating an account.",
            icon: MdHistory
          }
        ]}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className="text-xl font-bold text-text-primary">How it works</h3>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-text-secondary">
            <li><span className="font-bold text-text-primary">1.</span> Choose text comparison or image comparison.</li>
            <li><span className="font-bold text-text-primary">2.</span> Paste text, drop images, or use the browser inputs for your files.</li>
            <li><span className="font-bold text-text-primary">3.</span> Review highlighted differences, adjust options, and merge text changes when needed.</li>
          </ol>
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-primary">Supported comparison types</h3>
          <TagList items={["Code", "Plain text", "JSON", "XML", "HTML", "CSS", "JavaScript", "TypeScript", "Markdown", "Logs", "Screenshots", "Images"]} />
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

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/text" className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
          <MdCode className="text-lg" />
          Compare text and code
        </Link>
        <Link href="/image" className="inline-flex items-center justify-center gap-2 rounded-md border border-border-default bg-bg-secondary px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-hover-overlay">
          <MdImage className="text-lg" />
          Compare images
        </Link>
      </div>
    </SeoBand>
  );
}
