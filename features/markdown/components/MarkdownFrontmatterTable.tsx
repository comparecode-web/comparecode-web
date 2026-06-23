import type { MarkdownFrontmatter } from "@/features/markdown/services/markdownFrontmatter";

interface MarkdownFrontmatterTableProps {
  fields: MarkdownFrontmatter["fields"];
}

export function MarkdownFrontmatterTable({ fields }: MarkdownFrontmatterTableProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 overflow-hidden rounded-sm border border-border-default bg-bg-primary">
      <table className="w-full table-fixed border-collapse text-sm">
        <tbody>
          {fields.map((field) => (
            <tr key={field.key} className="border-b border-border-default last:border-b-0">
              <th className="w-32 border-r border-border-default bg-bg-secondary px-3 py-2 text-right font-semibold text-text-primary">
                {field.key}
              </th>
              <td className="min-w-0 px-3 py-2 text-text-primary">
                {Array.isArray(field.value) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map((tag) => (
                      <span key={tag} className="rounded-full border border-border-default bg-bg-secondary px-2.5 py-0.5 text-xs font-semibold text-accent-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="break-words">{field.value}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
