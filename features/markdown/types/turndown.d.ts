declare module "turndown" {
  interface TurndownOptions {
    headingStyle?: "setext" | "atx";
    hr?: string;
    bulletListMarker?: "-" | "+" | "*";
    codeBlockStyle?: "indented" | "fenced";
    fence?: "```" | "~~~";
    emDelimiter?: "_" | "*";
    strongDelimiter?: "__" | "**";
    linkStyle?: "inlined" | "referenced";
    linkReferenceStyle?: "full" | "collapsed" | "shortcut";
    preformattedCode?: boolean;
  }

  type TurndownPlugin = (service: TurndownService) => void;

  export default class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(input: string | Node): string;
    use(plugin: TurndownPlugin | TurndownPlugin[]): this;
    keep(filter: string | string[]): this;
  }
}
