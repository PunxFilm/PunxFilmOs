"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/notifications", label: "Notifiche" },
  { href: "/films", label: "Film" },
  { href: "/festivals", label: "Festival" },
  { href: "/strategies", label: "Strategie" },
  { href: "/submissions", label: "Iscrizioni" },
  { href: "/tasks", label: "Task" },
  { href: "/finance", label: "Finanza" },
  { href: "/calendar", label: "Calendario" },
  { href: "/team", label: "Team" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Impostazioni" },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <Link href="/dashboard" className="font-bold text-sm">
          PunxFilm OS
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Apri menu"
          className="p-2 -mr-2 rounded-md hover:bg-[var(--secondary)]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 z-40 h-screen w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[var(--card)] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">PunxFilm OS</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Distribution Platform</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
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
        <div className="p-3 border-t border-[var(--border)] space-y-2">
          {userName && (
            <div className="px-3 py-1">
              <p className="text-sm font-medium truncate">{userName}</p>
              {userEmail && userEmail !== userName && (
                <p className="text-xs text-[var(--muted-foreground)] truncate">{userEmail}</p>
              )}
            </div>
          )}
          <Link
            href="/profile"
            onClick={closeMobile}
            className="block px-3 py-2 rounded-md text-sm hover:bg-[var(--secondary)]"
          >
            Profilo
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[var(--secondary)] text-[var(--destructive)]"
          >
            Esci
          </button>
        </div>
      </aside>
    </>
  );
}
