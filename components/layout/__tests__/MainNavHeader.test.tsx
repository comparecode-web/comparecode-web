import userEvent from "@testing-library/user-event";
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

  it("retains all six routes and replace navigation when labels are collapsed", async () => {
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getAllByRole("button")).toHaveLength(6);
    expect(within(nav).getByRole("button", { name: "Text compare" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Toggle navigation labels" }));
    await user.click(within(nav).getByRole("button", { name: "History" }));
    expect(navigation.replace).toHaveBeenCalledWith("/history");
    expect(nav.closest("aside")?.querySelector("[title], [data-tooltip]")).toBeNull();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/comparecode-web/comparecode-web");
    expect(screen.getByRole("link", { name: "GitHub" }).closest("aside")).toContainElement(screen.getByRole("button", { name: /^Theme:/ }));
  });

  it("opens mobile navigation on any route and closes after a destination is selected", async () => {
    navigation.pathname = "/settings";
    const user = userEvent.setup();
    render(<WorkspaceNavigation />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    await user.click(within(dialog).getByRole("button", { name: "Image compare" }));
    expect(navigation.replace).toHaveBeenCalledWith("/image");
    expect(dialog).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
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
