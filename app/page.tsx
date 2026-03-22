"use client";

import { Header } from "@/components/layout/Header";
import { EditorView } from "@/components/editor/EditorView";
import { HistoryView } from "@/components/history/HistoryView";
import { MainSettingsView } from "@/components/settings/MainSettingsView";
import { useAppStore } from "@/store/useAppStore";

export default function Home() {
  const currentView = useAppStore((state) => state.currentView);

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-gray-50">
      <Header />
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {currentView === "editor" && <EditorView />}
        {currentView === "history" && <HistoryView />}
        {currentView === "settings" && <MainSettingsView />}
      </main>
    </div>
  );
}