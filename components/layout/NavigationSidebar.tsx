"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { MdArticle, MdCode, MdHistory, MdSettings, MdImage, MdHome, MdClose, MdChevronLeft, MdChevronRight, MdQrCode2 } from "react-icons/md";
import { IconButton } from "@/components/ui/IconButton";
import { ThemeSelect } from "@/components/settings/ThemeSelect";
import { cn } from "@/utils/uiHelpers";
import { useWorkspaceSidebar } from "./WorkspaceSidebarContext";
import { WORKSPACE_MEDIA } from "@/config/responsive";
import { SITE_ICON_PATH } from "@/config/seo";

const navItems = [
  { href: "/", label: "Home", icon: MdHome },
  { href: "/text", label: "Text compare", icon: MdCode },
  { href: "/image", label: "Image compare", icon: MdImage },
  { href: "/markdown", label: "Markdown preview", icon: MdArticle },
  { href: "/qr", label: "QR code generator", icon: MdQrCode2 },
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
    <span className={cn("flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-base font-bold text-text-primary", !mobile && "hidden @min-[12rem]/navigation:flex")}>
      <Image src={SITE_ICON_PATH} alt="CompareCode" width={30} height={30} priority className="shrink-0 rounded-lg" />
      <span>Compare<span className="text-accent-primary">Code</span></span>
    </span>
  );

  const footer = (mobile: boolean) => (
    <div className="mt-auto shrink-0 space-y-1 border-t border-border-default p-2" data-tool-controls>
      <ThemeSelect sidebar={!mobile} showIcon />
      <a href="https://github.com/comparecode-web/comparecode-web" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex h-10 items-center overflow-hidden rounded-lg border border-transparent text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-hover-overlay hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-primary">
        <span className="flex h-10 w-9 shrink-0 items-center justify-center"><FaGithub className="text-xl" /></span>
        <span className={mobile ? "" : "hidden @min-[12rem]/navigation:inline"}>GitHub</span>
      </a>
    </div>
  );

  const navigation = (mobile: boolean) => (
    <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className="flex flex-col gap-1 p-2" data-tool-controls>
      {navItems.map(({ href, label, icon: Icon }) => (
        <button key={href} type="button" aria-label={label} aria-current={pathname === href ? "page" : undefined} onClick={() => navigate(href)} className={cn("flex h-10 items-center overflow-hidden rounded-lg border text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent-primary", pathname === href ? "border-accent-primary/20 bg-bg-selected text-accent-primary" : "border-transparent text-text-secondary hover:bg-hover-overlay hover:text-text-primary")}>
          <span className="flex h-10 w-9 shrink-0 items-center justify-center"><Icon className="text-2xl" /></span>
          <span className={cn("whitespace-nowrap", !mobile && "hidden @min-[12rem]/navigation:inline")}>{label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      <aside className={cn("@container/navigation hidden shrink-0 flex-col overflow-hidden border-r border-border-default bg-bg-primary transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:flex", desktopExpanded === null ? "w-14 xl:w-52" : desktopExpanded ? "w-52" : "w-14")}>
        <div className="flex h-14 shrink-0 items-center px-2">
          <Link href="/" className="min-w-0 flex-1 rounded-lg focus-visible:outline-2 focus-visible:outline-accent-primary @max-[12rem]/navigation:hidden" aria-label="CompareCode home">
            {brand(false)}
          </Link>
          <IconButton aria-label="Toggle navigation labels" onClick={() => setDesktopExpanded(!(desktopExpanded ?? window.matchMedia(WORKSPACE_MEDIA.expandedNavigation).matches))} className="ml-auto size-10">
              {desktopExpanded === null ? <><MdChevronRight className="size-5 shrink-0 xl:hidden" /><MdChevronLeft className="hidden size-5 shrink-0 xl:block" /></> : desktopExpanded ? <MdChevronLeft className="size-5 shrink-0" /> : <MdChevronRight className="size-5 shrink-0" />}
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">{navigation(false)}</div>
        {footer(false)}
      </aside>
      <dialog ref={dialogRef} aria-label="Navigation" onCancel={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }} className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(88vw,20rem)] max-w-none border-r border-border-default bg-bg-primary p-0 text-text-primary shadow-xl backdrop:bg-black/40">
        <div className="flex min-h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-default px-4"><Link href="/" onClick={() => setMobileOpen(false)}>{brand(true)}</Link><IconButton size="lg" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><MdClose /></IconButton></div>
          {mobileOpen && <><div className="flex-1">{navigation(true)}</div>{footer(true)}</>}
        </div>
      </dialog>
    </>
  );
}
