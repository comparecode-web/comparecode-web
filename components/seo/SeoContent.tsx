import type { ComponentType, ReactNode } from "react";
import { MdArticle, MdCode, MdHistory, MdImage } from "react-icons/md";
import { FaqAccordion, type FaqItem } from "./FaqAccordion";

const homeFaqItems: Array<FaqItem> = [
  {
    question: "What is CompareCode for?",
    answer: "CompareCode was created to give people a free, ad-free place to compare text and code, review image differences, and preview Markdown files in one browser-based workspace. The goal is a customizable, user-friendly tool focused on useful features instead of ads, paywalls, or distracting upsells."
  },
  {
    question: "How do I use text compare?",
    answer: "Paste the original text on one side and the modified text on the other, then run the comparison. After the diff is generated, you can merge changes between the original and modified versions, switch between word and character precision, choose split or unified layout, and fine-tune helper options for your workflow."
  },
  {
    question: "How do I use image comparison?",
    answer: "Choose two images from your computer or drag and drop them into the image comparison tool. CompareCode will compare them automatically. If the image dimensions do not match, you can use auto align to fit them together, or adjust the alignment manually if you want more control."
  },
  {
    question: "How do I use Markdown preview?",
    answer: "Drop a Markdown or text file into the editor, paste content from your clipboard, or write directly in CompareCode. You can preview the rendered result, insert tables and alerts, and format the document with common Markdown actions while you work."
  },
  {
    question: "How does history work, and what is saved?",
    answer: "CompareCode saves text compare and image comparison sessions in your browser so you can reopen them later. You can restore previous items, bookmark important comparisons, or delete entries you no longer need."
  },
  {
    question: "How can I customize CompareCode?",
    answer: "The settings page lets you choose a theme, adjust text comparison highlight colors, and configure the date and time format used in the history view."
  },
  {
    question: "Do I need an account?",
    answer: "No. CompareCode runs directly in your browser, so the main workflows do not require registration or sign-in."
  },
  {
    question: "Where is my data stored?",
    answer: "Comparison history is stored locally in your browser's IndexedDB storage. Markdown drafts use browser storage as well, so you can keep working without creating an account."
  },
  {
    question: "Is CompareCode free?",
    answer: "Yes. CompareCode is free and open source. Feedback, bug reports, and feature ideas are welcome through the GitHub repository."
  },
  {
    question: "Are there ads?",
    answer: "No. CompareCode is designed to stay calm, fast, and focused on practical comparison workflows without ads or paywalls."
  },
  {
    question: "I found a bug. What should I do?",
    answer: "Please report it through the GitHub repository linked below.",
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
