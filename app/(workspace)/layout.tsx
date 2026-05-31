import { Header } from "@/components/layout/Header";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-gray-50">
      <Header />
      <main className="flex min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
