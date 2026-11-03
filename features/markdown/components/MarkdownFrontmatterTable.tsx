import type { MarkdownFrontmatter } from "@/features/markdown/services/markdownFrontmatter";

interface MarkdownFrontmatterTableProps {
  fields: MarkdownFrontmatter["fields"];
}

export function MarkdownFrontmatterTable({ fields }: MarkdownFrontmatterTableProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="cc-markdown-frontmatter">
      <table>
        <tbody>
          {fields.map((field) => (
            <tr key={field.key}>
              <th>{field.key}</th>
              <td>
                {Array.isArray(field.value) ? (
                  <div className="cc-markdown-frontmatter-tags">
                    {field.value.map((tag) => (
                      <span key={tag} className="cc-markdown-frontmatter-tag">{tag}</span>
                    ))}
                  </div>
                ) : (
                  <span>{field.value}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
