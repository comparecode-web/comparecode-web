import { describe, expect, it } from "vitest";
import { buildQrPayload, type QrContent } from "../qrPayload";

describe("QR payloads", () => {
  it("keeps an entered URL unchanged and rejects unsafe or ambiguous schemes", () => {
    expect(buildQrPayload({ type: "url", url: "https://example.com/a?x=1&y=2" }).value).toBe("https://example.com/a?x=1&y=2");
    expect(buildQrPayload({ type: "url", url: "javascript:alert(1)" }).error).toMatch(/http or https/);
    expect(buildQrPayload({ type: "url", url: " https://example.com" }).error).toMatch(/spaces/);
  });

  it("preserves Unicode and line breaks in free text", () => {
    expect(buildQrPayload({ type: "text", text: "Árvíztűrő\n🙂" }).value).toBe("Árvíztűrő\n🙂");
    expect(buildQrPayload({ type: "text", text: "  " }).value).toBeNull();
  });

  it("escapes Wi-Fi control characters and omits the password for open networks", () => {
    expect(buildQrPayload({ type: "wifi", ssid: "Cafe;\\Guest", password: "a:b,c\"d", security: "WPA", hidden: true }).value)
      .toBe("WIFI:T:WPA;S:Cafe\\;\\\\Guest;P:a\\:b\\,c\\\"d;H:true;;");
    expect(buildQrPayload({ type: "wifi", ssid: "Cafe", password: "secret", security: "nopass", hidden: false }).value)
      .toBe("WIFI:T:nopass;S:Cafe;;");
    expect(buildQrPayload({ type: "wifi", ssid: "Cafe", password: "", security: "WPA", hidden: false }).error)
      .toMatch(/password/);
  });

  it("refuses unsupported contact content without generating a payload", () => {
    const unsupported = { type: "contact", name: "Ági Doe" } as unknown as QrContent;
    expect(buildQrPayload(unsupported)).toEqual({ value: null, error: "This QR content type is not supported." });
  });
});
