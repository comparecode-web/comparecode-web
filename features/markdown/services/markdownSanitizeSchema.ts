import { defaultSchema } from "rehype-sanitize";

const defaultAttributes = defaultSchema.attributes ?? {};

export const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "div",
    "p"
  ],
  attributes: {
    ...defaultAttributes,
    div: [
      ...(defaultAttributes.div ?? []),
      ["align", "left", "center", "right"]
    ],
    p: [
      ...(defaultAttributes.p ?? []),
      ["align", "left", "center", "right"]
    ]
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"]
  }
};
