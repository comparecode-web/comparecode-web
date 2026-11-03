"use client";

import { createContext, useContext, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { CodeBlock } from "./CodeBlock";
import { MarkdownAlert } from "./MarkdownAlert";
import { MarkdownFrontmatterTable } from "./MarkdownFrontmatterTable";
import { MarkdownRenderBoundary } from "./MarkdownRenderBoundary";
import { MermaidBlock } from "./MermaidBlock";
import { getMarkdownCodeLanguage } from "@/features/markdown/services/markdownCodeLanguage";
import { remarkMarkdownHeadingIds } from "@/features/markdown/services/markdownDocument";
import { markdownBaseRemarkPlugins } from "@/features/markdown/services/markdownRemarkPlugins";
import { markdownSanitizeSchema } from "@/features/markdown/services/markdownSanitizeSchema";
import { prepareMarkdownSource } from "@/features/markdown/services/markdownSource";
import { rehypeMarkdownFragmentLinks } from "@/features/markdown/services/rehypeMarkdownFragmentLinks";
import { markdownFrontmatterTableId } from "@/features/markdown/services/remarkMarkdownSpecialBlocks";
import { markdownContentCss, markdownContentStyleHref, markdownContentStylePrecedence } from "@/features/markdown/styles/markdownContentStyles";
import type { MarkdownFrontmatter } from "@/features/markdown/services/markdownFrontmatter";

export interface MarkdownRenderOptions {
  renderDiagramsImmediately?: boolean;
}

const MarkdownRenderOptionsContext = createContext<MarkdownRenderOptions>({});

const remarkPlugins = [...markdownBaseRemarkPlugins, remarkMarkdownHeadingIds];
const rehypePlugins = [
  rehypeRaw,
  [rehypeSanitize, markdownSanitizeSchema],
  rehypeMarkdownFragmentLinks,
  [rehypeKatex, { throwOnError: false, strict: false }]
] as const;
const remarkRehypeOptions = { clobberPrefix: "" };

interface MarkdownNodePosition {
  position?: {
    start?: { column?: number; line?: number };
    end?: { column?: number; line?: number };
  };
  children?: Array<{ type?: string; tagName?: string }>;
}

function isBlockCodeNode(node: unknown, className: string | undefined): boolean {
  const position = (node as MarkdownNodePosition | undefined)?.position;

  return Boolean(className) || Boolean(
    position?.start?.line
    && position?.end?.line
    && position.end.line > position.start.line
    && position.start.column !== undefined
    && position.start.column <= 4
    && position.end.column !== undefined
    && position.end.column <= 4
  );
}

function getCellStyle(style: CSSProperties | undefined, align: string | undefined): CSSProperties | undefined {
  const nextStyle: CSSProperties = { ...style };

  if (align === "left" || align === "center" || align === "right") {
    nextStyle.textAlign = align;
  }

  return Object.keys(nextStyle).length > 0 ? nextStyle : undefined;
}

function scrollToFragment(event: MouseEvent<HTMLAnchorElement>, href: string) {
  const root = event.currentTarget.closest(".cc-markdown");
  let fragment = href.slice(1);
  try {
    fragment = decodeURIComponent(fragment);
  } catch {
    return;
  }

  const target = root?.querySelector(`[id="${CSS.escape(fragment)}"]`);
  if (!target) {
    return;
  }

  event.preventDefault();
  target.scrollIntoView({ block: "start" });
}

function DiagramBlock({ chart }: { chart: string }) {
  const options = useContext(MarkdownRenderOptionsContext);

  return (
    <MarkdownRenderBoundary resetKey={chart} fallback={<pre className="cc-markdown-raw">{chart}</pre>}>
      <MermaidBlock chart={chart} renderImmediately={options.renderDiagramsImmediately} />
    </MarkdownRenderBoundary>
  );
}

function createComponents(frontmatterFields: MarkdownFrontmatter["fields"]): Components {
  return {
    a({ node: _node, children, href, ...props }) {
      void _node;
      if (href?.startsWith("#")) {
        return <a {...props} href={href} onClick={(event) => scrollToFragment(event, href)}>{children}</a>;
      }

      return <a {...props} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    },
    blockquote({ children }) {
      return (
        <MarkdownRenderBoundary resetKey={String(children)} fallback={<blockquote>{children}</blockquote>}>
          <MarkdownAlert>{children}</MarkdownAlert>
        </MarkdownRenderBoundary>
      );
    },
    table({ children }) {
      return (
        <div className="cc-markdown-table-wrap custom-scrollbar">
          <table>{children}</table>
        </div>
      );
    },
    li({ node: _node, children, ...props }) {
      void _node;
      return <li {...props}>{children}</li>;
    },
    th({ node: _node, children, align, style, ...props }) {
      void _node;
      return <th {...props} style={getCellStyle(style, align)}>{children}</th>;
    },
    td({ node: _node, children, align, style, ...props }) {
      void _node;
      return <td {...props} style={getCellStyle(style, align)}>{children}</td>;
    },
    code({ children, className, node }) {
      const code = String(children).replace(/\n$/, "");

      if (getMarkdownCodeLanguage(className)?.id === "mermaid") {
        return <DiagramBlock chart={code} />;
      }

      return <CodeBlock className={className} inline={!isBlockCodeNode(node, className)}>{code}</CodeBlock>;
    },
    pre({ children, node }) {
      const firstChild = (node as MarkdownNodePosition | undefined)?.children?.[0];
      if (firstChild?.type === "element" && firstChild.tagName === "code") {
        return <>{children}</>;
      }

      return <pre className="cc-markdown-raw">{children}</pre>;
    },
    div({ node: _node, children, id, ...props }) {
      void _node;
      if (id === `user-content-${markdownFrontmatterTableId}`) {
        return <MarkdownFrontmatterTable fields={frontmatterFields} />;
      }

      return <div {...props} id={id}>{children}</div>;
    },
    input({ node: _node, type, checked, disabled, ...props }) {
      void _node;
      if (type === "checkbox") {
        return <input {...props} type="checkbox" checked={Boolean(checked)} disabled={disabled} readOnly />;
      }

      return <input {...props} type={type} disabled={disabled} />;
    }
  };
}

interface MarkdownDocumentRendererProps {
  value: string;
  options?: MarkdownRenderOptions;
}

export function MarkdownContentStyles() {
  return <style href={markdownContentStyleHref} precedence={markdownContentStylePrecedence}>{markdownContentCss}</style>;
}

export function MarkdownDocumentRenderer({ value, options }: MarkdownDocumentRendererProps) {
  const prepared = useMemo(() => prepareMarkdownSource(value), [value]);
  const components = useMemo(() => createComponents(prepared.frontmatterFields), [prepared.frontmatterFields]);
  const renderOptions = useMemo(() => options ?? {}, [options]);
  let content: ReactNode = null;

  if (prepared.source.trim()) {
    content = (
      <MarkdownRenderBoundary resetKey={prepared.source} fallback={<pre className="cc-markdown-fallback">{prepared.source.trim()}</pre>}>
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins as never} remarkRehypeOptions={remarkRehypeOptions} components={components}>
          {prepared.source}
        </ReactMarkdown>
      </MarkdownRenderBoundary>
    );
  }

  return (
    <MarkdownRenderOptionsContext.Provider value={renderOptions}>
      <MarkdownContentStyles />
      {prepared.invalidFrontmatterRaw !== null && <pre className="cc-markdown-raw">{prepared.invalidFrontmatterRaw}</pre>}
      {!prepared.hasFrontmatterTableMarker && <MarkdownFrontmatterTable fields={prepared.frontmatterFields} />}
      {content}
    </MarkdownRenderOptionsContext.Provider>
  );
}
