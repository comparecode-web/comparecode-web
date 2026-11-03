export type MermaidThemeVariables = Record<string, string | boolean>;

interface MermaidRenderRequest {
  id: string;
  chart: string;
  themeVariables: MermaidThemeVariables;
  htmlLabels?: boolean;
}

let queue: Promise<unknown> = Promise.resolve();

function readVariable(style: CSSStyleDeclaration, name: string, fallback: string): string {
  return style.getPropertyValue(name).trim() || fallback;
}

export function readMermaidThemeVariables(element: Element): MermaidThemeVariables {
  const style = getComputedStyle(element);
  const background = readVariable(style, "--markdown-mermaid-bg", "#eef2f7");
  const nodeBackground = readVariable(style, "--markdown-mermaid-node-bg", "#e7eefc");
  const nodeBorder = readVariable(style, "--markdown-mermaid-node-border", "#2563eb");
  const nodeText = readVariable(style, "--markdown-mermaid-node-fg", "#24292e");
  const line = readVariable(style, "--markdown-mermaid-line", "#6b7280");
  const labelBackground = readVariable(style, "--markdown-mermaid-label-bg", "#fdf3d8");
  const labelText = readVariable(style, "--markdown-mermaid-label-fg", "#24292e");
  const clusterBackground = readVariable(style, "--markdown-mermaid-cluster-bg", "#f2f4f7");
  const clusterBorder = readVariable(style, "--markdown-mermaid-cluster-border", "#c7d0dc");
  const text = readVariable(style, "--text-primary", "#24292e");

  return {
    background,
    darkMode: readVariable(style, "color-scheme", "light").includes("dark"),
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    primaryColor: nodeBackground,
    primaryTextColor: nodeText,
    primaryBorderColor: nodeBorder,
    mainBkg: nodeBackground,
    nodeBkg: nodeBackground,
    nodeBorder,
    nodeTextColor: nodeText,
    secondaryColor: labelBackground,
    secondaryTextColor: labelText,
    secondaryBorderColor: clusterBorder,
    tertiaryColor: clusterBackground,
    tertiaryTextColor: text,
    tertiaryBorderColor: clusterBorder,
    lineColor: line,
    defaultLinkColor: line,
    arrowheadColor: line,
    textColor: text,
    titleColor: text,
    edgeLabelBackground: labelBackground,
    clusterBkg: clusterBackground,
    clusterBorder,
    actorBkg: nodeBackground,
    actorBorder: nodeBorder,
    actorTextColor: nodeText,
    actorLineColor: line,
    signalColor: line,
    signalTextColor: text,
    labelBoxBkgColor: labelBackground,
    labelBoxBorderColor: nodeBorder,
    labelTextColor: labelText,
    loopTextColor: text,
    noteBkgColor: readVariable(style, "--markdown-mermaid-note-bg", "#d9ecd3"),
    noteTextColor: readVariable(style, "--markdown-mermaid-note-fg", "#24292e"),
    noteBorderColor: readVariable(style, "--markdown-mermaid-note-border", "#1a7f37")
  };
}

export function renderMermaidDiagram({ id, chart, themeVariables, htmlLabels = true }: MermaidRenderRequest): Promise<string> {
  const task = queue.then(async () => {
    const mermaid = (await import("mermaid/dist/mermaid.esm.min.mjs")).default;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: "base",
      htmlLabels,
      themeVariables
    });

    try {
      const result = await mermaid.render(id, chart);
      return result.svg;
    } finally {
      document.getElementById(`d${id}`)?.remove();
    }
  });

  queue = task.catch(() => undefined);
  return task;
}
