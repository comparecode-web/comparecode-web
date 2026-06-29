"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MdArticle, MdCode, MdHistory, MdSettings, MdImage, MdHome } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { RiSideBarFill, RiSideBarLine } from "react-icons/ri";
import { useWorkspaceSidebar } from "@/components/layout/WorkspaceSidebarContext";
import { cn } from "@/utils/uiHelpers";

export function MainNavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebar } = useWorkspaceSidebar();
  const SidebarIcon = sidebar?.isOpen ? RiSideBarFill : RiSideBarLine;

  const navItems = [
    { href: "/", label: "Home", icon: MdHome },
    { href: "/text", label: "Text compare", icon: MdCode },
    { href: "/image", label: "Image compare", icon: MdImage },
    { href: "/markdown", label: "Markdown preview", icon: MdArticle },
    { href: "/history", label: "History", icon: MdHistory },
    { href: "/settings", label: "Settings", icon: MdSettings }
  ];

  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const indicatorReadyFrameRef = useRef<number | null>(null);
  const [isIndicatorReady, setIsIndicatorReady] = useState(false);

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
    indicator.style.left = `${rect.left - navRect.left + nav.scrollLeft}px`;
    indicator.style.width = `${rect.width}px`;
    indicator.style.opacity = "1";
  }, [pathname]);

  useLayoutEffect(() => {
    const nav = navRef.current;

    updateIndicator();

    if (!isIndicatorReady && indicatorReadyFrameRef.current === null) {
      indicatorReadyFrameRef.current = window.requestAnimationFrame(() => {
        indicatorReadyFrameRef.current = null;
        setIsIndicatorReady(true);
      });
    }

    window.addEventListener("resize", updateIndicator);
    nav?.addEventListener("scroll", updateIndicator);
    return () => {
      if (indicatorReadyFrameRef.current !== null) {
        window.cancelAnimationFrame(indicatorReadyFrameRef.current);
        indicatorReadyFrameRef.current = null;
      }
      window.removeEventListener("resize", updateIndicator);
      nav?.removeEventListener("scroll", updateIndicator);
    };
  }, [isIndicatorReady, updateIndicator]);

  const navigateTo = (href: string) => {
    if (pathname === href) {
      return;
    }

    // Tabs use replace so browser history does not get noisy while switching sections.
    router.replace(href);
  };

  return (
    <header className="relative z-50 flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b border-border-default bg-bg-primary px-2 sm:px-6">
      <div className="flex h-full min-w-0 flex-1 items-center gap-2 sm:gap-8">
        {sidebar && (
          <button
            type="button"
            onClick={sidebar.toggleSidebar}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-hover-overlay hover:text-text-primary sm:hidden",
              sidebar.isOpen && "bg-hover-overlay text-accent-primary"
            )}
            aria-label={sidebar.isOpen ? "Close sidebar" : "Open sidebar"}
            data-tooltip={sidebar.isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <SidebarIcon className="text-xl" />
          </button>
        )}
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md p-1 sm:gap-3 hover:bg-hover-overlay">
          <Image
            src="/brand/comparecode-logo.png"
            alt="CompareCode"
            width={36}
            height={36}
            className="rounded-sm"
            priority
          />
          <h1 className="hidden bg-linear-to-r from-text-primary to-accent-primary bg-clip-text text-sm font-bold text-transparent sm:block sm:text-lg">CompareCode</h1>
        </Link>
        <nav ref={navRef} className="hide-scrollbar relative flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden sm:flex-none sm:overflow-visible sm:gap-2">
          <div
            ref={indicatorRef}
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 z-0 h-8 -translate-y-1/2 rounded-md bg-accent-primary shadow-sm ease-[cubic-bezier(0.16,1,0.3,1)]",
              isIndicatorReady ? "transition-all duration-(--duration-medium)" : "transition-none"
            )}
            style={{ left: 0, width: 0, opacity: 0 }}
          />
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isActiveIndicatorVisible = isActive && isIndicatorReady;
            return (
              <button
                key={href}
                ref={(el) => {
                  itemRefs.current[href] = el;
                }}
                type="button"
                aria-label={label}
                onClick={() => navigateTo(href)}
                className={cn(
                  "group relative z-10 flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold outline-none transition-colors duration-(--duration-medium) active:scale-95 max-[360px]:px-2",
                  isActiveIndicatorVisible
                    ? "text-white"
                    : isActive
                      ? "text-accent-primary bg-hover-overlay"
                      : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
              >
                <Icon
                  className={cn(
                    "text-lg transition-transform duration-(--duration-medium) ease-out group-hover:scale-110",
                    isActiveIndicatorVisible ? "text-white" : isActive ? "text-accent-primary" : "text-text-secondary"
                  )}
                />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex h-full shrink-0 items-center">
        <a
          href="https://github.com/comparecode-web/comparecode-web"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded px-2 py-1.5 text-sm font-semibold text-text-secondary transition-all duration-(--duration-medium) hover:bg-hover-overlay hover:text-accent-primary min-[360px]:flex sm:px-4"
          title="GitHub"
        >
          <FaGithub className="text-xl" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
