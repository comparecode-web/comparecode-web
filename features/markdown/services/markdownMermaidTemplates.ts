export const markdownMermaidTemplates = [
  {
    id: "flowchart",
    label: "Flowchart",
    source: "flowchart TD\n  Start[Start] --> Check{Is it ready?}\n  Check -->|Yes| Ship[Ship it]\n  Check -->|No| Fix[Fix the issue]\n  Fix --> Check"
  },
  {
    id: "sequence",
    label: "Sequence diagram",
    source: "sequenceDiagram\n  participant User\n  participant App\n  User->>App: Open the document\n  App-->>User: Show the preview\n  User->>App: Edit the text\n  App-->>User: Update the preview"
  },
  {
    id: "class",
    label: "Class diagram",
    source: "classDiagram\n  class Document {\n    +String title\n    +save()\n  }\n  class Section {\n    +String heading\n  }\n  Document \"1\" --> \"*\" Section : contains"
  },
  {
    id: "state",
    label: "State diagram",
    source: "stateDiagram-v2\n  [*] --> Draft\n  Draft --> Review : Submit\n  Review --> Draft : Request changes\n  Review --> Published : Approve\n  Published --> [*]"
  },
  {
    id: "gantt",
    label: "Gantt chart",
    source: "gantt\n  title Project plan\n  dateFormat YYYY-MM-DD\n  section Planning\n    Research :done, research, 2026-01-05, 5d\n    Design :active, design, after research, 4d\n  section Delivery\n    Build :build, after design, 6d\n    Release :milestone, after build, 0d"
  },
  {
    id: "pie",
    label: "Pie chart",
    source: "pie title Time spent\n  \"Writing\" : 45\n  \"Reviewing\" : 30\n  \"Publishing\" : 25"
  },
  {
    id: "mindmap",
    label: "Mind map",
    source: "mindmap\n  root((Project))\n    Goals\n      Clear notes\n      Fast reviews\n    Tasks\n      Draft\n      Review\n    Risks"
  }
] as const;

export type MarkdownMermaidTemplateId = typeof markdownMermaidTemplates[number]["id"];

export function getMarkdownMermaidTemplate(id: MarkdownMermaidTemplateId | undefined) {
  return markdownMermaidTemplates.find((template) => template.id === id) ?? markdownMermaidTemplates[0];
}
