"use client";

import { useRef, useState, type ReactNode } from "react";
import { IoMdCodeWorking } from "react-icons/io";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { MenuItem, PopoverMenu } from "@/components/ui/PopoverMenu";
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
  const alertTriggerRef = useRef<HTMLButtonElement | null>(null);
  const tableTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableColumns, setTableColumns] = useState(2);

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
            <IconButton
              variant="toolbar"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <span className="text-lg"><MdUndo /></span>
            </IconButton>
            <IconButton
              variant="toolbar"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <span className="text-lg"><MdRedo /></span>
            </IconButton>
          </div>
          {toolbarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex shrink-0 items-center gap-1 border-r border-border-default pr-1 last:border-r-0 last:pr-0">
              {group.map((item) => (
                <IconButton
                  key={item.action}
                  variant="toolbar"
                  size="sm"
                  onClick={() => onFormat(item.action)}
                  title={item.title}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label && <span className="text-xs">{item.label}</span>}
                </IconButton>
              ))}
            </div>
          ))}
          <div className="relative flex shrink-0 items-center border-r border-border-default pr-1">
            <IconButton
              ref={tableTriggerRef}
              variant="toolbar"
              size="sm"
              onClick={() => setIsTableMenuOpen((current) => !current)}
              title="Table"
            >
              <span className="text-lg"><MdTableChart /></span>
            </IconButton>
            <PopoverMenu isOpen={isTableMenuOpen} onOpenChange={setIsTableMenuOpen} triggerRef={tableTriggerRef} className="w-52 p-3">
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
              <Button
                size="sm"
                onClick={() => {
                  onFormat("table", { tableRows, tableColumns });
                  setIsTableMenuOpen(false);
                }}
                className="mt-3 w-full"
              >
                Insert
              </Button>
            </PopoverMenu>
          </div>
          <div className="relative flex shrink-0 items-center">
            <IconButton
              ref={alertTriggerRef}
              variant="toolbar"
              size="sm"
              onClick={() => setIsAlertMenuOpen((current) => !current)}
              title="Alert"
            >
              <span className="text-lg"><MdAddAlert /></span>
            </IconButton>
            <PopoverMenu isOpen={isAlertMenuOpen} onOpenChange={setIsAlertMenuOpen} triggerRef={alertTriggerRef} className="min-w-40 overflow-hidden py-1">
              {alertOptions.map((item) => (
                <MenuItem
                  key={item.action}
                  onClick={() => {
                    onFormat(item.action);
                    setIsAlertMenuOpen(false);
                  }}
                  className={item.className}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </MenuItem>
              ))}
            </PopoverMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
