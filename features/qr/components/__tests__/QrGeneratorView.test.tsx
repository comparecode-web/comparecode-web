import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QrGeneratorView } from "../QrGeneratorView";

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

  it("blocks invalid URLs and hex values but permits low-contrast colors with a warning", async () => {
    const user = userEvent.setup();
    render(<QrGeneratorView />);
    await user.clear(screen.getByRole("textbox", { name: "Website URL" }));
    await user.type(screen.getByRole("textbox", { name: "Website URL" }), "javascript:alert(1)");
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeDisabled();
    expect(screen.getByText("Enter a valid http or https URL.")).toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Website URL" }));
    await user.type(screen.getByRole("textbox", { name: "Website URL" }), "https://example.com");
    const codeColorInput = screen.getByText("Code color").closest("label")?.querySelector('input[type="text"]');
    expect(codeColorInput).toBeTruthy();
    await user.clear(codeColorInput!);
    await user.type(codeColorInput!, "#ffffff");
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeEnabled();
    expect(screen.getByText(/Choose a darker code color for more reliable scanning/)).toBeInTheDocument();
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
    const borderColor = screen.getByText("Corner border color").closest("label")!.querySelector('input[type="text"]')!;
    await user.clear(borderColor);
    await user.type(borderColor, "invalid");
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Restore Shape defaults" }));
    expect(screen.getByRole("img", { name: "url QR code preview" })).toHaveAttribute("src", original);
    expect(screen.getByRole("checkbox", { name: "Use code color for corners" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
    expect(website).toHaveValue("https://example.com/");
  });
});
