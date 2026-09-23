import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
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
});
