"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  count?: number | null;
  dot?: boolean;
};
type NavSection = { g: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    g: "Operazioni",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dash", dot: true },
      { href: "/notifications", label: "Notifiche", icon: "bell" },
      { href: "/tasks", label: "Task", icon: "task" },
    ],
  },
  {
    g: "Catalogo",
    items: [
      { href: "/films", label: "Film", icon: "film" },
      { href: "/festivals", label: "Festival", icon: "festival" },
    ],
  },
  {
    g: "Distribuzione",
    items: [
      { href: "/strategies", label: "Strategie", icon: "strategy" },
      { href: "/submissions", label: "Iscrizioni", icon: "submit" },
      { href: "/calendar", label: "Calendario", icon: "calendar" },
      { href: "/finance", label: "Finanza", icon: "money" },
    ],
  },
  {
    g: "Sistema",
    items: [
      { href: "/team", label: "Team", icon: "team" },
      { href: "/import", label: "Import", icon: "import" },
      { href: "/settings", label: "Impostazioni", icon: "settings" },
    ],
  },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (userName || userEmail || "SP")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SP";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span className="brand-name">PunxFilm</span>
            <span className="brand-os">distribution os</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {NAV.map((sec) => (
          <div key={sec.g} className="nav-section">
            <div className="nav-title">{sec.g}</div>
            {sec.items.map((it) => {
              const isActive =
                pathname === it.href || pathname.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon name={it.icon} size={14} className="n-icon" />
                  <span>{it.label}</span>
                  {it.count != null && (
                    <span className="n-count">
                      {it.count > 999
                        ? (it.count / 1000).toFixed(1) + "k"
                        : it.count}
                    </span>
                  )}
                  {it.dot && it.count == null && <span className="n-dot" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="sidebar-footer" style={{ position: "relative" }}>
        <button
          type="button"
          className="user-chip"
          onClick={() => setMenuOpen((v) => !v)}
          style={{ width: "100%" }}
        >
          <div className="user-av">{initials}</div>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName || "Simone"}
            </div>
            <div className="user-role">Admin · PunxFilm</div>
          </div>
          <Icon name="chevD" size={12} style={{ color: "var(--fg-4)" }} />
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 10,
              right: 10,
              background: "var(--card)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--r)",
              padding: 4,
              zIndex: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="nav-item"
              style={{ padding: "6px 10px" }}
            >
              <span>Profilo</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="nav-item"
              style={{
                padding: "6px 10px",
                width: "100%",
                textAlign: "left",
                color: "var(--accent)",
              }}
            >
              Esci
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
