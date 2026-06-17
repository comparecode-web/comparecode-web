import type { Metadata } from "next";
import { MainSettingsView } from "@/components/settings/MainSettingsView";
import { settingsMetadata } from "@/config/seo";

export const metadata: Metadata = {
  ...settingsMetadata,
  robots: {
    index: false,
    follow: false
  }
};

export default function SettingsPage() {
  return <MainSettingsView />;
}
