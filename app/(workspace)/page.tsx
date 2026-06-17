import Image from "next/image";
import Link from "next/link";
import { MdCode, MdImage, MdHistory, MdSettings, MdArrowOutward } from "react-icons/md";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeSeoContent } from "@/components/seo/SeoContent";
import { homeMetadata, softwareApplicationJsonLd } from "@/config/seo";

export const metadata = homeMetadata;

const QUICK_LINKS = [
  {
    href: "/text",
    title: "Text comparison",
    description: "Compare and edit text diffs",
    icon: MdCode,
  },
  {
    href: "/image",
    title: "Image comparison",
    description: "Analyze differences between images",
    icon: MdImage,
  },
  {
    href: "/history",
    title: "History",
    description: "Restore recent comparisons",
    icon: MdHistory,
  },
  {
    href: "/settings",
    title: "Customization",
    description: "Adjust appearance and behavior",
    icon: MdSettings,
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-auto bg-bg-secondary custom-scrollbar">
      <JsonLd data={softwareApplicationJsonLd} />
      <section className="relative flex min-h-[calc(100dvh-var(--header-height))] w-full shrink-0 items-center justify-center bg-linear-to-br from-accent-primary/16 via-transparent to-accent-primary/8 px-4 py-8 sm:px-6">
        <div className="cc-animate-scale-in relative w-full max-w-5xl rounded-2xl border border-border-default bg-bg-primary/95 p-5 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="mb-7 border-b border-border-default pb-6 sm:mb-8">
            <div className="cc-animate-fade-in-up inline-flex items-center gap-3 p-1.5">
              <Image
                src="/brand/comparecode-logo.png"
                alt="CompareCode"
                width={64}
                height={64}
                className="rounded"
                priority
              />
              <div>
                <h1 className="w-fit bg-linear-to-r from-text-primary to-accent-primary bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                  CompareCode
                </h1>
                <p className="text-sm text-text-secondary sm:text-base">
                  Free and open-source diff checking tool for code, text, and images.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {QUICK_LINKS.map(({ href, title, description, icon: Icon }, index) => (
              <Link
                key={href}
                href={href}
                style={{ animationDelay: `${120 + index * 90}ms` }}
                className="group cc-animate-fade-in-up relative flex min-h-38 flex-col justify-between overflow-hidden rounded-xl border border-border-default bg-bg-secondary p-4 transition-all duration-(--duration-medium) hover:-translate-y-1 hover:border-accent-primary hover:shadow-lg"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-accent-primary opacity-0 blur-2xl transition-opacity duration-(--duration-medium) group-hover:opacity-[0.12]"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold text-text-primary sm:text-lg">{title}</h2>
                  <span className="rounded-md border border-border-default bg-bg-primary p-2 text-text-secondary transition-all duration-(--duration-medium) group-hover:scale-110 group-hover:border-accent-primary group-hover:text-accent-primary">
                    <Icon className="text-xl" />
                  </span>
                </div>
                <div className="relative flex items-end justify-between gap-3">
                  <p className="text-sm text-text-secondary">{description}</p>
                  <MdArrowOutward className="shrink-0 text-lg text-text-secondary opacity-0 transition-all duration-(--duration-medium) group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-primary group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <HomeSeoContent />
    </div>
  );
}
