"use client";

import { useEffect, useRef } from "react";
import { AiLoading } from "@/components/ai-loading";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";

export interface EnrichedFestival {
  festivalId: string;
  score: number;
  reasoning: string;
  warnings: string[];
  priority: "A" | "B" | "C";
  festivalName: string;
  festivalCity: string;
  festivalCountry: string;
  classification: string;
  type: string;
  academyQualifying: boolean;
  waiverType: string;
  waiverCode: string | null;
  feeAmount: number | null;
  feeCurrency: string;
  deadlineGeneral: string | null;
  eventStartDate: string | null;
  editionId: string | null;
  editionYear: number | null;
  prizeCash: number | null;
}

interface Step2PremiereProps {
  filmId: string;
  premiereLevel: string;
  festivalRankings: EnrichedFestival[];
  setFestivalRankings: (rankings: EnrichedFestival[]) => void;
  premiereFestivalId: string;
  setPremiereFestivalId: (id: string) => void;
  aiLoading: boolean;
  setAiLoading: (loading: boolean) => void;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-[var(--muted)]">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right">
        {Math.round(score)}
      </span>
    </div>
  );
}

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

export default function Step2Premiere({
  filmId,
  premiereLevel,
  festivalRankings,
  setFestivalRankings,
  premiereFestivalId,
  setPremiereFestivalId,
  aiLoading,
  setAiLoading,
}: Step2PremiereProps) {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (festivalRankings.length > 0 || hasFetched.current) return;
    hasFetched.current = true;

    const fetchRankings = async () => {
      setAiLoading(true);
      try {
        const res = await fetch("/api/ai/rank-festivals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filmId, premiereLevel }),
        });
        if (res.ok) {
          const data = await res.json();
          setFestivalRankings(data.rankings || []);
        }
      } finally {
        setAiLoading(false);
      }
    };

    fetchRankings();
  }, [filmId, premiereLevel, festivalRankings.length, setFestivalRankings, setAiLoading]);

  if (aiLoading) {
    return <AiLoading message="Classificazione festival in corso..." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Seleziona il festival per la premiere del film
      </p>

      <div className="space-y-3">
        {festivalRankings.map((r) => {
          const selected = premiereFestivalId === r.festivalId;
          const hasWaiver = r.waiverType !== "none";

          return (
            <div
              key={r.festivalId}
              onClick={() => setPremiereFestivalId(r.festivalId)}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selected
                  ? "border-blue-500 ring-2 ring-blue-500 bg-blue-500/5"
                  : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]"
              }`}
            >
              {/* Header: name + location */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{r.festivalName}</h4>
                  <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                    {r.festivalCity}, {r.festivalCountry}
                  </p>
                </div>

                {/* Radio indicator */}
                <div className="shrink-0 mt-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected
                        ? "border-blue-500 bg-blue-500"
                        : "border-[var(--muted-foreground)]"
                    }`}
                  >
                    {selected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-3">
                <ScoreBar score={r.score} />
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <PriorityBadge priority={r.priority} />
                {r.academyQualifying && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                    Academy Qualifying
                  </span>
                )}
                {r.prizeCash !== null && r.prizeCash > 0 && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 whitespace-nowrap">
                    Premio {formatCurrency(r.prizeCash)}
                  </span>
                )}
                {hasWaiver && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                    Waiver
                  </span>
                )}
                {r.classification && (
                  <StatusBadge value={r.classification} />
                )}
              </div>

              {/* Fee + Deadline row */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                {r.feeAmount !== null && (
                  <span className="text-[var(--muted-foreground)]">
                    Fee:{" "}
                    {hasWaiver ? (
                      <>
                        <span className="line-through">
                          {formatCurrency(r.feeAmount)}
                        </span>{" "}
                        <span className="text-green-600 font-medium">
                          {formatCurrency(0)}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium">
                        {formatCurrency(r.feeAmount)}
                      </span>
                    )}
                  </span>
                )}
                {r.deadlineGeneral && (
                  <span className="text-[var(--muted-foreground)]">
                    Deadline: {formatDate(r.deadlineGeneral)}
                  </span>
                )}
                {r.eventStartDate && (
                  <span className="text-[var(--muted-foreground)]">
                    Evento: {formatDate(r.eventStartDate)}
                  </span>
                )}
              </div>

              {/* Reasoning */}
              <p className="text-sm mt-3">{r.reasoning}</p>

              {/* Warnings */}
              {r.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {r.warnings.map((w, i) => (
                    <p
                      key={i}
                      className="text-xs text-orange-600 flex items-center gap-1"
                    >
                      <span>&#9888;</span> {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {festivalRankings.length === 0 && !aiLoading && (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">
            Nessun festival disponibile per il ranking.
          </p>
        </div>
      )}
    </div>
  );
}
