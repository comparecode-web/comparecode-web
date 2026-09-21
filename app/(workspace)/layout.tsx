import { Header } from "@/components/layout/Header";
import { WorkspaceSidebarProvider } from "@/components/layout/WorkspaceSidebarContext";
import { NavigationSidebar } from "@/components/layout/NavigationSidebar";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceSidebarProvider>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg-secondary">
        <Header />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <NavigationSidebar />
          <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </WorkspaceSidebarProvider>
  );
}
