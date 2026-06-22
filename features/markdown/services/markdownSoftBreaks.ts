interface MarkdownNode {
  type?: string;
  value?: string;
  children?: Array<MarkdownNode>;
}

function splitSoftBreakText(node: MarkdownNode): Array<MarkdownNode> {
  if (node.type !== "text" || typeof node.value !== "string" || !node.value.includes("\n")) {
    return [node];
  }

  const parts = node.value.split("\n");
  const nextNodes: Array<MarkdownNode> = [];

  for (let index = 0; index < parts.length; index++) {
    if (parts[index]) {
      nextNodes.push({ ...node, value: parts[index] });
    }

    if (index < parts.length - 1) {
      nextNodes.push({ type: "break" });
    }
  }

  return nextNodes;
}

function transformSoftBreaks(node: MarkdownNode): MarkdownNode {
  if (!node.children) {
    return node;
  }

  node.children = node.children.flatMap((child) => splitSoftBreakText(transformSoftBreaks(child)));
  return node;
}

export function remarkSoftLineBreaks() {
  return (tree: MarkdownNode) => {
    transformSoftBreaks(tree);
  };
}
