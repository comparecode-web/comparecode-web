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

function ShellHarness() {
  const [isOpen, setIsOpen] = useState(true);
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
        { value: "history", title: "History", icon: MdHistory, content: <div>History content</div> }
      ]}
    >
      <div>Main content</div>
      <div>Quick action count: {quickActionCount}</div>
    </ToolWorkspaceShell>
  );
}

describe("ToolWorkspaceShell", () => {
  it("switches panel tabs and keeps main content visible", async () => {
    const user = userEvent.setup();
    render(<ShellHarness />);

    expect(screen.getAllByText("Options content")[0]).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "History" })[0]);

    expect(screen.getAllByText("History content")[0]).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("runs quick actions from the collapsed rail", async () => {
    const user = userEvent.setup();
    render(<ShellHarness />);

    await user.click(screen.getAllByRole("button", { name: "Close sidebar" })[0]);
    await user.click(screen.getByRole("button", { name: "Layout: Split - switch to Unified" }));

    expect(screen.getByText("Quick action count: 1")).toBeInTheDocument();
  });
});
