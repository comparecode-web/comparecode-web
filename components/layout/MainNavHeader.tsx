"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MdCode, MdHistory, MdSettings, MdImage, MdHome } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { cn } from "@/utils/uiHelpers";

export function MainNavHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/", label: "Home", icon: MdHome },
    { href: "/text", label: "Text", icon: MdCode },
    { href: "/image", label: "Image", icon: MdImage },
    { href: "/history", label: "History", icon: MdHistory },
    { href: "/settings", label: "Settings", icon: MdSettings }
  ];

  const navigateTo = (href: string) => {
    if (pathname === href) {
      return;
    }

    // Tabs use replace so browser history does not get noisy while switching sections.
    router.replace(href);
  };

  return (
    <header className="relative z-50 flex h-(--header-height) shrink-0 items-center justify-between border-b border-border-default bg-bg-primary px-3 sm:px-6">
      <div className="flex h-full items-center gap-3 sm:gap-8">
        <Link href="/" className="flex items-center gap-2 rounded-md p-1 sm:gap-3 hover:bg-hover-overlay" title="Welcome">
          <Image
            src="/brand/comparecode-logo.png"
            alt="CompareCode"
            width={36}
            height={36}
            className="rounded-sm"
            priority
          />
          <h1 className="text-sm font-bold text-text-primary sm:text-lg">CompareCode</h1>
        </Link>
        <nav className="flex h-full items-center gap-1 sm:gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                type="button"
                onClick={() => navigateTo(href)}
                className={cn(
                  "relative z-10 flex items-center gap-2 overflow-hidden rounded-md px-3 py-1.5 text-sm font-semibold outline-none transition-colors duration-(--duration-medium)",
                  isActive ? "text-white" : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
                title={label}
              >
                <div
                  className={cn(
                    "absolute inset-0 -z-10 rounded-md bg-accent-primary transition-all duration-(--duration-medium) ease-out",
                    isActive ? "scale-100 opacity-100" : "scale-75 opacity-0"
                  )}
                />
                <Icon className={cn("text-lg transition-colors duration-(--duration-medium)", isActive ? "text-white" : "text-text-secondary")} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex h-full items-center">
        <a
          href="https://github.com/comparecode-web/comparecode-web"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-semibold text-text-secondary transition-all duration-(--duration-medium) hover:bg-hover-overlay hover:text-accent-primary sm:px-4"
          title="GitHub"
        >
          <FaGithub className="text-xl" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
