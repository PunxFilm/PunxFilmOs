"use client";

import Link from "next/link";
import { DeadlineBadge } from "./deadline-badge";
import { QualifyingBadges } from "./qualifying-badges";
import { FeeDisplay } from "./fee-display";
import { StatusIndicator } from "./status-indicator";
import { CompatibilityBadge, compatibilityRowClass } from "./compatibility-badge";
import { SelectionCheckbox } from "./selection-checkbox";
import { countryFlag } from "@/lib/country-flags";
import { buildFestivalContactMailto } from "@/lib/email-templates";
import type { EditionListItem, SortState } from "./types";

interface FestivalsTableProps {
  editions: EditionListItem[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  selectedIds: Set<string>;
  onToggleId: (id: string) => void;
  onToggleAll: (ids: string[], selectAll: boolean) => void;
}

type Column = {
  key: string; // match con SORT_MAP server
  label: string;
  sortable: boolean;
  className?: string; // opzionale per width
  matchOnly?: boolean; // visibile solo se qualche riga ha filmContext
};

const ALL_COLUMNS: Column[] = [
  { key: "_select", label: "", sortable: false, className: "w-[36px]" },
  { key: "compatibility", label: "🎯 Match", sortable: true, className: "min-w-[100px]", matchOnly: true },
  { key: "name", label: "Festival", sortable: true, className: "min-w-[260px]" },
  { key: "country", label: "Paese", sortable: true, className: "min-w-[140px]" },
  { key: "classification", label: "Classif.", sortable: true, className: "min-w-[100px]" },
  { key: "deadline", label: "Deadline", sortable: true, className: "min-w-[140px]" },
  { key: "fee", label: "Fee", sortable: true, className: "min-w-[90px]" },
  { key: "prize", label: "Premio", sortable: true, className: "min-w-[160px]" },
  { key: "eventStart", label: "Evento", sortable: true, className: "min-w-[150px]" },
  { key: "type", label: "Platform", sortable: false, className: "min-w-[100px]" },
  { key: "myFilm", label: "Mio film", sortable: false, className: "min-w-[110px]" },
  { key: "verification", label: "Verifica", sortable: true, className: "min-w-[90px]" },
  { key: "actions", label: "", sortable: false, className: "min-w-[70px]" },
];

function formatEventRange(start: string | null, end: string | null): string {
  if (!start) return "—";
  const s = new Date(start);
  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const yearOptions: Intl.DateTimeFormatOptions = { year: "numeric" };
  if (!end) return s.toLocaleDateString("it-IT", { ...options, ...yearOptions });
  const e = new Date(end);
  // Stesso mese e anno
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }
  return `${s.toLocaleDateString("it-IT", options)}–${e.toLocaleDateString("it-IT", {
    ...options,
    ...yearOptions,
  })}`;
}

function formatPrize(cash: number | null, desc: string | null): React.ReactNode {
  if (cash && cash > 1) {
    return (
      <span className="text-xs font-medium whitespace-nowrap">
        🏆 {Math.round(cash).toLocaleString("it-IT")}
      </span>
    );
  }
  if (desc) {
    return (
      <span className="text-xs truncate block max-w-[180px]" title={desc}>
        🏆 {desc}
      </span>
    );
  }
  return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
}

function platformBadge(platform: string | null): React.ReactNode {
  if (!platform) return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
  const p = platform.toLowerCase();
  const styles: Record<string, string> = {
    filmfreeway: "bg-amber-100 text-amber-900",
    festhome: "bg-purple-100 text-purple-900",
    shortfilmdepot: "bg-emerald-100 text-emerald-900",
    direct: "bg-sky-100 text-sky-900",
    other: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  };
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[p] || styles.other}`}
    >
      {platform}
    </span>
  );
}

function verificationDot(status: string): React.ReactNode {
  const colors: Record<string, { color: string; label: string }> = {
    verified: { color: "bg-emerald-500", label: "Verificato web" },
    ai_verified: { color: "bg-sky-500", label: "Verificato AI" },
    ai_enriched: { color: "bg-amber-500", label: "AI enriched" },
    unverified: { color: "bg-[var(--muted-foreground)]", label: "Non verificato" },
    needs_review: { color: "bg-red-500", label: "Da rivedere" },
  };
  const c = colors[status] || colors.unverified;
  return (
    <span title={c.label} className="inline-flex items-center gap-1.5 text-xs">
      <span className={`w-2 h-2 rounded-full ${c.color}`} />
      <span className="hidden sm:inline text-[var(--muted-foreground)]">
        {status.replace("_", " ")}
      </span>
    </span>
  );
}

export function FestivalsTable({
  editions,
  sort,
  onSortChange,
  selectedIds,
  onToggleId,
  onToggleAll,
}: FestivalsTableProps) {
  const handleSort = (key: string) => {
    if (sort.key === key) {
      onSortChange({ key, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, direction: "asc" });
    }
  };

  const showMatchCol = editions.some((e) => e.filmContext != null);
  const COLUMNS = ALL_COLUMNS.filter((c) => !c.matchOnly || showMatchCol);
  const visibleIds = editions.map((e) => e.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));

  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--secondary)] sticky top-0 z-[1]">
          <tr className="border-b border-[var(--border)]">
            {COLUMNS.map((col) => {
              if (col.key === "_select") {
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-3 py-2 ${col.className || ""}`}
                  >
                    <SelectionCheckbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={(c) => onToggleAll(visibleIds, c)}
                      ariaLabel="Seleziona tutti visibili"
                    />
                  </th>
                );
              }
              const isActive = sort.key === col.key;
              const arrow = isActive ? (sort.direction === "asc" ? "▲" : "▼") : "";
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] ${col.className || ""}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-[var(--foreground)] ${
                        isActive ? "text-[var(--foreground)]" : ""
                      }`}
                    >
                      {col.label} {arrow && <span className="text-[10px]">{arrow}</span>}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {editions.map((e, idx) => {
            const m = e.festivalMaster;
            const submissionUrl = m.submissionUrlBase || m.website || null;
            const matchRowClass = compatibilityRowClass(e.filmContext);
            const isSelected = selectedIds.has(e.id);
            const rowBg = isSelected
              ? "bg-sky-50"
              : matchRowClass || (idx % 2 === 0 ? "" : "bg-[var(--card)]");
            const mailtoUrl = buildFestivalContactMailto(
              {
                name: m.name,
                country: m.country,
                contactEmailInfo: m.contactEmailInfo,
              },
              { year: e.year }
            );
            return (
              <tr
                key={e.id}
                className={`border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors ${rowBg}`}
              >
                {/* Checkbox selezione */}
                <td className="px-3 py-2 align-top">
                  <SelectionCheckbox
                    checked={isSelected}
                    onChange={() => onToggleId(e.id)}
                    ariaLabel={`Seleziona ${m.name} ${e.year}`}
                  />
                </td>

                {/* Match (opzionale) */}
                {showMatchCol && (
                  <td className="px-3 py-2 align-top">
                    {e.filmContext ? (
                      <CompatibilityBadge context={e.filmContext} size="sm" />
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">—</span>
                    )}
                  </td>
                )}
                {/* Festival */}
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-col gap-1 min-w-0">
                    <Link
                      href={`/festivals/${m.id}`}
                      className="font-medium truncate hover:underline"
                    >
                      {m.name}
                    </Link>
                    <div className="flex items-center gap-1 flex-wrap">
                      <QualifyingBadges
                        oscar={m.academyQualifying}
                        bafta={m.baftaQualifying}
                        efa={m.efaQualifying}
                        goya={m.goyaQualifying}
                      />
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {e.year}
                        {e.editionNumber ? ` · ${e.editionNumber}ª` : ""}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Paese */}
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm whitespace-nowrap">
                      <span className="mr-1">{countryFlag(m.country)}</span>
                      {m.city}
                    </span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {m.country}
                    </span>
                  </div>
                </td>

                {/* Classif */}
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-col gap-0.5">
                    {m.classification && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--muted)] text-[var(--foreground)] w-fit">
                        {m.classification}
                      </span>
                    )}
                    {m.type && (
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {m.type}
                      </span>
                    )}
                  </div>
                </td>

                {/* Deadline */}
                <td className="px-3 py-2 align-top">
                  <DeadlineBadge
                    date={e.activeDeadlineDate}
                    daysToDeadline={e.daysToDeadline}
                    type={e.activeDeadlineType}
                  />
                </td>

                {/* Fee */}
                <td className="px-3 py-2 align-top">
                  <FeeDisplay
                    amount={e.feeAmount}
                    currency={e.feeCurrency}
                    lateFee={e.feeLateFee}
                  />
                </td>

                {/* Premio */}
                <td className="px-3 py-2 align-top">
                  {formatPrize(e.prizeCash, e.prizeDescription)}
                </td>

                {/* Evento */}
                <td className="px-3 py-2 align-top">
                  <span className="text-xs whitespace-nowrap">
                    {formatEventRange(e.eventStartDate, e.eventEndDate)}
                  </span>
                </td>

                {/* Platform */}
                <td className="px-3 py-2 align-top">
                  {platformBadge(m.submissionPlatform)}
                </td>

                {/* Mio film */}
                <td className="px-3 py-2 align-top">
                  <StatusIndicator
                    hasActivePlan={e.userContext.hasActivePlan}
                    hasSubmission={e.userContext.hasSubmission}
                    submissionStatus={e.userContext.submissionStatus}
                  />
                </td>

                {/* Verifica */}
                <td className="px-3 py-2 align-top">
                  {verificationDot(e.verificationStatus)}
                </td>

                {/* Azioni */}
                <td className="px-3 py-2 align-top">
                  <div className="flex items-center gap-1">
                    {m.website && (
                      <a
                        href={m.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-[var(--secondary)] text-xs"
                        title="Apri website"
                      >
                        🌐
                      </a>
                    )}
                    {submissionUrl && (
                      <a
                        href={submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-[var(--secondary)] text-xs"
                        title="Apri submission"
                      >
                        📨
                      </a>
                    )}
                    {mailtoUrl && (
                      <a
                        href={mailtoUrl}
                        className="p-1.5 rounded hover:bg-[var(--secondary)] text-xs"
                        title={`Email a ${m.contactEmailInfo}`}
                      >
                        ✉️
                      </a>
                    )}
                    <Link
                      href={`/festivals/${m.id}`}
                      className="p-1.5 rounded hover:bg-[var(--secondary)] text-xs"
                      title="Dettaglio"
                    >
                      →
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
