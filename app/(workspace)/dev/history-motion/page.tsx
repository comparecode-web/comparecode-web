import { notFound } from "next/navigation";
import { HistoryMotionPlayground } from "@/components/history/HistoryMotionPlayground";

export default function HistoryMotionPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <HistoryMotionPlayground />;
}
