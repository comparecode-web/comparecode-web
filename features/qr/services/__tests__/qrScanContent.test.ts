import { describe, expect, it } from "vitest";
import { describeQrScanContent } from "../qrScanContent";

const fields = (raw: string) => describeQrScanContent(raw).fields.map((field) => [field.label, field.value]);

describe("describeQrScanContent", () => {
  it("recognizes http and https links and flags international site names", () => {
    expect(describeQrScanContent("https://example.com/a?b=1")).toEqual({
      kind: "website",
      label: "Website",
      fields: [],
      link: { href: "https://example.com/a?b=1", host: "example.com", hasInternationalHost: false }
    });
    expect(describeQrScanContent("https://árvíz.example/").link).toMatchObject({ host: "xn--rvz-dla6d.example", hasInternationalHost: true });
  });

  it("never offers a link for other schemes or text that only contains a link", () => {
    for (const raw of ["javascript:alert(1)", "ftp://example.com", "Visit https://example.com", "www.example.com", "data:text/html,hi"]) {
      expect(describeQrScanContent(raw).link).toBeNull();
    }
    expect(describeQrScanContent("javascript:alert(1)").kind).toBe("text");
  });

  it("reads email, phone and SMS details", () => {
    expect(describeQrScanContent("MAILTO:a+b@example.com?subject=Hi%20there&body=Line%201%0D%0ALine%202").kind).toBe("email");
    expect(fields("mailto:a+b@example.com?subject=Hi%20there&body=Line%201%0D%0ALine%202")).toEqual([["To", "a+b@example.com"], ["Subject", "Hi there"], ["Message", "Line 1\nLine 2"]]);
    expect(fields("mailto:?to=x@example.com")).toEqual([["To", "x@example.com"]]);
    expect(fields("tel:+36301234567")).toEqual([["Number", "+36301234567"]]);
    expect(fields("sms:+3630123?body=See%20you")).toEqual([["Number", "+3630123"], ["Message", "See you"]]);
    expect(fields("SMSTO:+3630123:See you: soon")).toEqual([["Number", "+3630123"], ["Message", "See you: soon"]]);
  });

  it("unescapes Wi-Fi fields and describes open networks plainly", () => {
    expect(fields("WIFI:T:WPA;S:Cafe\\;Guest;P:p\\:ss\\\\;H:true;;")).toEqual([["Network", "Cafe;Guest"], ["Security", "WPA"], ["Password", "p:ss\\"], ["Hidden network", "Yes"]]);
    expect(fields("WIFI:S:Lobby;T:nopass;;")).toEqual([["Network", "Lobby"], ["Security", "Open network"]]);
  });

  it("labels contacts, events and locations and keeps everything else as text", () => {
    expect(describeQrScanContent("BEGIN:VCARD\nVERSION:3.0\nFN:Anna\nEND:VCARD").label).toBe("Contact");
    expect(describeQrScanContent("MECARD:N:Anna;;").kind).toBe("contact");
    expect(describeQrScanContent("BEGIN:VEVENT\nSUMMARY:Party\nEND:VEVENT").label).toBe("Event");
    expect(fields("geo:47.4979,19.0402?z=12")).toEqual([["Coordinates", "47.4979, 19.0402"]]);
    expect(describeQrScanContent("Hello\nworld")).toEqual({ kind: "text", label: "Text", fields: [], link: null });
  });

  it("keeps malformed percent escapes instead of failing", () => {
    expect(fields("mailto:a@example.com?subject=100%")).toEqual([["To", "a@example.com"], ["Subject", "100%"]]);
  });
});
