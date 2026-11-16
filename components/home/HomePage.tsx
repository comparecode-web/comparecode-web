import Link from "next/link";
import {
  MdArrowOutward, MdArticle, MdCheck, MdCode, MdHistory,
  MdImage, MdQrCode2, MdSettings, MdFavorite,
} from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { FaqAccordion, type FaqItem } from "@/components/seo/FaqAccordion";
import { PageContent } from "@/components/layout/PageContent";
import { PROJECT_LINKS } from "@/config/project";
import { linkColors, linkIcon } from "@/components/ui/controlStyles";
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
    description: "Share a link, a note or your Wi-Fi details. Create a code, or scan one from an image.",
    detail: "Create · Scan · PNG & SVG",
  },
] as const;

const workspaceLinks = [
  { href: "/history", title: "History", description: "Pick up a saved comparison.", icon: MdHistory },
  { href: "/settings", title: "Settings", description: "Choose your theme and preferences.", icon: MdSettings },
] as const;

const faq: FaqItem[] = [
  {
    question: "Are my text and images uploaded?",
    answer: "No. Text and image comparisons run locally in your browser. Your comparison content is not uploaded to a server for processing.",
  },
  {
    question: "Is CompareCode free to use?",
    answer: "Yes. All tools are free and open source. No account or subscription is required.",
  },
  {
    question: "Where are my comparisons saved?",
    answer: "Saved comparisons are stored in this browser on this device. Open History to revisit them. Clearing this site's browser data removes saved history, so export a backup if you want to keep it.",
  },
  {
    question: "Can I move my history to another browser or device?",
    answer: "Yes. Use Export history to download a backup, then import it into CompareCode in the other browser or on the other device. History does not sync automatically.",
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
        <span className={styles.eyebrow}>Good to know</span>
        <h2>Frequently asked questions</h2>
        <p>Learn how CompareCode handles your files and saves your work.</p>
        <a href={`${PROJECT_LINKS.github}/issues`} target="_blank" rel="noopener noreferrer">Report a bug or suggest a feature <Arrow /></a>
      </div>
      <FaqAccordion items={faq} />
    </section>
  );
}

function Footer() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <footer className={styles.footer}>
      <a href={PROJECT_LINKS.github} target="_blank" rel="noopener noreferrer" className={linkColors.neutral}><FaGithub className={linkIcon} aria-hidden="true" /> GitHub</a>
      <a href={PROJECT_LINKS.support} target="_blank" rel="noopener noreferrer" className={linkColors.support}><MdFavorite className={linkIcon} aria-hidden="true" /> Support the project</a>
      <a href="/licenses/third-party.txt" target="_blank" rel="noopener noreferrer" className={linkColors.neutral}>Open-source licenses</a>
      <span className={styles.version}>{version ? `Version ${version}` : "Development"}</span>
    </footer>
  );
}

function HomeWorkspace() {
  return (
    <>
      <header className={styles.modernWelcome}>
        <div>
          <span className={styles.eyebrow}>CompareCode / Free and open source</span>
          <h1>Small tools. <span className={styles.highlight}>Good work.</span></h1>
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
    <PageContent>
      <div className={`${styles.canvas} ${styles["compact-spectrum"]} ${styles.modern} ${styles.animated} ${styles.workspaceAnimated}`}>
        <HomeWorkspace />
        <Questions /><Footer />
      </div>
    </PageContent>
  );
}
