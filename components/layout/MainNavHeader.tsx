"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef } from "react";
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

  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    const activeEl = itemRefs.current[pathname];

    if (!indicator) {
      return;
    }

    if (!nav || !activeEl) {
      indicator.style.opacity = "0";
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const rect = activeEl.getBoundingClientRect();
    indicator.style.left = `${rect.left - navRect.left}px`;
    indicator.style.width = `${rect.width}px`;
    indicator.style.opacity = "1";
  }, [pathname]);

  useLayoutEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

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
          <h1 className="bg-linear-to-r from-text-primary to-accent-primary bg-clip-text text-sm font-bold text-transparent sm:text-lg">CompareCode</h1>
        </Link>
        <nav ref={navRef} className="relative flex h-full items-center gap-1 sm:gap-2">
          <div
            ref={indicatorRef}
            aria-hidden
            className="pointer-events-none absolute top-1/2 z-0 h-8 -translate-y-1/2 rounded-md bg-accent-primary shadow-sm ease-[cubic-bezier(0.16,1,0.3,1)] transition-all duration-(--duration-medium)"
            style={{ left: 0, width: 0, opacity: 0 }}
          />
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                ref={(el) => {
                  itemRefs.current[href] = el;
                }}
                type="button"
                onClick={() => navigateTo(href)}
                className={cn(
                  "group relative z-10 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold outline-none transition-colors duration-(--duration-medium) active:scale-95",
                  isActive ? "text-white" : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
                title={label}
              >
                <Icon
                  className={cn(
                    "text-lg transition-transform duration-(--duration-medium) ease-out group-hover:scale-110",
                    isActive ? "text-white" : "text-text-secondary"
                  )}
                />
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
