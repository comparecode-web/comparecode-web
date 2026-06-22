"use client";

import type { ReactNode } from "react";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";
import { MarkdownStatsBar } from "./MarkdownStatsBar";
import {
  MdFormatBold,
  MdFormatItalic,
  MdStrikethroughS,
  MdFormatQuote,
  MdTitle,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdChecklist,
  MdCode,
  MdLink,
  MdImage,
  MdTableChart,
  MdFunctions,
  MdAccountTree
} from "react-icons/md";

interface MarkdownToolbarProps {
  value: string;
  onFormat: (action: MarkdownFormatAction) => void;
}

const toolbarGroups: Array<Array<{ action: MarkdownFormatAction; title: string; icon: ReactNode; label?: string }>> = [
  [
    { action: "bold", title: "Bold", icon: <MdFormatBold /> },
    { action: "italic", title: "Italic", icon: <MdFormatItalic /> },
    { action: "strikethrough", title: "Strikethrough", icon: <MdStrikethroughS /> },
    { action: "quote", title: "Quote", icon: <MdFormatQuote /> },
    { action: "titleCase", title: "Title case", icon: <MdTitle /> }
  ],
  [
    { action: "h1", title: "Heading 1", icon: null, label: "H1" },
    { action: "h2", title: "Heading 2", icon: null, label: "H2" }
  ],
  [
    { action: "alignLeft", title: "Align left", icon: <MdFormatAlignLeft /> },
    { action: "alignCenter", title: "Align center", icon: <MdFormatAlignCenter /> },
    { action: "alignRight", title: "Align right", icon: <MdFormatAlignRight /> }
  ],
  [
    { action: "bulletList", title: "Bullet list", icon: <MdFormatListBulleted /> },
    { action: "orderedList", title: "Ordered list", icon: <MdFormatListNumbered /> },
    { action: "taskList", title: "Task list", icon: <MdChecklist /> }
  ],
  [
    { action: "inlineCode", title: "Inline code", icon: <MdCode /> },
    { action: "codeBlock", title: "Code block", icon: <MdCode />, label: "{}" },
    { action: "link", title: "Link", icon: <MdLink /> },
    { action: "image", title: "Image", icon: <MdImage /> },
    { action: "table", title: "Table", icon: <MdTableChart /> },
    { action: "mermaid", title: "Mermaid diagram", icon: <MdAccountTree /> },
    { action: "math", title: "Math", icon: <MdFunctions /> }
  ]
];

export function MarkdownToolbar({ value, onFormat }: MarkdownToolbarProps) {
  return (
    <div className="flex min-w-0 shrink-0 flex-col gap-2 overflow-hidden border-b border-border-default bg-bg-secondary px-2 py-2 sm:px-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-hidden">
          {toolbarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex min-w-0 items-center gap-1 border-r border-border-default pr-1 last:border-r-0 last:pr-0">
              {group.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => onFormat(item.action)}
                  title={item.title}
                  className="flex h-8 min-w-8 items-center justify-center rounded border border-transparent px-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-default hover:bg-hover-overlay hover:text-text-primary"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label && <span className="text-xs">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <MarkdownStatsBar value={value} />
      </div>
    </div>
  );
}
