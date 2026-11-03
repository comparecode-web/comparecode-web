import { TEXT_SYNTAX_LANGUAGES, type TextSyntaxLanguage } from "@/types/settings";
import { tokenizeSyntax, type SyntaxLine } from "@/services/syntax/tokenizeSyntax";

const scannerLanguageAliases: Record<string, TextSyntaxLanguage> = {
  html: "htmlxml",
  xml: "htmlxml"
};

const cacheLimit = 64;
const cache = new Map<string, Array<SyntaxLine> | null>();

export function getScannerLanguage(languageId: string | undefined): TextSyntaxLanguage | null {
  if (!languageId) {
    return null;
  }

  const alias = scannerLanguageAliases[languageId];
  if (alias) {
    return alias;
  }

  return (TEXT_SYNTAX_LANGUAGES as ReadonlyArray<string>).includes(languageId) && languageId !== "plain"
    ? languageId as TextSyntaxLanguage
    : null;
}

export function highlightMarkdownCode(source: string, languageId: string | undefined): Array<SyntaxLine> | null {
  const language = getScannerLanguage(languageId);
  if (!language) {
    return null;
  }

  const key = `${language}\u0000${source}`;
  if (cache.has(key)) {
    const cached = cache.get(key) ?? null;
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const result = tokenizeSyntax(source, language);
  const lines = result.limited ? null : result.lines;
  cache.set(key, lines);

  if (cache.size > cacheLimit) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  return lines;
}
