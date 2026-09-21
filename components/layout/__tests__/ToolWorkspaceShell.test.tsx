import { useState } from "react";
import { MdCode, MdHistory, MdTune } from "react-icons/md";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolWorkspaceShell } from "@/components/layout/ToolWorkspaceShell";

vi.mock("next/image", () => ({
  default: () => null
}));

type TabValue = "options" | "history";

function ShellHarness({ initiallyOpen = true }: { initiallyOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [tab, setTab] = useState<TabValue>("options");
  const [quickActionCount, setQuickActionCount] = useState(0);

  return (
    <ToolWorkspaceShell
      isPanelOpen={isOpen}
      onPanelOpenChange={setIsOpen}
      activePanelTab={tab}
      onPanelTabChange={setTab}
      quickActions={[
        {
          id: "layout",
          title: "Layout: Split - switch to Unified",
          label: "Layout: Split",
          icon: MdCode,
          onClick: () => setQuickActionCount((count) => count + 1),
          isActive: true
        }
      ]}
      toolTitle="Text compare"
      toolIcon={MdCode}
      tabs={[
        { value: "options", title: "Options", icon: MdTune, content: <div>Options content</div> },
        { value: "history", title: "History", placement: "right", icon: MdHistory, content: <div>History content</div> }
      ]}
    >
      <div>Main content</div>
      <input aria-label="Editor content" defaultValue="Preserved text" />
      <div>Quick action count: {quickActionCount}</div>
    </ToolWorkspaceShell>
  );
}

describe("ToolWorkspaceShell", () => {
  it("reveals options only on request and closes them with Escape", async () => {
    const user = userEvent.setup();
    render(<ShellHarness initiallyOpen={false} />);
    const editor = screen.getByRole("textbox");
    expect(screen.getByText("Options content").closest("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
    const toggle = screen.getByRole("button", { name: "Options" });
    await user.click(toggle);
    expect(screen.getByText("Options content")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
    expect(screen.getByRole("textbox")).toBe(editor);
  });
  it("switches panel tabs and keeps main content visible", async () => {
    const user = userEvent.setup();
    render(<ShellHarness />);

    expect(screen.getAllByText("Options content")[0]).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "History" })[0]);

    expect(screen.getAllByText("History content")[0]).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "History" })).toBeVisible();
    expect(screen.getByText("Options content").closest("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Main content")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close history" }));
    expect(screen.queryByRole("complementary", { name: "History" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "History" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "History" }));
    await user.click(screen.getByRole("textbox", { name: "Editor content" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("complementary", { name: "History" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "History" })).toHaveFocus();
  });

  it("runs quick actions with details closed without remounting the editor", async () => {
    const user = userEvent.setup();
    render(<ShellHarness />);

    const editor = screen.getByRole("textbox", { name: "Editor content" });
    await user.type(editor, " edited");
    await user.click(screen.getByRole("button", { name: "Options" }));
    expect(screen.getByText("Options content").closest("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
    await user.click(screen.getByRole("button", { name: "Layout: Split - switch to Unified" }));

    expect(screen.getByText("Quick action count: 1")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBe(editor);
    expect(editor).toHaveValue("Preserved text edited");
    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("History content")).toBeVisible();
  });
});
