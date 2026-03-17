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

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return "Just now";
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