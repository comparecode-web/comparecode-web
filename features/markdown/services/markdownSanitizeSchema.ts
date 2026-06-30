import { defaultSchema } from "rehype-sanitize";

const defaultAttributes = defaultSchema.attributes ?? {};

export const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details",
    "div",
    "ins",
    "kbd",
    "mark",
    "p",
    "sub",
    "summary",
    "sup",
    "u"
  ],
  attributes: {
    ...defaultAttributes,
    details: [
      ...(defaultAttributes.details ?? []),
      "open"
    ],
    div: [
      ...(defaultAttributes.div ?? []),
      ["align", "left", "center", "right"]
    ],
    img: [
      ...(defaultAttributes.img ?? []),
      "height",
      "width"
    ],
    p: [
      ...(defaultAttributes.p ?? []),
      ["align", "left", "center", "right"]
    ],
    th: [
      ...(defaultAttributes.th ?? []),
      ["align", "left", "center", "right"],
      "colSpan",
      "rowSpan",
      "colspan",
      "rowspan"
    ],
    td: [
      ...(defaultAttributes.td ?? []),
      ["align", "left", "center", "right"],
      "colSpan",
      "rowSpan",
      "colspan",
      "rowspan"
    ]
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"]
  }
};
