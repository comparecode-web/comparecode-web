import { describe, expect, it } from "vitest";
import { remarkSoftLineBreaks } from "@/features/markdown/services/markdownSoftBreaks";

describe("remarkSoftLineBreaks", () => {
  it("turns soft line breaks inside text nodes into markdown break nodes", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              value: "First line\nSecond line"
            }
          ]
        }
      ]
    };

    remarkSoftLineBreaks()(tree);

    expect(tree.children[0].children).toEqual([
      { type: "text", value: "First line" },
      { type: "break" },
      { type: "text", value: "Second line" }
    ]);
  });
});
