"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { IoMdCodeWorking } from "react-icons/io";
import {
  MdAccountTree,
  MdAddAlert,
  MdAddLink,
  MdArrowDropDown,
  MdCancel,
  MdCheck,
  MdChecklist,
  MdCode,
  MdContentCopy,
  MdDescription,
  MdDownload,
  MdError,
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFullscreen,
  MdFullscreenExit,
  MdFunctions,
  MdHorizontalRule,
  MdImage,
  MdInfo,
  MdLightbulb,
  MdLink,
  MdLibraryAdd,
  MdPrint,
  MdRedo,
  MdShortText,
  MdStrikethroughS,
  MdTableChart,
  MdTerminal,
  MdTextFields,
  MdTextSnippet,
  MdToc,
  MdUndo,
  MdUnfoldMore,
  MdWarning
} from "react-icons/md";
import { IconButton } from "@/components/ui/IconButton";
import { MenuItem, PopoverMenu } from "@/components/ui/PopoverMenu";
import { Popover } from "@/components/ui/Popover";
import { WorkspaceToolbar } from "@/components/ui/WorkspaceToolbar";
import { cn } from "@/utils/uiHelpers";
import type { MarkdownFormatAction } from "@/features/markdown/types/markdown";
import type { MarkdownFormatOptions } from "@/features/markdown/hooks/useMarkdownFormattingActions";
import { markdownMermaidTemplates } from "@/features/markdown/services/markdownMermaidTemplates";
import { MarkdownTablePicker } from "./MarkdownTablePicker";

export type MarkdownExportAction = "markdown" | "html" | "png" | "print" | "copyMarkdown" | "copyFormatted";

interface MarkdownToolbarProps {
  onFormat: (action: MarkdownFormatAction, options?: MarkdownFormatOptions) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDisabled?: boolean;
  getHeadingLevel?: () => number;
  onExport?: (action: MarkdownExportAction) => void;
  isExporting?: boolean;
  isOutlineOpen?: boolean;
  onToggleOutline?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface ToolbarMenuProps {
  title: string;
  trigger: ReactNode;
  isDisabled?: boolean;
  variant?: "ghost" | "primary";
  className?: string;
  align?: "start" | "end";
  onOpen?: () => void;
  children: (close: () => void) => ReactNode;
}

function ToolbarMenu({ title, trigger, isDisabled, variant = "ghost", className, align, onOpen, children }: ToolbarMenuProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <>
      <IconButton
        ref={triggerRef}
        variant={variant}
        size="sm"
        title={title}
        aria-label={title}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isDisabled}
        className="w-auto gap-0 px-1"
        onClick={() => {
          if (!isOpen) {
            onOpen?.();
          }
          setIsOpen((current) => !current);
        }}
      >
        {trigger}
        <MdArrowDropDown aria-hidden="true" className="-mx-0.5 text-base" />
      </IconButton>
      <PopoverMenu isOpen={isOpen} onOpenChange={setIsOpen} triggerRef={triggerRef} align={align} className={cn("min-w-44 overflow-hidden py-1", className)}>
        {children(close)}
      </PopoverMenu>
    </>
  );
}

function MenuGroupLabel({ children }: { children: ReactNode }) {
  return <div role="presentation" className="px-3 pb-1 pt-2 text-xs font-bold text-text-secondary first:pt-1">{children}</div>;
}

function MenuSeparator() {
  return <div role="separator" className="my-1 border-t border-border-default" />;
}

const headingOptions: Array<{ action: MarkdownFormatAction; level: number; symbol: string; label: string; sampleClassName: string }> = [
  { action: "paragraph", level: 0, symbol: "P", label: "Paragraph", sampleClassName: "text-sm font-normal" },
  { action: "h1", level: 1, symbol: "H1", label: "Heading 1", sampleClassName: "text-xl font-bold" },
  { action: "h2", level: 2, symbol: "H2", label: "Heading 2", sampleClassName: "text-lg font-bold" },
  { action: "h3", level: 3, symbol: "H3", label: "Heading 3", sampleClassName: "text-base font-semibold" },
  { action: "h4", level: 4, symbol: "H4", label: "Heading 4", sampleClassName: "text-sm font-semibold" },
  { action: "h5", level: 5, symbol: "H5", label: "Heading 5", sampleClassName: "text-xs font-semibold" },
  { action: "h6", level: 6, symbol: "H6", label: "Heading 6", sampleClassName: "text-xs font-semibold text-text-secondary" }
];

const caseOptions: Array<{ action: MarkdownFormatAction; symbol: string; label: string }> = [
  { action: "titleCase", symbol: "Aa", label: "Title case" },
  { action: "upperCase", symbol: "AA", label: "Uppercase" },
  { action: "lowerCase", symbol: "aa", label: "Lowercase" }
];

const alignmentOptions: Array<{ action: MarkdownFormatAction; label: string; icon: ReactNode }> = [
  { action: "alignLeft", label: "Align left", icon: <MdFormatAlignLeft /> },
  { action: "alignCenter", label: "Align center", icon: <MdFormatAlignCenter /> },
  { action: "alignRight", label: "Align right", icon: <MdFormatAlignRight /> }
];

const alertOptions: Array<{ action: MarkdownFormatAction; label: string; icon: ReactNode; className: string }> = [
  { action: "alertNote", label: "Note", icon: <MdInfo />, className: "text-[var(--markdown-alert-note-fg)] hover:bg-[var(--markdown-alert-note-bg)]" },
  { action: "alertTip", label: "Tip", icon: <MdLightbulb />, className: "text-[var(--markdown-alert-tip-fg)] hover:bg-[var(--markdown-alert-tip-bg)]" },
  { action: "alertImportant", label: "Important", icon: <MdError />, className: "text-[var(--markdown-alert-important-fg)] hover:bg-[var(--markdown-alert-important-bg)]" },
  { action: "alertWarning", label: "Warning", icon: <MdWarning />, className: "text-[var(--markdown-alert-warning-fg)] hover:bg-[var(--markdown-alert-warning-bg)]" },
  { action: "alertCaution", label: "Caution", icon: <MdCancel />, className: "text-[var(--markdown-alert-caution-fg)] hover:bg-[var(--markdown-alert-caution-bg)]" }
];

const subscribeToPlatform = () => () => undefined;
const getPlatformModifier = () => /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? "Cmd" : "Ctrl";
const getServerPlatformModifier = () => "Ctrl";

function useShortcutModifier() {
  return useSyncExternalStore(subscribeToPlatform, getPlatformModifier, getServerPlatformModifier);
}

function ToolbarGroup({ children, isLast = false }: { children: ReactNode; isLast?: boolean }) {
  return <div className={cn("flex shrink-0 items-center gap-1", !isLast && "border-r border-border-default pr-1")}>{children}</div>;
}

export function MarkdownToolbar({
  onFormat,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDisabled = false,
  getHeadingLevel,
  onExport,
  isExporting = false,
  isOutlineOpen = false,
  onToggleOutline,
  isFullscreen = false,
  onToggleFullscreen
}: MarkdownToolbarProps) {
  const modifier = useShortcutModifier();
  const tableTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [headingLevel, setHeadingLevel] = useState(0);

  const formatButton = (action: MarkdownFormatAction, title: string, icon: ReactNode) => (
    <IconButton variant="ghost" size="sm" title={title} aria-label={title.replace(/ \(.*\)$/, "")} disabled={isDisabled} onClick={() => onFormat(action)}>
      <span className="text-lg">{icon}</span>
    </IconButton>
  );

  return (
    <WorkspaceToolbar className="w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
        <div className="flex w-max flex-nowrap items-center gap-0.5">
          <ToolbarGroup>
            <ToolbarMenu title="Download and export" variant="primary" isDisabled={isDisabled || isExporting} trigger={<MdDownload className="text-lg" aria-hidden="true" />}>
              {(close) => (
                <>
                  <MenuGroupLabel>Download</MenuGroupLabel>
                  <MenuItem onClick={() => { close(); onExport?.("markdown"); }}><MdDescription className="text-base" />Markdown (.md)</MenuItem>
                  <MenuItem onClick={() => { close(); onExport?.("html"); }}><MdCode className="text-base" />HTML</MenuItem>
                  <MenuItem onClick={() => { close(); onExport?.("png"); }}><MdImage className="text-base" />Image (.png)</MenuItem>
                  <MenuSeparator />
                  <MenuGroupLabel>Print</MenuGroupLabel>
                  <MenuItem onClick={() => { close(); onExport?.("print"); }}><MdPrint className="text-base" />Print / Save as PDF</MenuItem>
                  <MenuSeparator />
                  <MenuGroupLabel>Copy</MenuGroupLabel>
                  <MenuItem onClick={() => { close(); onExport?.("copyMarkdown"); }}><MdContentCopy className="text-base" />Copy Markdown</MenuItem>
                  <MenuItem onClick={() => { close(); onExport?.("copyFormatted"); }}><MdTextSnippet className="text-base" />Copy formatted text</MenuItem>
                </>
              )}
            </ToolbarMenu>
          </ToolbarGroup>
          <ToolbarGroup>
            <IconButton variant="ghost" size="sm" onClick={onUndo} disabled={isDisabled || !canUndo} title="Undo" aria-label="Undo">
              <span className="text-lg"><MdUndo /></span>
            </IconButton>
            <IconButton variant="ghost" size="sm" onClick={onRedo} disabled={isDisabled || !canRedo} title="Redo" aria-label="Redo">
              <span className="text-lg"><MdRedo /></span>
            </IconButton>
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarMenu
              title="Heading"
              isDisabled={isDisabled}
              trigger={<span className="text-base font-bold leading-none" aria-hidden="true">H</span>}
              onOpen={() => setHeadingLevel(getHeadingLevel?.() ?? 0)}
              className="min-w-60"
            >
              {(close) => headingOptions.map((option) => (
                <MenuItem key={option.action} isSelected={headingLevel === option.level} className="min-h-9 gap-3" onClick={() => { close(); onFormat(option.action); }}>
                  <span className="w-7 shrink-0 rounded bg-bg-secondary py-0.5 text-center font-mono text-xs font-semibold text-text-secondary">{option.symbol}</span>
                  <span className={cn("flex-1 whitespace-nowrap leading-tight text-text-primary", option.sampleClassName)}>{option.label}</span>
                  <MdCheck aria-hidden="true" className={cn("shrink-0 text-base text-accent", headingLevel !== option.level && "invisible")} />
                </MenuItem>
              ))}
            </ToolbarMenu>
            {formatButton("bold", `Bold (${modifier}+B)`, <MdFormatBold />)}
            {formatButton("italic", `Italic (${modifier}+I)`, <MdFormatItalic />)}
            {formatButton("strikethrough", "Strikethrough", <MdStrikethroughS />)}
            {formatButton("inlineCode", `Inline code (${modifier}+E)`, <MdCode />)}
            <ToolbarMenu title="Change case" isDisabled={isDisabled} trigger={<MdTextFields className="text-lg" aria-hidden="true" />} className="min-w-52">
              {(close) => caseOptions.map((option) => (
                <MenuItem key={option.action} className="min-h-9 gap-3" onClick={() => { close(); onFormat(option.action); }}>
                  <span className="w-7 shrink-0 rounded bg-bg-secondary py-0.5 text-center font-mono text-xs font-semibold text-text-secondary">{option.symbol}</span>
                  <span className="whitespace-nowrap">{option.label}</span>
                </MenuItem>
              ))}
            </ToolbarMenu>
          </ToolbarGroup>
          <ToolbarGroup>
            {formatButton("quote", "Quote", <MdFormatQuote />)}
            {formatButton("bulletList", "Bullet list", <MdFormatListBulleted />)}
            {formatButton("orderedList", "Numbered list", <MdFormatListNumbered />)}
            {formatButton("taskList", "Task list", <MdChecklist />)}
            <ToolbarMenu title="Alignment" isDisabled={isDisabled} trigger={<MdFormatAlignLeft className="text-lg" aria-hidden="true" />}>
              {(close) => alignmentOptions.map((option) => (
                <MenuItem key={option.action} onClick={() => { close(); onFormat(option.action); }}>
                  <span className="text-base">{option.icon}</span>
                  <span>{option.label}</span>
                </MenuItem>
              ))}
            </ToolbarMenu>
          </ToolbarGroup>
          <ToolbarGroup>
            {formatButton("link", `Link (${modifier}+K)`, <MdLink />)}
            {formatButton("image", "Image", <MdImage />)}
            <IconButton
              ref={tableTriggerRef}
              variant="ghost"
              size="sm"
              onClick={() => setIsTableOpen((current) => !current)}
              disabled={isDisabled}
              title="Table"
              aria-label="Table"
              aria-haspopup="dialog"
              aria-expanded={isTableOpen}
            >
              <span className="text-lg"><MdTableChart /></span>
            </IconButton>
            <Popover isOpen={isTableOpen} onOpenChange={setIsTableOpen} triggerRef={tableTriggerRef} className="w-60 p-3">
              <MarkdownTablePicker onInsert={(tableRows, tableColumns) => {
                setIsTableOpen(false);
                onFormat("table", { tableRows, tableColumns });
              }} />
            </Popover>
            {formatButton("reference", "Reference link", <MdAddLink />)}
          </ToolbarGroup>
          <ToolbarGroup isLast={!onToggleOutline && !onToggleFullscreen}>
            {formatButton("codeBlock", "Code block", <IoMdCodeWorking />)}
            {formatButton("horizontalRule", "Horizontal rule", <MdHorizontalRule />)}
            <ToolbarMenu title="Alert" isDisabled={isDisabled} trigger={<MdAddAlert className="text-lg" aria-hidden="true" />}>
              {(close) => alertOptions.map((option) => (
                <MenuItem key={option.action} className={option.className} onClick={() => { close(); onFormat(option.action); }}>
                  <span className="text-base">{option.icon}</span>
                  <span>{option.label}</span>
                </MenuItem>
              ))}
            </ToolbarMenu>
            <ToolbarMenu title="Insert" isDisabled={isDisabled} className="max-h-[min(28rem,70vh)] overflow-y-auto" trigger={<MdLibraryAdd className="text-lg" aria-hidden="true" />}>
              {(close) => (
                <>
                  <MenuGroupLabel>Math</MenuGroupLabel>
                  <MenuItem onClick={() => { close(); onFormat("mathInline"); }}><MdFunctions className="text-base" />Inline math</MenuItem>
                  <MenuItem onClick={() => { close(); onFormat("mathBlock"); }}><MdFunctions className="text-base" />Math block</MenuItem>
                  <MenuSeparator />
                  <MenuGroupLabel>Blocks</MenuGroupLabel>
                  <MenuItem onClick={() => { close(); onFormat("terminalBlock"); }}><MdTerminal className="text-base" />Terminal block</MenuItem>
                  <MenuItem onClick={() => { close(); onFormat("details"); }}><MdUnfoldMore className="text-base" />Collapsible section</MenuItem>
                  <MenuItem onClick={() => { close(); onFormat("footnote"); }}><MdShortText className="text-base" />Footnote</MenuItem>
                  <MenuSeparator />
                  <MenuGroupLabel>Mermaid diagram</MenuGroupLabel>
                  {markdownMermaidTemplates.map((template) => (
                    <MenuItem key={template.id} onClick={() => { close(); onFormat("mermaidTemplate", { mermaidTemplate: template.id }); }}>
                      <MdAccountTree className="text-base" />{template.label}
                    </MenuItem>
                  ))}
                </>
              )}
            </ToolbarMenu>
          </ToolbarGroup>
          {(onToggleOutline || onToggleFullscreen) && (
            <ToolbarGroup isLast>
              {onToggleOutline && (
                <IconButton variant="ghost" size="sm" isActive={isOutlineOpen} aria-pressed={isOutlineOpen} title="Outline" aria-label="Outline" disabled={isDisabled} onClick={onToggleOutline}>
                  <span className="text-lg"><MdToc /></span>
                </IconButton>
              )}
              {onToggleFullscreen && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  isActive={isFullscreen}
                  aria-pressed={isFullscreen}
                  title={isFullscreen ? "Exit full screen" : "Full screen"}
                  aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                  onClick={onToggleFullscreen}
                >
                  <span className="text-lg">{isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}</span>
                </IconButton>
              )}
            </ToolbarGroup>
          )}
        </div>
      </div>
    </WorkspaceToolbar>
  );
}
