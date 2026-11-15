export type QrScanContentKind = "website" | "email" | "phone" | "sms" | "wifi" | "contact" | "event" | "location" | "text";

export interface QrScanField {
  label: string;
  value: string;
}

export interface QrScanLink {
  href: string;
  host: string;
  hasInternationalHost: boolean;
}

export interface QrScanContent {
  kind: QrScanContentKind;
  label: string;
  fields: QrScanField[];
  link: QrScanLink | null;
}

const kindLabels: Record<QrScanContentKind, string> = {
  website: "Website",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  wifi: "Wi-Fi",
  contact: "Contact",
  event: "Event",
  location: "Location",
  text: "Text"
};

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function content(kind: QrScanContentKind, fields: QrScanField[] = [], link: QrScanLink | null = null): QrScanContent {
  const visibleFields = fields
    .map((field) => ({ ...field, value: field.value.replace(/\r\n?/g, "\n") }))
    .filter((field) => field.value.length > 0);
  return { kind, label: kindLabels[kind], fields: visibleFields, link };
}

function parseWebsite(text: string): QrScanContent | null {
  if (!/^https?:\/\//i.test(text) || /\s/.test(text)) return null;
  try {
    const url = new URL(text);
    if (!url.hostname) return null;
    return content("website", [], {
      href: url.href,
      host: url.hostname,
      hasInternationalHost: url.hostname.split(".").some((label) => label.startsWith("xn--"))
    });
  } catch {
    return null;
  }
}

function parseMailto(text: string): QrScanContent {
  const [address, query = ""] = text.slice("mailto:".length).split("?", 2);
  const params = new Map<string, string>();
  for (const pair of query.split("&")) {
    const [key, value = ""] = pair.split("=", 2);
    if (key) params.set(key.toLowerCase(), decode(value));
  }
  return content("email", [
    { label: "To", value: decode(address) || params.get("to") || "" },
    { label: "Subject", value: params.get("subject") ?? "" },
    { label: "Message", value: params.get("body") ?? "" }
  ]);
}

function parseSms(text: string): QrScanContent {
  if (/^smsto:/i.test(text)) {
    const rest = text.slice("smsto:".length);
    const separator = rest.indexOf(":");
    return content("sms", [
      { label: "Number", value: separator < 0 ? rest : rest.slice(0, separator) },
      { label: "Message", value: separator < 0 ? "" : rest.slice(separator + 1) }
    ]);
  }
  const [number, query = ""] = text.slice("sms:".length).split("?", 2);
  const body = query.split("&").map((pair) => pair.split("=", 2)).find(([key]) => key.toLowerCase() === "body")?.[1] ?? "";
  return content("sms", [
    { label: "Number", value: decode(number) },
    { label: "Message", value: decode(body) }
  ]);
}

function splitEscaped(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "\\" && index + 1 < value.length) {
      current += value[index + 1];
      index += 1;
    } else if (char === ";") {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function parseWifi(text: string): QrScanContent {
  const values = new Map<string, string>();
  for (const part of splitEscaped(text.slice("WIFI:".length))) {
    const separator = part.indexOf(":");
    if (separator > 0) values.set(part.slice(0, separator).toUpperCase(), part.slice(separator + 1));
  }
  const security = values.get("T") ?? "";
  return content("wifi", [
    { label: "Network", value: values.get("S") ?? "" },
    { label: "Security", value: !security || security.toLowerCase() === "nopass" ? "Open network" : security },
    { label: "Password", value: values.get("P") ?? "" },
    { label: "Hidden network", value: values.get("H")?.toLowerCase() === "true" ? "Yes" : "" }
  ]);
}

function parseGeo(text: string): QrScanContent {
  const coordinates = text.slice("geo:".length).split(/[;?]/, 1)[0];
  return content("location", [{ label: "Coordinates", value: coordinates.split(",").slice(0, 2).join(", ") }]);
}

export function describeQrScanContent(raw: string): QrScanContent {
  const text = raw.trim();
  const website = parseWebsite(text);
  if (website) return website;
  if (/^mailto:/i.test(text)) return parseMailto(text);
  if (/^tel:/i.test(text)) return content("phone", [{ label: "Number", value: decode(text.slice("tel:".length)) }]);
  if (/^(sms|smsto):/i.test(text)) return parseSms(text);
  if (/^WIFI:/i.test(text)) return parseWifi(text);
  if (/^geo:/i.test(text)) return parseGeo(text);
  if (/^BEGIN:VCARD/i.test(text) || /^MECARD:/i.test(text)) return content("contact");
  if (/^BEGIN:(VEVENT|VCALENDAR)/i.test(text)) return content("event");
  return content("text");
}
