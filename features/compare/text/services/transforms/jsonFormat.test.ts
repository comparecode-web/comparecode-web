import { describe, expect, it } from "vitest";
import { formatJson, JSON_INPUT_LIMIT, minifyJson, sortJsonKeys } from "./jsonFormat";
import { TextTransformError } from "./textTransforms";

const errorOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(TextTransformError);
    return (error as Error).message;
  }
  throw new Error("Expected a transform error");
};

describe("JSON formatting", () => {
  it("formats with the chosen indentation", () => {
    const source = "{\"a\":1,\"b\":[true,false,null],\"c\":{}}";
    expect(formatJson(source).text).toBe("{\n  \"a\": 1,\n  \"b\": [\n    true,\n    false,\n    null\n  ],\n  \"c\": {}\n}");
    expect(formatJson(source, "4").text).toContain("\n    \"a\": 1");
    expect(formatJson(source, "tab").text).toContain("\n\t\"a\": 1");
    expect(formatJson("[]").text).toBe("[]");
    expect(formatJson("  \"text\"  ").text).toBe("\"text\"");
  });

  it("keeps numbers, strings, escapes, and key order exactly", () => {
    const source = "{\"10\":1,\"2\":2,\"id\":12345678901234567890,\"f\":1.0,\"e\":1E+2,\"z\":-0,\"s\":\"\\u00e9\\n\\\"q\\\" \\ud83d\\ude00\",\"u\":\"é😀\"}";
    const minified = minifyJson(source).text;
    expect(minified).toBe(source);
    const formatted = formatJson(source).text;
    expect(formatted).toContain("\"id\": 12345678901234567890");
    expect(formatted).toContain("\"f\": 1.0");
    expect(formatted).toContain("\"e\": 1E+2");
    expect(formatted).toContain("\"z\": -0");
    expect(formatted).toContain("\"s\": \"\\u00e9\\n\\\"q\\\" \\ud83d\\ude00\"");
    expect(formatted.indexOf("\"10\"")).toBeLessThan(formatted.indexOf("\"2\""));
    expect(minifyJson(formatted).text).toBe(source);
  });

  it("keeps duplicate keys and warns about them", () => {
    const result = formatJson("{\"a\":1,\"a\":2,\"b\":{\"c\":1,\"c\":2}}");
    expect(result.text.match(/"a"/g)).toHaveLength(2);
    expect(result.warning).toBe("The JSON contains 2 duplicate property names. All values are kept.");
    expect(formatJson("{\"a\":1,\"a\":2}").warning).toBe("The JSON contains a duplicate property name. Both values are kept.");
  });

  it("sorts keys recursively by code unit and keeps array order", () => {
    const result = sortJsonKeys("{\"b\":1,\"a\":{\"d\":[3,1],\"c\":true},\"B\":0,\"é\":2,\"a\":0}");
    expect(result.text).toBe("{\n  \"B\": 0,\n  \"a\": {\n    \"c\": true,\n    \"d\": [\n      3,\n      1\n    ]\n  },\n  \"a\": 0,\n  \"b\": 1,\n  \"é\": 2\n}");
  });

  it("accepts a byte order mark and keeps the source line ending style", () => {
    expect(formatJson("\uFEFF{\"a\":1}").text).toBe("{\n  \"a\": 1\n}");
    expect(formatJson("{\r\n\"a\":1\r\n}\r\n").text).toBe("{\r\n  \"a\": 1\r\n}\r\n");
    expect(minifyJson("{\n  \"a\": 1\n}\n").text).toBe("{\"a\":1}");
  });

  it.each([
    ["", "line 1, column 1: there is no JSON to format"],
    ["{\"a\":1,}", "line 1, column 8: trailing commas are not allowed in JSON"],
    ["[1,2,]", "line 1, column 6: trailing commas are not allowed in JSON"],
    ["{\n  // note\n  \"a\": 1\n}", "line 2, column 3: comments are not allowed in JSON"],
    ["{'a': 1}", "line 1, column 2: expected a property name in double quotes"],
    ["['a']", "line 1, column 2: strings must use double quotes"],
    ["{\"a\" 1}", "line 1, column 6: expected \":\" after a property name"],
    ["[1 2]", "line 1, column 4: expected \",\" or \"]\""],
    ["{\"a\":1} x", "line 1, column 9: unexpected content after the JSON value"],
    ["{\"a\":\"\\x\"}", "line 1, column 7: invalid escape sequence"],
    ["\"a\tb\"", "line 1, column 3: control characters must be escaped in strings"],
    ["{\"a\":\"open", "line 1, column 6: unterminated string"],
    ["01", "line 1, column 2: unexpected content after the JSON value"],
    ["NaN", "line 1, column 1: unexpected character \"N\""],
    ["[", "line 1, column 2: unexpected end of JSON"]
  ])("rejects %j with a precise position", (source, message) => {
    expect(errorOf(() => formatJson(source))).toBe(`Invalid JSON at ${message}.`);
  });

  it("handles very deep nesting without recursion", () => {
    const depth = 100_000;
    const deep = "[".repeat(depth) + "]".repeat(depth);
    expect(minifyJson(deep).text).toBe(deep);
    const formatted = formatJson("[".repeat(500) + "1" + "]".repeat(500)).text;
    expect(formatted.split("\n")).toHaveLength(1001);
  });

  it("enforces input and output size limits", () => {
    expect(errorOf(() => formatJson(" ".repeat(JSON_INPUT_LIMIT + 1)))).toBe("JSON larger than 5 MB cannot be formatted.");
    expect(errorOf(() => formatJson("[".repeat(10_000) + "]".repeat(10_000)))).toBe("The formatted JSON would be larger than 20 MB.");
  });
});
