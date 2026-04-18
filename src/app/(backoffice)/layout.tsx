import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { AiPanel } from "@/components/ai-panel";
import { CommandPalette } from "@/components/command-palette";
import { ShellProvider } from "@/components/shell-context";
import { auth } from "@/auth";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ShellProvider>
      <div className="app">
        <Sidebar
          userName={session.user.name || session.user.email}
          userEmail={session.user.email}
        />
        <div className="main">
          <Topbar />
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <div className="content">{children}</div>
            <AiPanel />
          </div>
        </div>
      </div>
      <CommandPalette />
    </ShellProvider>
  );
}
