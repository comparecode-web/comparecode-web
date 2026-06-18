import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastViewport } from "@/components/layout/ToastViewport";
import { useToastStore } from "@/store/useToastStore";

function resetToastStore() {
  useToastStore.setState({
    activeToasts: [],
    queuedToasts: []
  });
}

describe("ToastViewport", () => {
  beforeEach(() => {
    resetToastStore();
    vi.useRealTimers();
  });

  it("renders a dismissible icon toast and closes it from the X button", async () => {
    const user = userEvent.setup();
    useToastStore.getState().pushToast({
      message: "Information saved.",
      tone: "info",
      durationMs: null,
      icon: "info",
      isDismissible: true
    });

    render(<ToastViewport />);

    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("pointer-events-auto");
    expect(toast).toHaveClass("border-info-border", "bg-info-bg");
    expect(toast.querySelector("svg")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps durationMs null toasts visible until dismissed", () => {
    vi.useFakeTimers();
    useToastStore.getState().pushToast({
      message: "Persistent",
      durationMs: null,
      isDismissible: true
    });

    render(<ToastViewport />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("Persistent")).toBeInTheDocument();
  });

  it("auto-dismisses timed toasts", () => {
    vi.useFakeTimers();
    useToastStore.getState().pushToast({
      message: "Timed",
      durationMs: 500
    });

    render(<ToastViewport />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText("Timed")).not.toBeInTheDocument();
  });
});
