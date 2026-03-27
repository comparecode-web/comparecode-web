import { DateFormat, TimeFormat } from "@/types/settings";

const DEFAULT_DATE_PATTERN = "MMMM d";

export function getLineCount(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }
  return text.split(/\r?\n/).length;
}

export function generatePreviewLines(text: string | null | undefined, maxLines: number = 3): Array<string> {
  if (!text) {
    return [ ];
  }

  return text.split(/\r?\n/).slice(0, maxLines);
}

export function getRelativeTime(dateString: string, nowMs?: number): string {
  const date = new Date(dateString);
  const currentMs = nowMs ?? Date.now();
  const diffMs = currentMs - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffSecs < 5) {
    return "Just now";
  }

  if (diffSecs < 60) {
    return `${diffSecs} secs ago`;
  }

  if (diffMins < 60) {
    return `${diffMins} mins ago`;
  }

  const diffHours = Math.floor(diffMins / 60);

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString();
}

export function formatAbsoluteDateTime(dateString: string): string {
  const date = new Date(dateString);
  const datePart = formatDatePart(date, DEFAULT_DATE_PATTERN);
  const timePart = formatTimePart(date, TimeFormat.TwentyFourHour);
  return `${datePart} ${timePart}`;
}

export function formatAbsoluteDateTimeWithSettings(
  dateString: string,
  dateFormat: DateFormat,
  timeFormat: TimeFormat
): string {
  const date = new Date(dateString);
  const datePart = formatDatePart(date, dateFormat);
  const timePart = formatTimePart(date, timeFormat);
  return `${datePart} ${timePart}`;
}

export function formatDateOnlyWithSettings(dateString: string, dateFormat: DateFormat): string {
  const date = new Date(dateString);
  return formatDatePart(date, dateFormat);
}

function formatDatePart(date: Date, dateFormat: DateFormat): string {
  const pattern = dateFormat || DEFAULT_DATE_PATTERN;
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();

  const monthLong = date.toLocaleString("en-US", { month: "long" });
  const monthShort = date.toLocaleString("en-US", { month: "short" });
  const dayRaw = date.getDate();

  const replacements: Array<[string, string]> = [
    ["yyyy", String(year)],
    ["MMMM", monthLong],
    ["MMM", monthShort],
    ["MM", month],
    ["dd", day],
    ["d", String(dayRaw)]
  ];

  let output = pattern;
  for (let i = 0; i < replacements.length; i++) {
    const [token, value] = replacements[i];
    output = output.split(token).join(value);
  }

  return output;
}

function formatTimePart(date: Date, timeFormat: TimeFormat): string {
  if (timeFormat === TimeFormat.TwelveHour) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}