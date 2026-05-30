import Image from "next/image";
import Link from "next/link";
import { MdCode, MdImage, MdHistory, MdSettings } from "react-icons/md";
import { Header } from "@/components/layout/Header";

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
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-gray-50">
      <Header />
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-bg-secondary px-4 py-8 sm:px-6">
        <div className="w-full max-w-5xl rounded-2xl border border-border-default bg-bg-primary p-5 shadow-lg sm:p-8">
          <div className="mb-7 border-b border-border-default pb-6 sm:mb-8">
            <Link href="/" className="inline-flex items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-hover-overlay">
              <Image
                src="/brand/comparecode-logo.png"
                alt="CompareCode"
                width={56}
                height={56}
                className="rounded"
                priority
              />
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary sm:text-3xl">CompareCode</h1>
                <p className="text-sm lowercase text-text-secondary sm:text-base">
                  free and open-source diff checking tool, crafted with care and love.
                </p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {QUICK_LINKS.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-h-38 flex-col justify-between rounded-xl border border-border-default bg-bg-secondary p-4 transition-all duration-(--duration-medium) hover:-translate-y-0.5 hover:border-accent-primary hover:bg-hover-overlay"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold text-text-primary sm:text-lg">{title}</h2>
                  <span className="rounded-md border border-border-default bg-bg-primary p-2 text-text-secondary transition-colors group-hover:text-accent-primary">
                    <Icon className="text-xl" />
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}