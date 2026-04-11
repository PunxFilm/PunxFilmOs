"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ReportViewer } from "@/components/report-viewer";

// ── Agent definitions ──────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
  icon: string;
  command: string;
  reportType: string | null;
}

const agents: Agent[] = [
  {
    id: "direttore",
    name: "Direttore Generale",
    role: "Coordinamento",
    description: "Coordina tutti i reparti, genera report mattutini, gestisce priorita e workflow tra agenti.",
    color: "#6366f1",
    icon: "DG",
    command: "/punxfilm-direttore-generale",
    reportType: "morning-report",
  },
  {
    id: "festival",
    name: "Festival Manager",
    role: "Ricerca & DB",
    description: "Gestisce il database festival, cerca nuovi festival online, aggiorna dati, crea edizioni e monitora scadenze.",
    color: "#10b981",
    icon: "FM",
    command: "/punxfilm-festival-manager",
    reportType: "festival-research",
  },
  {
    id: "distribution",
    name: "Distribution Manager",
    role: "Distribuzione",
    description: "Crea piani di distribuzione, gestisce submission ai festival, traccia risultati e waiver code.",
    color: "#f59e0b",
    icon: "DM",
    command: "/punxfilm-distribution-manager",
    reportType: null,
  },
  {
    id: "finance",
    name: "Finance Controller",
    role: "Finanza",
    description: "Registra spese e entrate, calcola budget per film, monitora fee e genera report finanziari.",
    color: "#ef4444",
    icon: "FC",
    command: "/punxfilm-finance-controller",
    reportType: null,
  },
  {
    id: "qa",
    name: "QA Inspector",
    role: "Qualita",
    description: "Controlla qualita dati, verifica materiali film, trova duplicati e inconsistenze nel database.",
    color: "#8b5cf6",
    icon: "QA",
    command: "/punxfilm-qa-inspector",
    reportType: null,
  },
  {
    id: "ai-enhancer",
    name: "AI Enhancer",
    role: "Intelligenza",
    description: "Ottimizza prompt, migliora matching film-festival, aggiunge intelligence e analisi AI.",
    color: "#06b6d4",
    icon: "AI",
    command: "/punxfilm-ai-enhancer",
    reportType: null,
  },
  {
    id: "code-improver",
    name: "Code Improver",
    role: "Sviluppo",
    description: "Code review, refactoring, bug fix, performance e nuove feature per la piattaforma.",
    color: "#ec4899",
    icon: "CI",
    command: "/punxfilm-code-improver",
    reportType: null,
  },
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatusData {
  kpis: {
    festivalTotal: number;
    festivalVerified: number;
    festivalUnverified: number;
    editionCount: number;
    filmCount: number;
    submissionCount: number;
    planCount: number;
    taskCount: number;
    totalExpenses: number;
    totalIncome: number;
  };
  rotation: { week: number; region: string; startDate: string; endDate: string } | null;
  latestReports: Record<string, string>;
}

interface Report {
  filename: string;
  type: string;
  date: string | null;
  size: number;
  modifiedAt: string;
}

// ── Report type labels ─────────────────────────────────────────────────────────

const reportTypeLabels: Record<string, string> = {
  "morning-report": "Report Mattutino",
  "deadline-report": "Report Scadenze",
  "festival-research": "Ricerca Festival",
  "org-chart-agenti-punxfilm": "Organigramma Agenti",
};

// ── Page ────────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/team/status").then(r => r.json()),
      fetch("/api/team/reports").then(r => r.json()),
    ]).then(([s, r]) => {
      setStatus(s);
      setReports(r);
      setLoading(false);
    });
  }, []);

  const openReport = async (filename: string) => {
    const res = await fetch(`/api/team/reports/${encodeURIComponent(filename)}`);
    const data = await res.json();
    if (data.content) setViewingReport(data.content);
  };

  const kpis = status?.kpis;
  const verifiedPct = kpis && kpis.festivalTotal > 0
    ? Math.round((kpis.festivalVerified / kpis.festivalTotal) * 100)
    : 0;

  // Agent-specific KPI renderers
  function renderAgentKpis(agent: Agent) {
    if (!kpis) return null;
    switch (agent.id) {
      case "direttore":
        return (
          <div className="flex gap-4 text-xs">
            <span>Film: <strong>{kpis.filmCount}</strong></span>
            <span>Iscrizioni: <strong>{kpis.submissionCount}</strong></span>
            <span>Task aperti: <strong>{kpis.taskCount}</strong></span>
          </div>
        );
      case "festival":
        return (
          <div className="flex gap-4 text-xs">
            <span>Festival: <strong>{kpis.festivalTotal}</strong></span>
            <span>Verificati: <strong>{kpis.festivalVerified}</strong></span>
            <span>Edizioni: <strong>{kpis.editionCount}</strong></span>
          </div>
        );
      case "distribution":
        return (
          <div className="flex gap-4 text-xs">
            <span>Piani: <strong>{kpis.planCount}</strong></span>
            <span>Iscrizioni: <strong>{kpis.submissionCount}</strong></span>
          </div>
        );
      case "finance":
        return (
          <div className="flex gap-4 text-xs">
            <span>Spese: <strong>{"\u20AC"}{kpis.totalExpenses.toLocaleString("it-IT")}</strong></span>
            <span>Entrate: <strong>{"\u20AC"}{kpis.totalIncome.toLocaleString("it-IT")}</strong></span>
          </div>
        );
      case "qa":
        return (
          <div className="flex gap-4 text-xs">
            <span>Task aperti: <strong>{kpis.taskCount}</strong></span>
          </div>
        );
      default:
        return null;
    }
  }

  function getLatestReportForAgent(agent: Agent): string | null {
    if (!agent.reportType || !status?.latestReports) return null;
    return status.latestReports[agent.reportType] || null;
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Team PunxFilm" subtitle="7 agenti AI operativi" />
        <div className="text-sm text-[var(--muted-foreground)]">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader title="Team PunxFilm" subtitle="7 agenti AI operativi" />

      {/* ── Festival Manager Featured Section ──────────────────────────── */}
      <div className="rounded-xl border-2 border-emerald-500/50 bg-[var(--card)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "#10b981" }}
          >
            FM
          </div>
          <div>
            <h2 className="text-lg font-semibold">Festival Manager</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Gestione database e ricerca festival</p>
          </div>
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Ricerca & DB
          </span>
        </div>

        {/* Festival Stats */}
        {kpis && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-[var(--secondary)] p-3">
              <div className="text-2xl font-bold">{kpis.festivalTotal}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Festival totali</div>
            </div>
            <div className="rounded-lg bg-[var(--secondary)] p-3">
              <div className="text-2xl font-bold text-emerald-600">{kpis.festivalVerified}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Verificati</div>
            </div>
            <div className="rounded-lg bg-[var(--secondary)] p-3">
              <div className="text-2xl font-bold text-amber-600">{kpis.festivalUnverified}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Non verificati</div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {kpis && kpis.festivalTotal > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Progresso verifica</span>
              <span className="font-medium">{verifiedPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${verifiedPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Research rotation */}
        {status?.rotation && (
          <div className="rounded-lg border border-[var(--border)] p-3 text-sm">
            <span className="font-medium">Rotazione ricerca:</span>{" "}
            Settimana {status.rotation.week} &mdash; Regione: <strong>{status.rotation.region}</strong>
            <span className="text-xs text-[var(--muted-foreground)] ml-2">
              ({status.rotation.startDate} &rarr; {status.rotation.endDate})
            </span>
          </div>
        )}

        {/* Latest research report */}
        {status?.latestReports?.["festival-research"] && (
          <div className="text-sm">
            Ultimo report ricerca:{" "}
            <button
              onClick={() => openReport(status.latestReports["festival-research"])}
              className="text-emerald-600 hover:underline font-medium"
            >
              {status.latestReports["festival-research"]}
            </button>
          </div>
        )}

        <div className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] rounded-lg p-3 font-mono">
          Per lanciare la ricerca: <strong>/punxfilm-festival-manager</strong> nel terminale
        </div>
      </div>

      {/* ── Agent Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const latestReport = getLatestReportForAgent(agent);
          return (
            <div
              key={agent.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3"
              style={{ borderLeftWidth: "4px", borderLeftColor: agent.color }}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{agent.name}</div>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--secondary)] text-[var(--muted-foreground)]">
                    {agent.role}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                {agent.description}
              </p>

              {/* KPIs */}
              {renderAgentKpis(agent)}

              {/* Latest report */}
              {latestReport && (
                <div className="text-xs">
                  Ultimo report:{" "}
                  <button
                    onClick={() => openReport(latestReport)}
                    className="text-blue-600 hover:underline"
                  >
                    Vedi
                  </button>
                </div>
              )}

              {/* Command */}
              <div className="text-[10px] text-[var(--muted-foreground)] font-mono bg-[var(--secondary)] rounded px-2 py-1">
                {agent.command}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Report Timeline ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Report recenti</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Ultimi 20 report generati dagli agenti</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {reports.slice(0, 20).map((report) => (
            <div key={report.filename} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--secondary)] transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {reportTypeLabels[report.type] || report.type}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {report.date || "—"} &middot; {report.filename}
                </div>
              </div>
              <button
                onClick={() => openReport(report.filename)}
                className="text-xs text-blue-600 hover:underline flex-shrink-0"
              >
                Apri
              </button>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="p-4 text-sm text-[var(--muted-foreground)]">Nessun report trovato.</div>
          )}
        </div>
      </div>

      {/* ── Report Viewer Modal ────────────────────────────────────────── */}
      {viewingReport && (
        <ReportViewer content={viewingReport} onClose={() => setViewingReport(null)} />
      )}
    </div>
  );
}
