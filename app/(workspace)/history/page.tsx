import type { Metadata } from "next";
import { HistoryView } from "@/components/history/HistoryView";
import { historyMetadata } from "@/config/seo";

export const metadata: Metadata = {
  ...historyMetadata,
  robots: {
    index: false,
    follow: false
  }
};

export default function HistoryPage() {
  return <HistoryView />;
}
