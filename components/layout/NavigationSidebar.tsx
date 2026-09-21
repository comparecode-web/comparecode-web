"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { MdArticle, MdCode, MdHistory, MdSettings, MdImage, MdHome, MdClose, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { IconButton } from "@/components/ui/IconButton";
import { ThemeSelect } from "@/components/settings/ThemeSelect";
import { cn } from "@/utils/uiHelpers";
import { useWorkspaceSidebar } from "./WorkspaceSidebarContext";
import { WORKSPACE_MEDIA } from "@/config/responsive";

const navItems = [
  { href: "/", label: "Home", icon: MdHome },
  { href: "/text", label: "Text compare", icon: MdCode },
  { href: "/image", label: "Image compare", icon: MdImage },
  { href: "/markdown", label: "Markdown preview", icon: MdArticle },
  { href: "/history", label: "History", icon: MdHistory },
  { href: "/settings", label: "Settings", icon: MdSettings }
];

export function NavigationSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { desktopExpanded, setDesktopExpanded, mobileOpen, setMobileOpen } = useWorkspaceSidebar();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mobileOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const query = window.matchMedia(WORKSPACE_MEDIA.desktopNavigation);
    const closeOnDesktop = () => { if (query.matches) setMobileOpen(false); };
    const closeOnHistoryNavigation = () => setMobileOpen(false);
    query.addEventListener("change", closeOnDesktop);
    window.addEventListener("popstate", closeOnHistoryNavigation);
    closeOnDesktop();
    return () => {
      query.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("popstate", closeOnHistoryNavigation);
      dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [mobileOpen, setMobileOpen]);

  const navigate = (href: string) => {
    setMobileOpen(false);
    if (pathname !== href) router.replace(href);
  };

  const brand = (mobile: boolean) => (
    <Link href="/" onClick={() => setMobileOpen(false)} className={cn("flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-base font-bold text-text-primary", !mobile && "hidden @min-[12rem]/navigation:flex")}>
      <Image src="/brand/comparecode-logo.png" alt="CompareCode" width={30} height={30} priority className="shrink-0 rounded-lg" />
      <span>Compare<span className="text-accent-primary">Code</span></span>
    </Link>
  );

  const footer = (mobile: boolean) => (
    <div className="mt-auto shrink-0 space-y-2 border-t border-border-default p-2" data-tool-controls>
      <a href="https://github.com/comparecode-web/comparecode-web" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex h-11 items-center gap-3 overflow-hidden rounded-lg px-3 text-sm font-semibold text-text-secondary hover:bg-hover-overlay hover:text-accent-primary">
        <FaGithub className="shrink-0 text-xl" />
        <span className={mobile ? "" : "hidden @min-[12rem]/navigation:inline"}>GitHub</span>
      </a>
      <ThemeSelect sidebar={!mobile} />
    </div>
  );

  const navigation = (mobile: boolean) => (
    <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className="flex flex-col gap-1.5 p-2" data-tool-controls>
      {navItems.map(({ href, label, icon: Icon }) => (
        <button key={href} type="button" aria-label={label} aria-current={pathname === href ? "page" : undefined} onClick={() => navigate(href)} className={cn("flex min-h-11 items-center gap-3 rounded-xl border px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent-primary", pathname === href ? "border-accent-primary/20 bg-bg-selected text-accent-primary" : "border-transparent text-text-secondary hover:bg-hover-overlay hover:text-text-primary")}>
          <Icon className="shrink-0 text-xl" />
          <span className={cn("whitespace-nowrap", !mobile && "hidden @min-[12rem]/navigation:inline")}>{label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      <aside className={cn("@container/navigation hidden shrink-0 flex-col overflow-hidden border-r border-border-default bg-bg-primary transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:flex", desktopExpanded === null ? "w-16 xl:w-60" : desktopExpanded ? "w-60" : "w-16")}>
        <div className="flex h-16 shrink-0 items-center justify-between gap-1 px-2">
          {brand(false)}
          <IconButton aria-label="Toggle navigation labels" onClick={() => setDesktopExpanded(!(desktopExpanded ?? window.matchMedia(WORKSPACE_MEDIA.expandedNavigation).matches))} className="ml-auto h-11 w-11 shrink-0 @min-[12rem]/navigation:w-8">
            {desktopExpanded === null ? <><MdChevronRight className="text-xl xl:hidden" /><MdChevronLeft className="hidden text-xl xl:block" /></> : desktopExpanded ? <MdChevronLeft className="text-xl" /> : <MdChevronRight className="text-xl" />}
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">{navigation(false)}</div>
        {footer(false)}
      </aside>
      <dialog ref={dialogRef} aria-label="Navigation" onCancel={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }} className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(88vw,20rem)] max-w-none border-r border-border-default bg-bg-primary p-0 text-text-primary shadow-xl backdrop:bg-black/40">
        <div className="flex min-h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-default px-4">{brand(true)}<IconButton aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="h-11 w-11"><MdClose className="text-xl" /></IconButton></div>
          {mobileOpen && <><div className="flex-1">{navigation(true)}</div>{footer(true)}</>}
        </div>
      </dialog>
    </>
  );
}
