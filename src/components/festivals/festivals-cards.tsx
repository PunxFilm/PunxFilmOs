"use client";

import Link from "next/link";
import { DeadlineBadge } from "./deadline-badge";
import { QualifyingBadges } from "./qualifying-badges";
import { FeeDisplay } from "./fee-display";
import { StatusIndicator } from "./status-indicator";
import { CompatibilityBadge } from "./compatibility-badge";
import { SelectionCheckbox } from "./selection-checkbox";
import { countryFlag } from "@/lib/country-flags";
import { buildFestivalContactMailto } from "@/lib/email-templates";
import type { EditionListItem } from "./types";

interface FestivalsCardsProps {
  editions: EditionListItem[];
  selectedIds: Set<string>;
  onToggleId: (id: string) => void;
}

function formatEventRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const s = new Date(start);
  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long" };
  const yearOptions: Intl.DateTimeFormatOptions = { year: "numeric" };
  if (!end) return s.toLocaleDateString("it-IT", { ...options, ...yearOptions });
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`;
  }
  return `${s.toLocaleDateString("it-IT", options)} – ${e.toLocaleDateString("it-IT", {
    ...options,
    ...yearOptions,
  })}`;
}

export function FestivalsCards({
  editions,
  selectedIds,
  onToggleId,
}: FestivalsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {editions.map((e) => {
        const m = e.festivalMaster;
        const submissionUrl = m.submissionUrlBase || m.website || null;
        const isIncompatible =
          e.filmContext?.compatibilityLevel === "incompatible";
        const isSelected = selectedIds.has(e.id);
        const mailtoUrl = buildFestivalContactMailto(
          {
            name: m.name,
            country: m.country,
            contactEmailInfo: m.contactEmailInfo,
          },
          { year: e.year }
        );
        return (
          <div
            key={e.id}
            className={`relative rounded-lg border bg-[var(--card)] overflow-hidden hover:border-[var(--muted-foreground)] transition-colors ${
              isSelected
                ? "border-sky-400 ring-2 ring-sky-200"
                : "border-[var(--border)]"
            } ${isIncompatible ? "opacity-60" : ""}`}
          >
            {/* Checkbox selezione overlay */}
            <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur rounded p-1 shadow-sm">
              <SelectionCheckbox
                checked={isSelected}
                onChange={() => onToggleId(e.id)}
                ariaLabel={`Seleziona ${m.name} ${e.year}`}
              />
            </div>
            {/* Match banner (se filmContext presente) */}
            {e.filmContext && (
              <div
                className={`px-4 py-2 border-b border-[var(--border)] flex items-center justify-between ${
                  e.filmContext.compatibilityLevel === "incompatible"
                    ? "bg-red-50"
                    : e.filmContext.compatibilityLevel === "best"
                      ? "bg-emerald-50"
                      : e.filmContext.compatibilityLevel === "warning"
                        ? "bg-amber-50"
                        : "bg-[var(--secondary)]"
                }`}
              >
                <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  Match film
                </span>
                <CompatibilityBadge context={e.filmContext} size="md" />
              </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/festivals/${m.id}`}
                  className="font-semibold text-sm hover:underline flex-1 line-clamp-2"
                >
                  {m.name}
                </Link>
                <span className="text-[11px] text-[var(--muted-foreground)] whitespace-nowrap shrink-0">
                  {e.year}
                  {e.editionNumber ? ` · ${e.editionNumber}ª` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <QualifyingBadges
                  oscar={m.academyQualifying}
                  bafta={m.baftaQualifying}
                  efa={m.efaQualifying}
                  goya={m.goyaQualifying}
                />
                {m.classification && (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--muted)]">
                    {m.classification}
                  </span>
                )}
                {m.type && (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--muted)]">
                    {m.type}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                {countryFlag(m.country)} {m.city}, {m.country}
              </p>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Deadline */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  Deadline
                </span>
                <DeadlineBadge
                  date={e.activeDeadlineDate}
                  daysToDeadline={e.daysToDeadline}
                  type={e.activeDeadlineType}
                  size="md"
                />
              </div>

              {/* Fee + Premio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    Fee
                  </p>
                  <FeeDisplay
                    amount={e.feeAmount}
                    currency={e.feeCurrency}
                    lateFee={e.feeLateFee}
                  />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    Premio
                  </p>
                  {e.prizeCash && e.prizeCash > 1 ? (
                    <p className="text-sm font-medium">
                      🏆 {Math.round(e.prizeCash).toLocaleString("it-IT")}
                    </p>
                  ) : e.prizeDescription ? (
                    <p className="text-xs line-clamp-2" title={e.prizeDescription}>
                      🏆 {e.prizeDescription}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--muted-foreground)]">—</p>
                  )}
                </div>
              </div>

              {/* Evento */}
              {e.eventStartDate && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    Evento
                  </p>
                  <p className="text-sm">
                    📅 {formatEventRange(e.eventStartDate, e.eventEndDate)}
                  </p>
                </div>
              )}

              {/* Platform + Verification */}
              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                {m.submissionPlatform && (
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    📨 {m.submissionPlatform}
                  </span>
                )}
                <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <VerificationIcon status={e.verificationStatus} />{" "}
                  {e.verificationStatus.replace("_", " ")}
                </span>
              </div>

              {/* Mio film */}
              {(e.userContext.hasActivePlan || e.userContext.hasSubmission) && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <StatusIndicator
                    hasActivePlan={e.userContext.hasActivePlan}
                    hasSubmission={e.userContext.hasSubmission}
                    submissionStatus={e.userContext.submissionStatus}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--secondary)]/30 flex items-center gap-2 flex-wrap">
              {m.website && (
                <a
                  href={m.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:bg-[var(--card)]"
                >
                  🌐 Sito
                </a>
              )}
              {submissionUrl && (
                <a
                  href={submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:bg-[var(--card)]"
                >
                  📨 Submit
                </a>
              )}
              {mailtoUrl && (
                <a
                  href={mailtoUrl}
                  className="text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:bg-[var(--card)]"
                  title={m.contactEmailInfo || undefined}
                >
                  ✉️ Contatta
                </a>
              )}
              <Link
                href={`/festivals/${m.id}`}
                className="text-xs px-2.5 py-1 rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 ml-auto"
              >
                Dettaglio →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerificationIcon({ status }: { status: string }) {
  const colors: Record<string, string> = {
    verified: "bg-emerald-500",
    ai_verified: "bg-sky-500",
    ai_enriched: "bg-amber-500",
    unverified: "bg-[var(--muted-foreground)]",
    needs_review: "bg-red-500",
  };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || colors.unverified}`} />;
}
