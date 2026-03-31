"use client";

import { Header } from "@/components/layout/Header";
import { TextView, ImageView } from "@/features/compare";
import { HistoryView } from "@/components/history/HistoryView";
import { MainSettingsView } from "@/components/settings/MainSettingsView";
import { useAppStore } from "@/store/useAppStore";

export default function Home() {
  const currentView = useAppStore((state) => state.currentView);

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-gray-50">
      <Header />
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {currentView === "text" && <TextView />}
        {currentView === "image" && <ImageView />}
        {currentView === "history" && <HistoryView />}
        {currentView === "settings" && <MainSettingsView />}
      </main>
    </div>
  );
}