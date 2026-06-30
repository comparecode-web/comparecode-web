export const markdownDefaultContent = `# CompareCode Community Note

## A Small Welcome

CompareCode is shaped for people who need a simple place to compare text, images, and Markdown without extra ceremony. If it helps your day, passing it along to someone else helps the project grow.

> [!NOTE]
> This sample shows how a CompareCode note can mix clean writing, small project plans, diagrams, formulas, tables, and code while staying local to your browser.

Inline links can point to project resources without leaving the editor flow.

[CompareCode repository](https://github.com/comparecode-web/comparecode-web)

Reference links keep long URLs out of the sentence text.[comparecode-docs]

[comparecode-docs]: https://github.com/comparecode-web/comparecode-web

## Frontmatter Example

The next table is generated from frontmatter fields in this same sample.

---
purpose: Friendly compare notes
workspace: Local browser draft
spirit: Open-source and ad-free
invitation: Share it when it helps
tags: ["compare-notes", "community", "open-source", "ad-free"]
---

<!-- comparecode-frontmatter-table -->

## First Draft Checklist

- [x] Open the Markdown preview
- [x] Try a few formatting tools
- [x] Keep the draft private in this browser
- [x] Preview diagrams, tables, emoji :rocket:, and formulas
- [ ] Share the finished note with a teammate, friend, or community space

## Formatting Notes

Use **bold**, *italic*, and ~~strikethrough~~ to shape short inline text around a short project update.

Use <mark>highlighting</mark> for the one detail readers should notice first, <u>underlining</u> for a small follow-up, and <kbd>Ctrl</kbd> + <kbd>Enter</kbd> when documenting a practical shortcut.

**This bold example intentionally spans multiple lines.
CompareCode should still keep the whole welcome sentence bold when the markers stay attached to text.**

*This italic example also spans multiple lines.
It can be useful when a project note wraps a gentle reminder across soft line breaks.*

~~This strikethrough example spans multiple lines as well.
It can mark an old plan that was replaced by a simpler path.~~

## Heading Scale

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## Quotes, Alerts, and Alignment

> Good tools feel quiet when the work matters more than the interface.

> [!TIP]
> Resize the split view until the editor and preview feel balanced for your current note.

> [!IMPORTANT]
> Your latest Markdown draft is restored from this browser. It is not synced to an account and is not added to CompareCode history.

> [!WARNING]
> Raw HTML is filtered through a safe allowlist, so unsupported or unsafe markup may be removed.

> [!CAUTION]
> Clearing browser storage can remove the saved Markdown draft.

<div align="left">
Left aligned note.
</div>

<div align="center">
Centered note.
</div>

<div align="right">
Right aligned note.
</div>

## Collapsed Note

<details>
<summary>Short checklist</summary>

- Review the Markdown preview
- Keep the useful notes

</details>

## Simple Sharing Plan

### Numbered List

1. Compare the changed text or image.
2. Save the useful observation as a Markdown note.
3. Send the clear result to the place where others can use it.

### Bullet List

- Clear comparisons
- Local drafts
- Open-source project notes
- Friendly examples for docs and issues
- A smoother way to explain changes

## Project Pulse Table

| Area | Today | Next Step | Why It Matters |
| --- | --- | --- | --- |
| Text compare | Ready for quick reviews | Share clearer examples | Helps people spot changes faster |
| Image compare | Useful for visual checks | Collect practical feedback | Makes design and asset review easier |
| Markdown preview | Good for notes and docs | Keep samples approachable | Gives every visitor a place to experiment |
| Community reach | Growing one share at a time | Invite someone who needs it | More users mean better feedback |

## Code Example

Inline code works like \`const noteStatus = "shared"\`.

\`\`\`ts
type ProjectNote = {
  headline: string;
  labels: string[];
  sharedWith: number;
};

function createThankYouLine(note: ProjectNote): string {
  const audience = note.sharedWith === 1 ? "person" : "people";
  return \`\${note.headline} reached \${note.sharedWith} \${audience} through CompareCode.\`;
}
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
flowchart TD
  UseApp[Use CompareCode for a real task] --> Helpful{Was it helpful?}
  Helpful -->|Yes| Share[Share it with someone who may need it]
  Share --> NewUser[New people try the app]
  NewUser --> UseApp
  Helpful -->|Not yet| Feedback[Send practical feedback]
  Feedback --> Improve[We improve the rough parts]
  Improve --> UseApp
\`\`\`

## KaTeX-rendered LaTeX-style Math

Inline math: $s = \\frac{shared\\ notes}{happy\\ readers}$

Block math:

$$
\\text{project reach} = \\sum_{i=1}^{n} \\left(1 + r_i\\right)
$$

## Compact Comparison Matrix

| Note Type | Clarity | Best Moment |
|:---|:---:|---:|
| Bug report 🐞 | High ✨ | Before opening an issue |
| Release note 📣 | Medium 📝 | After a small improvement |
| Friendly share 💬 | High 🚀 | When someone asks for a simple compare tool |

## HTML Table Spans

<table>
  <thead>
    <tr>
      <th rowspan="2">Moment</th>
      <th colspan="3">Helpful Signal</th>
    </tr>
    <tr>
      <th>Small Note</th>
      <th>Preview</th>
      <th>Share</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Before review</td>
      <td>What changed?</td>
      <td>Does it read well?</td>
      <td>Send the clean version</td>
    </tr>
    <tr>
      <td>After feedback</td>
      <td>What improved?</td>
      <td>Are links and tables clear?</td>
      <td>Invite another reader</td>
    </tr>
  </tbody>
</table>

`;
