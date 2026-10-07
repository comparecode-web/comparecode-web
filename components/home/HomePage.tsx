import Link from "next/link";
import {
  MdArrowOutward, MdArticle, MdCheck, MdCode, MdHistory,
  MdImage, MdQrCode2, MdSettings,
} from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { FaqAccordion, type FaqItem } from "@/components/seo/FaqAccordion";
import styles from "./home.module.css";

const tools = [
  {
    href: "/text", title: "Text comparison", icon: MdCode,
    description: "Put two versions side by side. Find the changes and merge what you need.",
    detail: "Code & plain text · Split or unified view",
  },
  {
    href: "/image", title: "Image comparison", icon: MdImage,
    description: "Compare screenshots and images. Take a closer look with a slider or heatmap.",
    detail: "Slider · Overlay · Heatmap",
  },
  {
    href: "/markdown", title: "Markdown preview", icon: MdArticle,
    description: "Make room for your next draft. Write and see the formatted result as you go.",
    detail: "Live preview · Tables · Diagrams",
  },
  {
    href: "/qr", title: "QR code generator", icon: MdQrCode2,
    description: "Share a link, a note or your Wi-Fi details. Create a code and take it with you.",
    detail: "Links · Text · Wi-Fi · PNG & SVG",
  },
] as const;

const workspaceLinks = [
  { href: "/history", title: "History", description: "Pick up a saved comparison.", icon: MdHistory },
  { href: "/settings", title: "Settings", description: "Choose your theme and preferences.", icon: MdSettings },
] as const;

const faq: FaqItem[] = [
  {
    question: "Is CompareCode free? Do I need an account?",
    answer: "Yes, all tools are free to use. You don’t need an account or a subscription. Just choose a tool and get started.",
  },
  {
    question: "Is CompareCode just for code?",
    answer: "No. You can compare everyday text too, like notes, lists or two drafts of the same message. There are also tools for comparing images, writing Markdown and creating QR codes.",
  },
  {
    question: "Are my files uploaded to a server?",
    answer: "No. Text and image comparisons run in your browser. The content you choose isn’t uploaded to a server for comparison.",
  },
  {
    question: "Can I reopen a comparison later?",
    answer: "Yes. Open History in the same browser to find your saved comparisons. Clearing this site’s browser data removes them, so use Export history if you’d like to keep a backup.",
  },
];

function Arrow() {
  return <MdArrowOutward className={styles.icon} aria-hidden="true" />;
}

function ToolDirectory() {
  return (
    <div className={`${styles.directory} ${styles.compact}`}>
      {tools.map(({ href, title, description, detail, icon: Icon }) => (
        <Link className={styles.toolLink} href={href} key={href}>
          <span className={styles.iconTile}><Icon className={styles.icon} aria-hidden="true" /></span>
          <div className={styles.toolCopy}>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className={styles.toolDetail}>{detail}</span>
          </div>
          <span className={styles.toolArrow}><Arrow /></span>
        </Link>
      ))}
    </div>
  );
}

function WorkspaceLinks() {
  return (
    <div className={styles.workspaceLinks}>
      {workspaceLinks.map(({ href, title, description, icon: Icon }) => (
        <Link className={styles.workspaceLink} href={href} key={href}>
          <Icon className={styles.icon} aria-hidden="true" />
          <span><strong>{title}</strong><small>{description}</small></span>
          <Arrow />
        </Link>
      ))}
    </div>
  );
}

function LocalNote() {
  return (
    <div className={styles.localNote}>
      <h2>Your browser.{" "}<br />Your workspace.</h2>
      <p>A place to work with your files, without sending them away for processing.</p>
      <ul>{["Free & open source", "No account needed", "No ads or subscriptions"].map((item) => (
        <li key={item}><MdCheck className={styles.icon} aria-hidden="true" />{item}</li>
      ))}</ul>
    </div>
  );
}

function SectionHeading({ title = "Choose a tool", note = "Ready when you are" }: { title?: string; note?: string }) {
  return <div className={styles.sectionHeading}><h2>{title}</h2><span>{note}</span></div>;
}

function Questions() {
  return (
    <section className={styles.questions}>
      <div className={styles.questionsIntro}>
        <span className={styles.eyebrow}>A little help getting started</span>
        <h2>Glad you’re here.<br />Got a question?</h2>
        <p>Here are a few things you might be wondering. We hope you feel right at home.</p>
        <a href="https://github.com/comparecode-web/comparecode-web/issues" target="_blank" rel="noreferrer">Have an idea? Let us know <Arrow /></a>
      </div>
      <FaqAccordion items={faq} />
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <a href="https://github.com/comparecode-web/comparecode-web" target="_blank" rel="noreferrer"><FaGithub className={styles.icon} aria-hidden="true" /> Open source on GitHub <Arrow /></a>
    </footer>
  );
}

function HomeWorkspace() {
  return (
    <>
      <header className={styles.modernWelcome}>
        <div>
          <span className={styles.eyebrow}>CompareCode / Free and open source</span>
          <h1>Small tools. Good work.</h1>
          <p>Compare text, code and images. Write Markdown and create QR codes.</p>
        </div>
      </header>
      <div className={styles.modernLayout}>
        <section className={styles.modernTools}>
          <SectionHeading title="Your tools" note="Four ways to get started" />
          <ToolDirectory />
        </section>
        <aside className={styles.modernAside}>
          <div className={styles.workspaceHeading}><h2>Your workspace</h2><span>Make yourself at home</span></div>
          <WorkspaceLinks />
          <LocalNote />
        </aside>
      </div>
    </>
  );
}

export function HomePage() {
  return (
    <div className={styles.scroller}>
      <div className={`${styles.canvas} ${styles["compact-spectrum"]} ${styles.modern} ${styles.animated} ${styles.workspaceAnimated}`}>
        <div className={styles.content}>
          <HomeWorkspace />
          <Questions /><Footer />
        </div>
      </div>
    </div>
  );
}
