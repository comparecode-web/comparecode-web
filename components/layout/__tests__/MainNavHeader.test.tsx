import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MainNavHeader } from "@/components/layout/MainNavHeader";
import { NavigationSidebar } from "@/components/layout/NavigationSidebar";
import { WorkspaceSidebarProvider } from "@/components/layout/WorkspaceSidebarContext";
import { useSettingsStore } from "@/store/useSettingsStore";
import { defaultSettings } from "@/config/defaults";

const navigation = vi.hoisted(() => ({ pathname: "/text", replace: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname, useRouter: () => ({ replace: navigation.replace }) }));
vi.mock("next/image", () => ({ default: () => null }));

function WorkspaceNavigation() {
  return <WorkspaceSidebarProvider><MainNavHeader /><NavigationSidebar /></WorkspaceSidebarProvider>;
}

describe("Workspace navigation", () => {
  beforeEach(() => {
    navigation.pathname = "/text";
    navigation.replace.mockReset();
    useSettingsStore.setState({ settings: { ...defaultSettings }, isLoaded: true });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  });

  it("retains all seven routes and replace navigation when labels are collapsed", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getAllByRole("button")).toHaveLength(7);
    expect(within(nav).getByRole("button", { name: "QR code generator" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Text compare" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Toggle navigation labels" }));
    await user.click(within(nav).getByRole("button", { name: "History" }));
    expect(navigation.replace).toHaveBeenCalledWith("/history");
    expect(nav.closest("aside")?.querySelector("[title], [data-tooltip]")).toBeNull();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/comparecode-web/comparecode-web");
    expect(screen.getByRole("link", { name: "GitHub" }).closest("aside")).toContainElement(screen.getByRole("button", { name: /^Theme:/ }));
  });

  it("keeps the home link and label toggle independent", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    const toggle = screen.getByRole("button", { name: "Toggle navigation labels" });
    await user.click(toggle);
    expect(toggle.closest("aside")).toHaveClass("w-52");
    const brand = screen.getByRole("link", { name: "CompareCode home" });
    expect(brand).toHaveAttribute("href", "/");
    expect(toggle).not.toContainElement(brand);
    await user.click(toggle);
    expect(toggle.closest("aside")).toHaveClass("w-14");
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("offers labelled project links and opens their destinations separately", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    const github = screen.getByRole("link", { name: "GitHub" });
    const support = screen.getByRole("link", { name: "Support the project" });
    expect(support).toHaveAttribute("href", "https://ko-fi.com/gabrieltm");
    expect(github.parentElement).toBe(support.parentElement);
    for (const link of [github, support]) {
      expect(link.textContent).toBe(link.getAttribute("aria-label"));
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).not.toHaveAttribute("title");
    }

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    expect(within(dialog).getByRole("link", { name: "GitHub" })).toHaveTextContent("GitHub");
    expect(within(dialog).getByRole("link", { name: "Support the project" })).toHaveAttribute("href", support.getAttribute("href"));
  });

  it("keeps mobile navigation open until the destination commits and stays closed on return", async () => {
    navigation.pathname = "/settings";
    const user = userEvent.setup();
    const { rerender } = render(<WorkspaceNavigation />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    await user.click(within(dialog).getByRole("button", { name: "Image compare" }));
    expect(navigation.replace).toHaveBeenCalledWith("/image");
    expect(dialog).toHaveAttribute("open");

    navigation.pathname = "/image";
    rerender(<WorkspaceNavigation />);
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();

    navigation.pathname = "/settings";
    rerender(<WorkspaceNavigation />);
    expect(dialog).not.toHaveAttribute("open");
    await user.click(trigger);
    expect(dialog).toHaveAttribute("open");
  });

  it("closes immediately when the current destination is selected", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Text compare" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it.each(["close button", "Escape", "backdrop"])("allows %s dismissal while navigation is outstanding", async (method) => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Settings" }));
    expect(dialog).toHaveAttribute("open");
    if (method === "close button") await user.click(within(dialog).getByRole("button", { name: "Close navigation" }));
    else if (method === "Escape") fireEvent(dialog, new Event("cancel", { cancelable: true }));
    else fireEvent.click(dialog);
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
  });

  it("waits for the committed route after browser history navigation", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<WorkspaceNavigation />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.popState(window);
    expect(dialog).toHaveAttribute("open");
    navigation.pathname = "/history";
    rerender(<WorkspaceNavigation />);
    expect(dialog).not.toHaveAttribute("open");
  });

  it("ignores a queued native close event after the drawer has reopened", async () => {
    const user = userEvent.setup();
    render(<StrictMode><WorkspaceNavigation /></StrictMode>);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Close navigation" }));
    await user.click(trigger);
    fireEvent(dialog, new Event("close"));
    expect(dialog).toHaveAttribute("open");
  });

  it("handles native dialog cancellation and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    fireEvent(screen.getByRole("dialog"), new Event("cancel"));
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers all existing themes from the sidebar footer", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    await user.click(screen.getByRole("button", { name: /^Theme:/ }));
    expect(screen.getAllByRole("option")).toHaveLength(7);
    await user.click(screen.getByRole("option", { name: "Nord" }));
    expect(useSettingsStore.getState().settings.theme).toBe("nord");
  });

  it("keeps mobile navigation open when its theme popup handles Escape", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = screen.getByRole("dialog");
    const trigger = within(dialog).getByRole("button", { name: /^Theme:/ });
    await user.click(trigger);
    expect(dialog).toContainElement(screen.getByRole("listbox"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(dialog).toHaveAttribute("open");
    expect(trigger).toHaveFocus();
  });
});
