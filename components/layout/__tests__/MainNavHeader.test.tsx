import { useEffect } from "react";
import { MdCode } from "react-icons/md";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MainNavHeader } from "@/components/layout/MainNavHeader";
import { useWorkspaceSidebar, WorkspaceSidebarProvider } from "@/components/layout/WorkspaceSidebarContext";

const navigationMock = vi.hoisted(() => ({
  pathname: "/text",
  replace: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({
    replace: navigationMock.replace
  })
}));

vi.mock("next/image", () => ({
  default: () => null
}));

function HeaderWithSidebarRegistration() {
  const { registerSidebar } = useWorkspaceSidebar();

  useEffect(() => {
    return registerSidebar({
      id: "test-sidebar",
      title: "Text compare",
      icon: MdCode,
      isOpen: false,
      toggleSidebar: vi.fn()
    });
  }, [registerSidebar]);

  return <MainNavHeader />;
}

describe("MainNavHeader", () => {
  let frameCallback: FrameRequestCallback | null;

  beforeEach(() => {
    navigationMock.pathname = "/text";
    navigationMock.replace = vi.fn();
    frameCallback = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frameCallback = callback;
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  it("positions the active tab indicator without animation on first load", () => {
    const { container } = render(<MainNavHeader />);
    const indicator = container.querySelector("nav > div[aria-hidden='true']");

    expect(indicator).toHaveClass("transition-none");
  });

  it("enables tab indicator animation after the initial position is applied", () => {
    const { container } = render(<MainNavHeader />);
    const indicator = container.querySelector("nav > div[aria-hidden='true']");

    act(() => {
      frameCallback?.(0);
    });

    expect(indicator).toHaveClass("transition-all");
  });

  it("does not use native titles for nav tab tooltips", () => {
    render(<MainNavHeader />);

    const textTab = screen.getByRole("button", { name: "Text compare" });
    expect(textTab).toHaveAttribute("aria-label", "Text compare");
    expect(textTab).not.toHaveAttribute("title");
  });

  it("hides the GitHub shortcut on ultra narrow mobile layouts", () => {
    render(<MainNavHeader />);

    expect(screen.getByTitle("GitHub")).toHaveClass("hidden", "min-[360px]:flex");
  });

  it("shows a mobile sidebar button when a workspace sidebar is registered", async () => {
    render(
      <WorkspaceSidebarProvider>
        <HeaderWithSidebarRegistration />
      </WorkspaceSidebarProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open sidebar" })).toBeInTheDocument();
    });
  });
});
