export const DEFAULT_QR_WEBSITE_URL = "https://www.comparecodeweb.com/";

export type QrContent =
  | { type: "url"; url: string }
  | { type: "text"; text: string }
  | { type: "wifi"; ssid: string; password: string; security: "WPA" | "nopass"; hidden: boolean }
  | { type: "contact"; name: string; phone: string; email: string; organization: string };

export type QrPayloadResult = { value: string; error: null } | { value: null; error: string };

function escapeWifi(value: string): string {
  return value.replace(/[\\;,":]/g, "\\$&");
}

function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildQrPayload(content: QrContent): QrPayloadResult {
  switch (content.type) {
    case "url": {
      if (!content.url.trim()) return { value: null, error: "Enter a URL to generate a QR code." };
      if (content.url !== content.url.trim()) return { value: null, error: "Remove spaces before or after the URL." };
      try {
        const parsed = new URL(content.url);
        if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || !parsed.hostname) {
          return { value: null, error: "Enter a valid http or https URL." };
        }
      } catch {
        return { value: null, error: "Enter a valid http or https URL." };
      }
      return { value: content.url, error: null };
    }
    case "text":
      return content.text.trim()
        ? { value: content.text, error: null }
        : { value: null, error: "Enter text to generate a QR code." };
    case "wifi": {
      if (!content.ssid) return { value: null, error: "Enter a Wi-Fi network name." };
      if (content.security === "WPA" && !content.password) {
        return { value: null, error: "Enter the Wi-Fi password." };
      }
      const fields = [`T:${content.security}`, `S:${escapeWifi(content.ssid)}`];
      if (content.security === "WPA") fields.push(`P:${escapeWifi(content.password)}`);
      if (content.hidden) fields.push("H:true");
      return { value: `WIFI:${fields.join(";")};;`, error: null };
    }
    case "contact": {
      if (!content.name.trim()) return { value: null, error: "Enter a contact name." };
      const lines = ["BEGIN:VCARD", "VERSION:4.0", `FN:${escapeVcard(content.name)}`];
      if (content.phone.trim()) lines.push(`TEL;VALUE=text:${escapeVcard(content.phone)}`);
      if (content.email.trim()) lines.push(`EMAIL:${escapeVcard(content.email)}`);
      if (content.organization.trim()) lines.push(`ORG:${escapeVcard(content.organization)}`);
      lines.push("END:VCARD", "");
      return { value: lines.join("\r\n"), error: null };
    }
  }
}
