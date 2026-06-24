import { useState } from "react";
import { MdHistory, MdTune } from "react-icons/md";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolWorkspaceShell } from "@/components/layout/ToolWorkspaceShell";

type TabValue = "options" | "history";

function ShellHarness() {
  const [isOpen, setIsOpen] = useState(true);
  const [tab, setTab] = useState<TabValue>("options");

  return (
    <ToolWorkspaceShell
      isPanelOpen={isOpen}
      onPanelOpenChange={setIsOpen}
      activePanelTab={tab}
      onPanelTabChange={setTab}
      tabs={[
        { value: "options", title: "Options", icon: MdTune, content: <div>Options content</div> },
        { value: "history", title: "History", icon: MdHistory, content: <div>History content</div> }
      ]}
    >
      <div>Main content</div>
    </ToolWorkspaceShell>
  );
}

describe("ToolWorkspaceShell", () => {
  it("switches panel tabs and keeps main content visible", async () => {
    const user = userEvent.setup();
    render(<ShellHarness />);

    expect(screen.getByText("Options content")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "History" }));

    expect(screen.getByText("History content")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });
});
