import { describe, expect, it } from "vitest";
import { buildQrPayload } from "../qrPayload";

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

  it("creates a vCard 4.0 with CRLF lines and escaped text", () => {
    const result = buildQrPayload({ type: "contact", name: "Ági; Doe", phone: "+36 30 123 4567", email: "agi@example.com", organization: "Acme, Inc.\nBudapest" });
    expect(result.value).toBe("BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Ági\\; Doe\r\nTEL;VALUE=text:+36 30 123 4567\r\nEMAIL:agi@example.com\r\nORG:Acme\\, Inc.\\nBudapest\r\nEND:VCARD\r\n");
    expect(buildQrPayload({ type: "contact", name: "", phone: "123", email: "", organization: "" }).error).toMatch(/name/);
  });
});
