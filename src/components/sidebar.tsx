"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/films", label: "Film" },
  { href: "/festivals", label: "Festival" },
  { href: "/strategies", label: "Strategie" },
  { href: "/submissions", label: "Iscrizioni" },
  { href: "/tasks", label: "Task" },
  { href: "/finance", label: "Finanza" },
  { href: "/settings", label: "Impostazioni" },
  { href: "/import", label: "Import" },
  { href: "/calendar", label: "Calendario" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold">PunxFilm OS</h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Distribution Platform
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-[var(--secondary)] font-medium"
                  : "hover:bg-[var(--secondary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
