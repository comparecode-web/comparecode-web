import { notFound } from "next/navigation";
import { UiComponentsPreview } from "@/components/dev/UiComponentsPreview";

export const metadata = { title: "UI components", robots: { index: false, follow: false } };

export default function UiComponentsPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <UiComponentsPreview />;
}
