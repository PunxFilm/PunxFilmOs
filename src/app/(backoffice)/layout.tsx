import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
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
    <div className="md:flex md:h-screen">
      <Sidebar
        userName={session.user.name || session.user.email}
        userEmail={session.user.email}
      />
      <main className="flex-1 md:overflow-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
