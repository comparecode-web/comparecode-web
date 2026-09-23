import Image from "next/image";
import Link from "next/link";
import { MdArticle, MdCode, MdImage, MdHistory, MdSettings, MdArrowOutward, MdQrCode2 } from "react-icons/md";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeSeoContent } from "@/components/seo/SeoContent";
import { homeMetadata, SITE_ICON_PATH, softwareApplicationJsonLd } from "@/config/seo";

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
    href: "/markdown",
    title: "Markdown preview",
    description: "Edit Markdown with live preview",
    icon: MdArticle,
  },
  {
    href: "/qr",
    title: "QR code generator",
    description: "Create codes locally in your browser",
    icon: MdQrCode2,
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
      <section className="relative flex min-h-full w-full shrink-0 items-center justify-center bg-linear-to-br from-accent-primary/16 via-transparent to-accent-primary/8 px-4 py-8 sm:px-6">
        <div className="cc-animate-fade-in relative w-full max-w-5xl rounded-xl border border-border-default bg-bg-primary/95 p-4 shadow-xl backdrop-blur-sm sm:rounded-2xl sm:p-8">
          <div className="mb-5 border-b border-border-default pb-5 sm:mb-8 sm:pb-6">
            <div className="cc-animate-fade-in-up flex min-w-0 flex-col items-start gap-3 p-1 sm:inline-flex sm:flex-row sm:items-center sm:p-1.5">
              <Image
                src={SITE_ICON_PATH}
                alt="CompareCode"
                width={64}
                height={64}
                className="h-12 w-12 shrink-0 rounded sm:h-16 sm:w-16"
                priority
              />
              <div className="min-w-0">
                <h1 className="bg-linear-to-r from-text-primary to-accent-primary bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                  CompareCode
                </h1>
                <p className="text-sm text-text-secondary sm:text-base">
                  Free and open-source tools for comparing files, previewing Markdown, and creating QR codes.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {QUICK_LINKS.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group relative flex min-h-28 flex-col justify-between overflow-hidden rounded-xl border border-border-default bg-bg-secondary p-3 transition-[border-color,box-shadow] duration-(--duration-medium) hover:border-accent-primary hover:shadow-lg sm:min-h-38 sm:p-4"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-accent-primary opacity-0 blur-2xl transition-opacity duration-(--duration-medium) sm:group-hover:opacity-[0.12]"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold text-text-primary sm:text-lg">{title}</h2>
                  <span className="rounded-md border border-border-default bg-bg-primary p-2 text-text-primary transition-colors duration-(--duration-medium) group-hover:border-accent-primary group-hover:text-accent-primary">
                    <Icon className="text-2xl" />
                  </span>
                </div>
                <div className="relative flex items-end justify-between gap-3">
                  <p className="text-sm text-text-secondary">{description}</p>
                  <MdArrowOutward className="shrink-0 text-lg text-text-secondary opacity-0 transition-all duration-(--duration-medium) group-hover:text-accent-primary sm:group-hover:-translate-y-0.5 sm:group-hover:translate-x-0.5 sm:group-hover:opacity-100" />
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
