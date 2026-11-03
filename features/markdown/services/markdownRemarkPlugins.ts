import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { remarkSoftLineBreaks } from "@/features/markdown/services/markdownSoftBreaks";
import { remarkMarkdownSpecialBlocks } from "@/features/markdown/services/remarkMarkdownSpecialBlocks";

export const markdownBaseRemarkPlugins = [remarkGfm, remarkGemoji, remarkMath, remarkMarkdownSpecialBlocks, remarkSoftLineBreaks];
