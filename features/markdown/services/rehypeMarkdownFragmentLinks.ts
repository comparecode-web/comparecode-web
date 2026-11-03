import { markdownHeadingIdPrefix } from "@/features/markdown/services/markdownDocument";

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Array<HastNode>;
}

function walk(node: HastNode, visit: (element: HastNode) => void) {
  if (node.type === "element") {
    visit(node);
  }

  for (const child of node.children ?? []) {
    walk(child, visit);
  }
}

function decodeFragment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function rehypeMarkdownFragmentLinks() {
  return (tree: HastNode) => {
    const ids = new Set<string>();
    walk(tree, (element) => {
      const id = element.properties?.id;
      if (typeof id === "string" && id) {
        ids.add(id);
      }
    });

    walk(tree, (element) => {
      const href = element.tagName === "a" ? element.properties?.href : undefined;
      if (typeof href !== "string" || !href.startsWith("#") || href.length < 2) {
        return;
      }

      const fragment = decodeFragment(href.slice(1));
      if (fragment.startsWith(markdownHeadingIdPrefix) || ids.has(fragment)) {
        return;
      }

      const prefixed = `${markdownHeadingIdPrefix}${fragment}`;
      if (ids.has(prefixed) && element.properties) {
        element.properties.href = `#${prefixed}`;
      }
    });
  };
}
