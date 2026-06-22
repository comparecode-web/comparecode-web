import { markdownMetadata } from "@/config/seo";
import { MarkdownToolSection } from "./MarkdownToolSection";

export const metadata = markdownMetadata;

export default function MarkdownPage() {
  return <MarkdownToolSection />;
}
