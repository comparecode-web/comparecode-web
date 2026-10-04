import { StrictMode, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { DialogHeader } from "../DialogHeader";
import { Button } from "../Button";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; queueMicrotask(() => this.dispatchEvent(new Event("close"))); } });
});
afterEach(() => {
  cleanup();
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

function Example({ dismissible = true }: { dismissible?: boolean }) {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)}>Open</Button><Dialog open={open} onOpenChange={setOpen} dismissible={dismissible} aria-labelledby="title"><DialogHeader title="Example" titleId="title" onClose={() => setOpen(false)} /></Dialog></>;
}

describe("Dialog", () => {
  it("ignores a stale native close event after strict effects reopen the dialog", async () => {
    const onOpenChange = vi.fn();
    render(<StrictMode><Dialog open onOpenChange={onOpenChange} aria-label="Initially open">Content</Dialog></StrictMode>);
    await screen.findByRole("dialog", { name: "Initially open" });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
  it("synchronizes native cancellation and the close button with controlled state", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prevents native dismissal while an owner requires the dialog to stay open", async () => {
    const user = userEvent.setup();
    render(<Example dismissible={false} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const event = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), event);
    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("returns focus when a conditionally rendered dialog unmounts", async () => {
    function Conditional() {
      const [open, setOpen] = useState(false);
      return <><Button onClick={() => setOpen(true)}>Open conditional</Button>{open && <Dialog open onOpenChange={setOpen} aria-label="Conditional"><Button onClick={() => setOpen(false)}>Finish</Button></Dialog>}</>;
    }
    const user = userEvent.setup();
    render(<Conditional />);
    const trigger = screen.getByRole("button", { name: "Open conditional" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(trigger).toHaveFocus();
  });
});
