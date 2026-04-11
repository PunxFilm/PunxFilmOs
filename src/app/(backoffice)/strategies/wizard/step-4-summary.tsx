"use client";

import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PREMIERE_LEVEL_OPTIONS } from "@/lib/constants";
import type { EnrichedFestival } from "./step-2-premiere";

interface Film {
  id: string;
  title: string;
  director: string;
  year: number;
  genre: string;
  duration: number | null;
  status: string;
}

interface Step4SummaryProps {
  filmId: string;
  films: Film[];
  premiereLevel: string;
  premiereFestivalId: string;
  festivalRankings: EnrichedFestival[];
  queueSuggestions: EnrichedFestival[];
  queueDecisions: Record<string, string>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  onSave: () => void;
}

const PRIORITY_SECTIONS: {
  priority: "A" | "B" | "C";
  title: string;
  borderColor: string;
}[] = [
  {
    priority: "A",
    title: "Priorita A \u2014 Imperdibili",
    borderColor: "border-l-red-500",
  },
  {
    priority: "B",
    title: "Priorita B \u2014 Consigliati",
    borderColor: "border-l-amber-500",
  },
  {
    priority: "C",
    title: "Priorita C \u2014 Volume",
    borderColor: "border-l-gray-400",
  },
];

function PriorityBadge({ priority }: { priority: "A" | "B" | "C" }) {
  const styles: Record<string, string> = {
    A: "bg-red-100 text-red-800",
    B: "bg-amber-100 text-amber-800",
    C: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  };
  const labels: Record<string, string> = {
    A: "Priorita A",
    B: "Priorita B",
    C: "Priorita C",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  );
}

export default function Step4Summary({
  filmId,
  films,
  premiereLevel,
  premiereFestivalId,
  festivalRankings,
  queueSuggestions,
  queueDecisions,
  saving,
  setSaving,
  onSave,
}: Step4SummaryProps) {
  const { toast } = useToast();

  const film = films.find((f) => f.id === filmId);
  const premiereFestival = festivalRankings.find(
    (r) => r.festivalId === premiereFestivalId
  );
  const premiereLevelLabel =
    PREMIERE_LEVEL_OPTIONS.find((o) => o.value === premiereLevel)?.label ||
    premiereLevel;

  // Approved queue entries
  const approvedSuggestions = queueSuggestions.filter(
    (s) => queueDecisions[s.festivalId] === "approved"
  );

  // Budget calculations
  const premiereFee =
    premiereFestival && premiereFestival.feeAmount !== null
      ? premiereFestival.waiverType !== "none"
        ? 0
        : premiereFestival.feeAmount
      : 0;
  const premiereGross =
    premiereFestival?.feeAmount !== null && premiereFestival?.feeAmount !== undefined
      ? premiereFestival.feeAmount
      : 0;

  const queueGross = approvedSuggestions.reduce(
    (sum, s) => sum + (s.feeAmount || 0),
    0
  );
  const queueNet = approvedSuggestions.reduce((sum, s) => {
    if (s.feeAmount === null) return sum;
    if (s.waiverType !== "none") return sum;
    return sum + s.feeAmount;
  }, 0);

  const totalGross = premiereGross + queueGross;
  const waiverSavings = totalGross - (premiereFee + queueNet);
  const totalNet = premiereFee + queueNet;

  // Material checklist: warn if film is not active
  const filmNotReady = film && film.status !== "active";

  return (
    <div className="space-y-6">
      {/* 1. Film info card */}
      {film && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{film.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {film.director} &middot; {film.genre}
                {film.duration ? ` \u00b7 ${film.duration} min` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={premiereLevel} />
              <StatusBadge value={film.status} />
            </div>
          </div>
        </div>
      )}

      {/* 2. Premiere festival card (amber border) */}
      {premiereFestival && (
        <div className="p-4 rounded-lg border-2 border-amber-400 bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-medium text-sm">Festival Premiere</h4>
            <StatusBadge value="premiere" />
            <PriorityBadge priority={premiereFestival.priority} />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold">{premiereFestival.festivalName}</h4>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {premiereFestival.festivalCity},{" "}
                {premiereFestival.festivalCountry}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold">
                {Math.round(premiereFestival.score)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                score
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {premiereFestival.academyQualifying && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                Academy Qualifying
              </span>
            )}
            {premiereFestival.prizeCash !== null &&
              premiereFestival.prizeCash > 0 && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 whitespace-nowrap">
                  Premio {formatCurrency(premiereFestival.prizeCash)}
                </span>
              )}
            {premiereFestival.waiverType !== "none" && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                Waiver
              </span>
            )}
          </div>

          {/* Fee + deadline */}
          <div className="flex items-center gap-4 mt-2 text-sm text-[var(--muted-foreground)]">
            {premiereFestival.feeAmount !== null && (
              <span>
                Fee:{" "}
                {premiereFestival.waiverType !== "none" ? (
                  <>
                    <span className="line-through">
                      {formatCurrency(premiereFestival.feeAmount)}
                    </span>{" "}
                    <span className="text-green-600 font-medium">
                      {formatCurrency(0)}
                    </span>
                  </>
                ) : (
                  <span className="font-medium">
                    {formatCurrency(premiereFestival.feeAmount)}
                  </span>
                )}
              </span>
            )}
            {premiereFestival.deadlineGeneral && (
              <span>
                Deadline: {formatDate(premiereFestival.deadlineGeneral)}
              </span>
            )}
            {premiereFestival.eventStartDate && (
              <span>
                Evento: {formatDate(premiereFestival.eventStartDate)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Approved queue grouped by priority */}
      {approvedSuggestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">
            Coda Approvata ({approvedSuggestions.length})
          </h4>

          {PRIORITY_SECTIONS.map((section) => {
            const items = approvedSuggestions.filter(
              (s) => s.priority === section.priority
            );
            if (items.length === 0) return null;

            return (
              <div key={section.priority} className="space-y-2">
                <h5
                  className={`text-xs font-semibold pl-3 border-l-4 ${section.borderColor} text-[var(--muted-foreground)]`}
                >
                  {section.title}
                </h5>

                {items.map((s) => {
                  const hasWaiver = s.waiverType !== "none";

                  return (
                    <div
                      key={s.festivalId}
                      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-sm">
                              {s.festivalName}
                            </h5>
                            <PriorityBadge priority={s.priority} />
                            {s.academyQualifying && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                                Academy
                              </span>
                            )}
                            {hasWaiver && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                                Waiver
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {s.festivalCity}, {s.festivalCountry}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold">
                            {Math.round(s.score)}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            score
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--muted-foreground)]">
                        {s.feeAmount !== null && (
                          <span>
                            Fee:{" "}
                            {hasWaiver ? (
                              <>
                                <span className="line-through">
                                  {formatCurrency(s.feeAmount)}
                                </span>{" "}
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(0)}
                                </span>
                              </>
                            ) : (
                              formatCurrency(s.feeAmount)
                            )}
                          </span>
                        )}
                        {s.deadlineGeneral && (
                          <span>
                            Deadline: {formatDate(s.deadlineGeneral)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Budget summary */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <h4 className="font-medium text-sm mb-3">Budget Totale</h4>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">
              Premiere fee
            </span>
            <span>{formatCurrency(premiereGross)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">
              Coda fees ({approvedSuggestions.length} festival)
            </span>
            <span>{formatCurrency(queueGross)}</span>
          </div>
          {waiverSavings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Risparmio waiver</span>
              <span>-{formatCurrency(waiverSavings)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-[var(--border)] font-bold">
            <span>Totale</span>
            <span className="text-lg">{formatCurrency(totalNet)}</span>
          </div>
        </div>
      </div>

      {/* 5. Material checklist warning */}
      {filmNotReady && (
        <div className="p-3 rounded-lg border border-amber-400 bg-amber-50 text-amber-800">
          <p className="text-sm font-medium">
            &#9888; Il film non risulta in stato &quot;Attivo&quot;. Verifica
            che i materiali siano completi prima di procedere.
          </p>
        </div>
      )}

      {/* 6. Save button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva Strategia"}
        </button>
      </div>
    </div>
  );
}
