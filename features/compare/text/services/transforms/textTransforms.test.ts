import { describe, expect, it } from "vitest";
import { joinLines, sortLines, toLowercase, trimWhitespace } from "./textTransforms";

describe("text transforms", () => {
  it("lowercases text without touching line endings", () => {
    expect(toLowercase("ÁRVÍZ\r\nTŰRŐ\nİ")).toBe("árvíz\r\ntűrő\ni̇");
    expect(toLowercase("")).toBe("");
  });

  it("trims both ends of every line and keeps each line ending", () => {
    expect(trimWhitespace("  a  \r\n\tb\t\n c\r  \n")).toBe("a\r\nb\nc\r\n");
    expect(trimWhitespace("   ")).toBe("");
    expect(trimWhitespace("no change")).toBe("no change");
  });

  it("sorts lines naturally and keeps the dominant line ending and final line ending", () => {
    expect(sortLines("item10\nitem2\nItem1\n", "en")).toBe("Item1\nitem2\nitem10\n");
    expect(sortLines("b\r\na\r\nc", "en")).toBe("a\r\nb\r\nc");
    expect(sortLines("b\r\nc\na\r\n", "en")).toBe("a\r\nb\r\nc\r\n");
    expect(sortLines("b\n\na\n", "en")).toBe("\na\nb\n");
    expect(sortLines("single", "en")).toBe("single");
    expect(sortLines("", "en")).toBe("");
    expect(sortLines("ő\nö\no\nz\n", "hu")).toBe("o\nö\nő\nz\n");
  });

  it("replaces line breaks with spaces and drops trailing line breaks", () => {
    expect(joinLines("a\nb\r\nc\rd\n\n")).toBe("a b c d");
    expect(joinLines("a\n\nb")).toBe("a  b");
    expect(joinLines("")).toBe("");
  });
});
