"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { useShell } from "@/components/shell-context";

type CmdRow = { label: string; ico: IconName; href?: string; ai?: boolean };

const NAV: CmdRow[] = [
  { label: "Vai a Dashboard", ico: "dash", href: "/dashboard" },
  { label: "Vai a Festival", ico: "festival", href: "/festivals" },
  { label: "Vai a Film", ico: "film", href: "/films" },
  { label: "Vai a Strategie", ico: "strategy", href: "/strategies" },
  { label: "Vai a Iscrizioni", ico: "submit", href: "/submissions" },
  { label: "Vai a Calendario", ico: "calendar", href: "/calendar" },
  { label: "Vai a Finanza", ico: "money", href: "/finance" },
  { label: "Vai a Team", ico: "team", href: "/team" },
  { label: "Vai a Import", ico: "import", href: "/import" },
  { label: "Vai a Impostazioni", ico: "settings", href: "/settings" },
];

const ACTIONS: CmdRow[] = [
  { label: "Nuova iscrizione", ico: "plus", href: "/submissions/new" },
  { label: "Nuovo festival", ico: "plus", href: "/festivals/new" },
  { label: "Nuovo task", ico: "plus", href: "/tasks/new" },
  { label: "Importa da FilmFreeway/CSV", ico: "import", href: "/import" },
];

export function CommandPalette() {
  const { cmdOpen, setCmdOpen } = useShell();
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!cmdOpen) setQ("");
  }, [cmdOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setCmdOpen]);

  if (!cmdOpen) return null;

  const ai: CmdRow[] = [
    {
      label: `Classifica festival compatibili${q ? ` con "${q}"` : ""}`,
      ico: "spark",
      ai: true,
    },
    { label: "Suggerisci coda di iscrizione AI", ico: "spark", ai: true },
    { label: "Analizza sinossi e estrai metadata", ico: "spark", ai: true },
  ];

  const filter = (arr: CmdRow[]) =>
    q ? arr.filter((x) => x.label.toLowerCase().includes(q.toLowerCase())) : arr;

  const go = (href?: string) => {
    setCmdOpen(false);
    if (href) router.push(href);
  };

  return (
    <div className="overlay" onClick={() => setCmdOpen(false)}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <input
          className="cmd-input"
          placeholder="Cosa vuoi fare?"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="cmd-list">
          <div className="cmd-group-title">Suggerimenti AI</div>
          {filter(ai).map((x, i) => (
            <div key={`ai-${i}`} className="cmd-row ai">
              <Icon name={x.ico} size={14} style={{ color: "var(--purple)" }} />
              <span>{x.label}</span>
              <span className="cmd-kbd">↵</span>
            </div>
          ))}
          <div className="cmd-group-title">Navigazione</div>
          {filter(NAV).map((x, i) => (
            <div
              key={`nav-${i}`}
              className="cmd-row"
              onClick={() => go(x.href)}
            >
              <Icon name={x.ico} size={14} style={{ color: "var(--fg-3)" }} />
              <span>{x.label}</span>
            </div>
          ))}
          <div className="cmd-group-title">Azioni</div>
          {filter(ACTIONS).map((x, i) => (
            <div
              key={`act-${i}`}
              className="cmd-row"
              onClick={() => go(x.href)}
            >
              <Icon name={x.ico} size={14} style={{ color: "var(--fg-3)" }} />
              <span>{x.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
