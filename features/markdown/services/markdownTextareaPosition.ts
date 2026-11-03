const mirroredProperties = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "tabSize",
  "textTransform",
  "whiteSpace",
  "wordBreak",
  "overflowWrap"
] as const;

export function getLineStartOffset(value: string, line: number): number {
  let offset = 0;

  for (let current = 1; current < line; current++) {
    const next = value.indexOf("\n", offset);
    if (next === -1) {
      return value.length;
    }
    offset = next + 1;
  }

  return offset;
}

export function getTextareaOffsetTop(textarea: HTMLTextAreaElement, offset: number): number {
  const style = getComputedStyle(textarea);
  const mirror = document.createElement("div");

  for (const property of mirroredProperties) {
    mirror.style[property] = style[property];
  }

  mirror.style.boxSizing = "border-box";
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.height = "auto";
  mirror.style.overflow = "hidden";
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.textContent = textarea.value.slice(0, offset);

  const marker = document.createElement("span");
  marker.textContent = "​";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const top = marker.offsetTop - parseFloat(style.paddingTop || "0");
  mirror.remove();

  return Math.max(0, top);
}

export function revealTextareaLine(textarea: HTMLTextAreaElement, line: number) {
  const offset = getLineStartOffset(textarea.value, line);
  textarea.setSelectionRange(offset, offset);
  textarea.scrollTop = getTextareaOffsetTop(textarea, offset);
}
