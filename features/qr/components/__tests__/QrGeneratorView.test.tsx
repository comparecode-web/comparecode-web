import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/store/useToastStore";
import { QrGeneratorView } from "../QrGeneratorView";

const scanner = vi.hoisted(() => ({
  texts: ["https://example.com/page"] as string[],
  scanQrImage: vi.fn(),
  disposeQrScanner: vi.fn()
}));

vi.mock("../../services/qrScanner", () => ({
  QrScanError: class QrScanError extends Error {},
  loadScanImage: vi.fn(async () => ({})),
  scanQrImage: scanner.scanQrImage,
  disposeQrScanner: scanner.disposeQrScanner
}));

vi.mock("next/image", () => ({ default: ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => createElement("img", { src, alt, width, height }) }));

describe("QR code generator", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });

  it("starts with a CompareCode QR preview and resets each content type to its default", async () => {
    const user = userEvent.setup();
    render(<QrGeneratorView />);
    expect(screen.getByRole("textbox", { name: "Website URL" })).toHaveValue("https://www.comparecodeweb.com/");
    for (const name of ["Website", "Text", "Wi-Fi"]) expect(screen.getByRole("radio", { name })).toBeInTheDocument();
    const preview = screen.getByRole("img", { name: "url QR code preview" });
    expect(preview).toHaveAttribute("src", expect.stringContaining("data:image/svg+xml"));
    expect(preview).toHaveAttribute("width", "512");
    expect(screen.getByText("1024 × 1024 px")).toBeInTheDocument();
    expect(screen.getAllByText("Medium 15%")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
    await user.click(screen.getByRole("radio", { name: "Wi-Fi" }));
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Network name (SSID)" })).toHaveValue("");
    await user.click(screen.getByRole("radio", { name: "Website" }));
    expect(screen.getByRole("textbox", { name: "Website URL" })).toHaveValue("https://www.comparecodeweb.com/");
  });

  it("blocks invalid URLs and hex values but permits low-contrast colors without warnings", async () => {
    const user = userEvent.setup();
    render(<QrGeneratorView />);
    await user.clear(screen.getByRole("textbox", { name: "Website URL" }));
    await user.type(screen.getByRole("textbox", { name: "Website URL" }), "javascript:alert(1)");
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeDisabled();
    expect(screen.getByText("Enter a valid http or https URL.")).toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Website URL" }));
    await user.type(screen.getByRole("textbox", { name: "Website URL" }), "https://example.com");
    const codeColorInput = screen.getByRole("textbox", { name: "Code color" });
    expect(codeColorInput).toBeTruthy();
    await user.clear(codeColorInput!);
    await user.type(codeColorInput!, "#ffffff");
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeEnabled();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByText(/contrast|difficult to scan|reliable scanning|Scan your styled code/)).toBeNull();
    await user.clear(codeColorInput!);
    await user.type(codeColorInput!, "invalid");
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeDisabled();
  });

  it("keeps Wi-Fi passwords masked and warns that the QR code reveals them", async () => {
    const user = userEvent.setup();
    render(<QrGeneratorView />);
    await user.click(screen.getByRole("radio", { name: "Wi-Fi" }));
    expect(screen.getByText(/Anyone who scans or receives this QR code/)).toBeInTheDocument();
    expect(screen.getByText(/Off: for networks shown in Wi-Fi lists/)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  it("resets shapes and linked corner colors without changing content or appearance", async () => {
    const user = userEvent.setup();
    render(<QrGeneratorView />);
    const website = screen.getByRole("textbox", { name: "Website URL" });
    await user.clear(website);
    await user.type(website, "https://example.com/");
    const preview = screen.getByRole("img", { name: "url QR code preview" });
    const original = preview.getAttribute("src");
    await user.click(screen.getByRole("radio", { name: "Dots" }));
    const border = screen.getByRole("group", { name: "Corner border" });
    await user.click(within(border).getByRole("radio", { name: "Circle" }));
    expect(preview.getAttribute("src")).not.toBe(original);
    await user.click(screen.getByRole("checkbox", { name: "Use code color for corners" }));
    const borderColor = screen.getByRole("textbox", { name: "Corner border color" });
    await user.clear(borderColor);
    await user.type(borderColor, "invalid");
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Restore Shape defaults" }));
    expect(screen.getByRole("img", { name: "url QR code preview" })).toHaveAttribute("src", original);
    expect(screen.getByRole("checkbox", { name: "Use code color for corners" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
    expect(website).toHaveValue("https://example.com/");
  });

  it("offers Email and Phone codes with plain validation messages", async () => {
    const user = userEvent.setup();
    render(<QrGeneratorView />);
    for (const name of ["Email", "Phone"]) expect(screen.getByRole("radio", { name })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Email" }));
    await user.type(screen.getByRole("textbox", { name: "Email address" }), "name@");
    expect(screen.getByText("Enter a valid email address, like name@example.com.")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Email address" }), "example.com");
    expect(screen.getByRole("img", { name: "email QR code preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();

    await user.click(screen.getByRole("radio", { name: "Phone" }));
    await user.type(screen.getByRole("textbox", { name: "Phone number" }), "+36 30 123 4567");
    expect(screen.getByRole("img", { name: "phone QR code preview" })).toBeInTheDocument();
  });
});

describe("QR code scanning", () => {
  const imageFile = () => new File(["png"], "code.png", { type: "image/png" });
  const clipboardData = (file: File | null, text?: string) => ({
    items: [
      ...(text ? [{ kind: "string", type: "text/plain", getAsFile: () => null }] : []),
      ...(file ? [{ kind: "file", type: file.type, getAsFile: () => file }] : [])
    ]
  });
  const paste = (target: EventTarget, data: ReturnType<typeof clipboardData>) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: data });
    act(() => { target.dispatchEvent(event); });
    return event;
  };

  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
    URL.createObjectURL = vi.fn(() => "blob:scan");
    URL.revokeObjectURL = vi.fn();
    scanner.texts = ["https://example.com/page"];
    scanner.scanQrImage.mockReset().mockImplementation(async () => scanner.texts);
    scanner.disposeQrScanner.mockReset();
    useToastStore.setState({ activeToasts: [], queuedToasts: [] });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("scans a pasted image and shows the link with a safe Open link button", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<QrGeneratorView />);

    expect(paste(document.body, clipboardData(imageFile())).defaultPrevented).toBe(true);

    const dialog = await screen.findByRole("dialog", { name: "Scan result" });
    expect(await within(dialog).findByText("Found 1 QR code.")).toBeInTheDocument();
    expect(within(dialog).getByText("Website")).toBeInTheDocument();
    const link = within(dialog).getByRole("link", { name: "Open link" });
    expect(link).toHaveAttribute("href", "https://example.com/page");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");

    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:scan");
    unmount();
    expect(scanner.disposeQrScanner).toHaveBeenCalled();
  });

  it("leaves text pastes in form fields alone", () => {
    render(<QrGeneratorView />);
    const field = screen.getByRole("textbox", { name: "Website URL" });

    expect(paste(field, clipboardData(imageFile(), "https://example.com")).defaultPrevented).toBe(false);
    expect(paste(document.body, clipboardData(null, "hello")).defaultPrevented).toBe(false);
    expect(scanner.scanQrImage).not.toHaveBeenCalled();
  });

  it("scans an image dropped anywhere on the page and explains when there is no code", async () => {
    scanner.texts = [];
    const { container } = render(<QrGeneratorView />);
    const zone = container.querySelector("[data-file-drop-zone]")!;
    const dataTransfer = { types: ["Files"], files: [imageFile()], dropEffect: "none" };

    fireEvent.dragEnter(zone, { dataTransfer });
    expect(screen.getByText("Drop an image to scan its QR code")).toBeInTheDocument();
    fireEvent.drop(zone, { dataTransfer });

    expect(await screen.findByText(/No QR code found/)).toBeInTheDocument();
  });

  it("rejects files that are not images without scanning them", async () => {
    render(<QrGeneratorView />);
    fireEvent.change(screen.getByLabelText("Image to scan"), { target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] } });

    expect(await screen.findByText(/This file is not an image/)).toBeInTheDocument();
    expect(scanner.scanQrImage).not.toHaveBeenCalled();
  });

  it("pastes from the clipboard with the paste button or explains why it can't", async () => {
    const user = userEvent.setup();
    const read = vi.fn(async () => [{ types: ["text/plain"], getType: vi.fn() }]);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { read } });
    render(<QrGeneratorView />);

    await user.click(screen.getByRole("button", { name: "Paste image to scan" }));
    await waitFor(() => expect(useToastStore.getState().activeToasts.map((toast) => toast.message)).toContain("There is no image in the clipboard. Copy an image first."));

    scanner.texts = ["WIFI:T:WPA;S:Cafe;P:secret;;", "tel:+3612345678"];
    read.mockResolvedValue([{ types: ["image/png"], getType: vi.fn(async () => new Blob(["png"], { type: "image/png" })) }]);
    await user.click(screen.getByRole("button", { name: "Paste image to scan" }));

    const dialog = await screen.findByRole("dialog", { name: "Scan result" });
    expect(await within(dialog).findByText("Found 2 QR codes.")).toBeInTheDocument();
    expect(within(dialog).getByRole("article", { name: "QR code 1 of 2" })).toHaveTextContent("Cafe");
    expect(within(dialog).getByRole("article", { name: "QR code 2 of 2" })).toHaveTextContent("+3612345678");
    expect(within(dialog).queryByRole("link")).toBeNull();
  });
});
