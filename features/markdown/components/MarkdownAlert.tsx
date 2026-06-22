import { Children, isValidElement, type ReactNode } from "react";
import { MdCancel, MdError, MdInfo, MdLightbulb, MdWarning } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";

type AlertKind = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

interface ParsedAlert {
  kind: AlertKind;
  content: Array<ReactNode>;
}

const alertStyles: Record<AlertKind, { title: string; icon: ReactNode; className: string; titleClassName: string }> = {
  NOTE: {
    title: "Note",
    icon: <MdInfo />,
    className: "border-blue-600 bg-blue-100 text-slate-950",
    titleClassName: "text-blue-700"
  },
  TIP: {
    title: "Tip",
    icon: <MdLightbulb />,
    className: "border-green-700 bg-green-100 text-slate-950",
    titleClassName: "text-green-700"
  },
  IMPORTANT: {
    title: "Important",
    icon: <MdError />,
    className: "border-violet-600 bg-purple-100 text-slate-950",
    titleClassName: "text-violet-700"
  },
  WARNING: {
    title: "Warning",
    icon: <MdWarning />,
    className: "border-yellow-700 bg-yellow-100 text-slate-950",
    titleClassName: "text-yellow-800"
  },
  CAUTION: {
    title: "Caution",
    icon: <MdCancel />,
    className: "border-red-600 bg-red-100 text-slate-950",
    titleClassName: "text-red-700"
  }
};

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }

  return "";
}

function trimAlertMarkerFromNode(node: ReactNode, marker: string): ReactNode | null {
  if (typeof node === "string") {
    const next = node.replace(marker, "").trimStart();
    return next || null;
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    const children = Children.toArray(node.props.children);
    let markerRemoved = false;
    const nextChildren = children
      .map((child) => {
        if (markerRemoved) {
          return child;
        }

        const text = getTextContent(child);
        if (!text.includes(marker)) {
          return child;
        }

        markerRemoved = true;
        return trimAlertMarkerFromNode(child, marker);
      })
      .filter(Boolean);

    return {
      ...node,
      props: {
        ...node.props,
        children: nextChildren.length === 0 ? null : nextChildren
      }
    };
  }

  return node;
}

function isLeadingSpacingNode(node: ReactNode): boolean {
  if (typeof node === "string") {
    return node.trim() === "";
  }

  if (isValidElement(node)) {
    return node.type === "br";
  }

  return false;
}

function removeLeadingSpacingNodes(nodes: Array<ReactNode>): Array<ReactNode> {
  let firstContentIndex = 0;

  while (firstContentIndex < nodes.length && isLeadingSpacingNode(nodes[firstContentIndex])) {
    firstContentIndex += 1;
  }

  return nodes.slice(firstContentIndex);
}

function trimAlertMarkerFromNodes(nodes: Array<ReactNode>, marker: string): Array<ReactNode> {
  let markerRemoved = false;

  return nodes
    .map((node) => {
      if (markerRemoved) {
        return node;
      }

      const text = getTextContent(node);
      if (!text.includes(marker)) {
        return node;
      }

      markerRemoved = true;
      const trimmedNode = trimAlertMarkerFromNode(node, marker);

      if (isValidElement<{ children?: ReactNode }>(trimmedNode)) {
        const nextChildren = removeLeadingSpacingNodes(Children.toArray(trimmedNode.props.children));

        return {
          ...trimmedNode,
          props: {
            ...trimmedNode.props,
            children: nextChildren.length === 0 ? null : nextChildren
          }
        };
      }

      return trimmedNode;
    })
    .filter(Boolean);
}

function parseAlert(children: ReactNode): ParsedAlert | null {
  const nodes = Children.toArray(children);
  const text = getTextContent(nodes).trimStart();
  const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/.exec(text);

  if (!match) {
    return null;
  }

  const marker = match[0];
  const content = trimAlertMarkerFromNodes(nodes, marker);

  return {
    kind: match[1] as AlertKind,
    content
  };
}

interface MarkdownAlertProps {
  children: ReactNode;
}

export function MarkdownAlert({ children }: MarkdownAlertProps) {
  const alert = parseAlert(children);

  if (!alert) {
    return (
      <blockquote className="my-3 border-l-4 border-border-default bg-transparent px-3 py-0.5 text-text-primary">
        {children}
      </blockquote>
    );
  }

  const styles = alertStyles[alert.kind];

  return (
    <div className={cn("my-3 rounded-md border-l-4 px-3 py-2", styles.className)}>
      <div className={cn("mb-0.5 flex items-center gap-2 font-semibold", styles.titleClassName)}>
        <span className="text-base">{styles.icon}</span>
        <span>{styles.title}</span>
      </div>
      <div className="[&_p]:!my-0 [&_p]:text-slate-950">
        {alert.content}
      </div>
    </div>
  );
}
