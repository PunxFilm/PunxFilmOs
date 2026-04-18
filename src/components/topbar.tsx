"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { useShell } from "@/components/shell-context";

const CRUMBS: Record<string, string[]> = {
  dashboard: ["Home", "Dashboard"],
  notifications: ["Home", "Notifiche"],
  tasks: ["Home", "Task"],
  films: ["Catalogo", "Film"],
  festivals: ["Catalogo", "Festival"],
  strategies: ["Distribuzione", "Strategie"],
  submissions: ["Distribuzione", "Iscrizioni"],
  calendar: ["Distribuzione", "Calendario"],
  finance: ["Distribuzione", "Finanza"],
  team: ["Sistema", "Team"],
  import: ["Sistema", "Import"],
  settings: ["Sistema", "Impostazioni"],
  profile: ["Home", "Profilo"],
};

function resolveCrumbs(pathname: string): string[] {
  const clean = pathname.replace(/^\//, "").split("/");
  const first = clean[0] || "dashboard";
  const base = CRUMBS[first] || ["Home"];
  // Detail / sub-pages
  if (clean.length > 1) {
    const sub = clean[1];
    if (sub === "new") return [...base, "Nuovo"];
    if (sub === "wizard") return [...base, "Wizard"];
    if (sub === "analytics") return [...base, "Analytics"];
    if (first === "festivals" || first === "films" || first === "strategies" || first === "submissions" || first === "tasks") {
      return [...base, "Dettaglio"];
    }
  }
  return base;
}

export function Topbar() {
  const pathname = usePathname() || "/";
  const { theme, toggleTheme, setCmdOpen, aiOn, setAiOn } = useShell();
  const crumbs = resolveCrumbs(pathname);

  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="crumb-sep">/</span>}
            <span className={i === crumbs.length - 1 ? "crumb-current" : ""}>{c}</span>
          </Fragment>
        ))}
      </div>
      <div className="topbar-right">
        <button
          type="button"
          className="cmd-trigger"
          onClick={() => setCmdOpen(true)}
          aria-label="Apri cerca / comandi"
        >
          <Icon name="search" size={13} />
          <span>Cerca film, festival, comandi…</span>
          <span className="cmd-kbd">⌘K</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setAiOn(!aiOn)}
          title="Pannello AI"
          style={
            aiOn
              ? { background: "var(--purple-bg)", color: "var(--purple)" }
              : undefined
          }
        >
          <Icon name="spark" size={14} />
        </button>
        <button type="button" className="icon-btn" title="Notifiche">
          <Icon name="bell" size={14} />
          <span className="ib-dot" />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          title="Tema"
        >
          <Icon name={theme === "light" ? "moon" : "sun"} size={14} />
        </button>
      </div>
    </div>
  );
}
