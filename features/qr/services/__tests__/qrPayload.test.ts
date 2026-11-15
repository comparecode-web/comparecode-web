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

  it("builds a mailto link with encoded subject and message and rejects invalid addresses", () => {
    expect(buildQrPayload({ type: "email", to: " anna+qr@example.com ", subject: "Hi & bye?", body: "Line 1\nLine 2" }).value)
      .toBe("mailto:anna+qr@example.com?subject=Hi%20%26%20bye%3F&body=Line%201%0D%0ALine%202");
    expect(buildQrPayload({ type: "email", to: "name@example.com", subject: "", body: "" }).value).toBe("mailto:name@example.com");
    expect(buildQrPayload({ type: "email", to: "", subject: "Hi", body: "" }).error).toBe("Enter an email address.");
    for (const to of ["name", "name@", "name@example", "a b@example.com", "a@b.com?cc=x@y.com"]) {
      expect(buildQrPayload({ type: "email", to, subject: "", body: "" }).error).toMatch(/valid email/);
    }
  });

  it("builds a tel link without visual separators and rejects other characters", () => {
    expect(buildQrPayload({ type: "phone", number: "+36 (30) 123-4567" }).value).toBe("tel:+36301234567");
    expect(buildQrPayload({ type: "phone", number: "06.30.123.4567" }).value).toBe("tel:06301234567");
    expect(buildQrPayload({ type: "phone", number: " " }).error).toBe("Enter a phone number.");
    for (const number of ["12", "+36 30 ABC", "36+30", "tel:123456"]) {
      expect(buildQrPayload({ type: "phone", number }).error).toMatch(/valid phone/);
    }
  });

  it("refuses unknown runtime content without generating a payload", () => {
    const unsupported = { type: "unknown" } as unknown as QrContent;
    expect(buildQrPayload(unsupported)).toEqual({ value: null, error: "This QR content type is not supported." });
  });
});
