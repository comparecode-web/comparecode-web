"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IoMdCodeWorking } from "react-icons/io";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";
import { type MarkdownFormatOptions } from "@/features/markdown/hooks/useMarkdownFormattingActions";
import { markdownTableLimits } from "@/features/markdown/services/markdownEditorCommands";
import {
  MdFormatBold,
  MdFormatItalic,
  MdStrikethroughS,
  MdFormatQuote,
  MdTextFields,
  MdArrowUpward,
  MdArrowDownward,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdChecklist,
  MdCode,
  MdLink,
  MdAddLink,
  MdImage,
  MdTableChart,
  MdHorizontalRule,
  MdAddAlert,
  MdInfo,
  MdLightbulb,
  MdError,
  MdWarning,
  MdCancel,
  MdUndo,
  MdRedo
} from "react-icons/md";

interface MarkdownToolbarProps {
  onFormat: (action: MarkdownFormatAction, options?: MarkdownFormatOptions) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const toolbarGroups: Array<Array<{ action: MarkdownFormatAction; title: string; icon: ReactNode; label?: string }>> = [
  [
    { action: "bold", title: "Bold", icon: <MdFormatBold /> },
    { action: "italic", title: "Italic", icon: <MdFormatItalic /> },
    { action: "strikethrough", title: "Strikethrough", icon: <MdStrikethroughS /> },
    { action: "quote", title: "Quote", icon: <MdFormatQuote /> },
    { action: "titleCase", title: "Title case", icon: <MdTextFields /> },
    { action: "upperCase", title: "Uppercase", icon: <CaseTransformIcon letter="A" direction="up" /> },
    { action: "lowerCase", title: "Lowercase", icon: <CaseTransformIcon letter="a" direction="down" /> }
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
    { action: "codeBlock", title: "Code block", icon: <IoMdCodeWorking /> },
    { action: "horizontalRule", title: "Horizontal rule", icon: <MdHorizontalRule /> },
    { action: "link", title: "Link", icon: <MdLink /> },
    { action: "reference", title: "Reference link", icon: <MdAddLink /> },
    { action: "image", title: "Image", icon: <MdImage /> }
  ]
];

const alertOptions: Array<{ action: MarkdownFormatAction; label: string; icon: ReactNode; className: string }> = [
  { action: "alertNote", label: "Note", icon: <MdInfo />, className: "text-blue-700 hover:bg-blue-100" },
  { action: "alertTip", label: "Tip", icon: <MdLightbulb />, className: "text-green-700 hover:bg-green-100" },
  { action: "alertImportant", label: "Important", icon: <MdError />, className: "text-violet-700 hover:bg-purple-100" },
  { action: "alertWarning", label: "Warning", icon: <MdWarning />, className: "text-yellow-800 hover:bg-yellow-100" },
  { action: "alertCaution", label: "Caution", icon: <MdCancel />, className: "text-red-700 hover:bg-red-100" }
];

function CaseTransformIcon({ letter, direction }: { letter: "A" | "a"; direction: "up" | "down" }) {
  const ArrowIcon = direction === "up" ? MdArrowUpward : MdArrowDownward;

  return (
    <span className="flex items-center leading-none">
      <span className="text-base font-black">{letter}</span>
      <ArrowIcon className="-ml-0.5 text-sm" />
    </span>
  );
}

export function MarkdownToolbar({ onFormat, onUndo, onRedo, canUndo, canRedo }: MarkdownToolbarProps) {
  const alertMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableColumns, setTableColumns] = useState(2);

  useEffect(() => {
    if (!isAlertMenuOpen && !isTableMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!alertMenuRef.current?.contains(event.target as Node)) {
        setIsAlertMenuOpen(false);
      }

      if (!tableMenuRef.current?.contains(event.target as Node)) {
        setIsTableMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isAlertMenuOpen, isTableMenuOpen]);

  const handleTableNumberChange = (value: string, min: number, max: number, setter: (value: number) => void) => {
    const parsed = parseInt(value, 10);
    const nextValue = Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed));
    setter(nextValue);
  };

  return (
    <div className="flex w-full min-w-0 max-w-full shrink-0 flex-col gap-2 overflow-hidden border-b border-border-default bg-bg-secondary px-2 py-2 sm:overflow-visible sm:px-3">
      <div className="flex w-full min-w-0 max-w-full items-center justify-between gap-2 overflow-x-auto overflow-y-hidden custom-scrollbar sm:overflow-visible">
        <div className="flex w-max flex-nowrap items-center gap-1 overflow-visible sm:w-auto sm:flex-1 sm:flex-wrap">
          <div className="flex shrink-0 items-center gap-1 border-r border-border-default pr-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
              className="flex h-8 min-w-8 items-center justify-center rounded border border-transparent px-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-default hover:bg-hover-overlay hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-lg"><MdUndo /></span>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              className="flex h-8 min-w-8 items-center justify-center rounded border border-transparent px-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-default hover:bg-hover-overlay hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-lg"><MdRedo /></span>
            </button>
          </div>
          {toolbarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex shrink-0 items-center gap-1 border-r border-border-default pr-1 last:border-r-0 last:pr-0">
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
          <div ref={tableMenuRef} className="relative flex shrink-0 items-center border-r border-border-default pr-1">
            <button
              type="button"
              onClick={() => setIsTableMenuOpen((current) => !current)}
              title="Table"
              className="flex h-8 min-w-8 items-center justify-center rounded border border-transparent px-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-default hover:bg-hover-overlay hover:text-text-primary"
            >
              <span className="text-lg"><MdTableChart /></span>
            </button>
            {isTableMenuOpen && (
              <div className="absolute left-0 top-9 z-20 w-52 rounded border border-border-default bg-bg-primary p-3 shadow-lg">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Insert table
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
                    Columns
                    <input
                      type="number"
                      min={markdownTableLimits.minColumns}
                      max={markdownTableLimits.maxColumns}
                      value={tableColumns}
                      onChange={(event) => handleTableNumberChange(event.target.value, markdownTableLimits.minColumns, markdownTableLimits.maxColumns, setTableColumns)}
                      className="h-8 rounded border border-border-default bg-bg-secondary px-2 text-sm text-text-primary outline-none focus:border-accent-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
                    Rows
                    <input
                      type="number"
                      min={markdownTableLimits.minRows}
                      max={markdownTableLimits.maxRows}
                      value={tableRows}
                      onChange={(event) => handleTableNumberChange(event.target.value, markdownTableLimits.minRows, markdownTableLimits.maxRows, setTableRows)}
                      className="h-8 rounded border border-border-default bg-bg-secondary px-2 text-sm text-text-primary outline-none focus:border-accent-primary"
                    />
                  </label>
                </div>
                <div className="mt-2 text-xs text-text-secondary">
                  Max {markdownTableLimits.maxColumns} columns, {markdownTableLimits.maxRows} rows.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onFormat("table", { tableRows, tableColumns });
                    setIsTableMenuOpen(false);
                  }}
                  className="mt-3 h-8 w-full rounded bg-accent-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Insert
                </button>
              </div>
            )}
          </div>
          <div ref={alertMenuRef} className="relative flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => setIsAlertMenuOpen((current) => !current)}
              title="Alert"
              className="flex h-8 min-w-8 cursor-pointer list-none items-center justify-center rounded border border-transparent px-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-default hover:bg-hover-overlay hover:text-text-primary [&::-webkit-details-marker]:hidden"
            >
              <span className="text-lg"><MdAddAlert /></span>
            </button>
            {isAlertMenuOpen && (
              <div className="absolute left-0 top-9 z-20 min-w-40 overflow-hidden rounded border border-border-default bg-bg-primary py-1 shadow-lg">
                {alertOptions.map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => {
                      onFormat(item.action);
                      setIsAlertMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-semibold transition-colors ${item.className}`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
