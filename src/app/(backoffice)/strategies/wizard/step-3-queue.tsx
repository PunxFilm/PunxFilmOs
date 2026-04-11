"use client";

import { useEffect, useRef } from "react";
import { AiLoading } from "@/components/ai-loading";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { EnrichedFestival } from "./step-2-premiere";

interface Step3QueueProps {
  filmId: string;
  premiereFestivalId: string;
  queueSuggestions: EnrichedFestival[];
  setQueueSuggestions: (suggestions: EnrichedFestival[]) => void;
  queueDecisions: Record<string, string>;
  setQueueDecisions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  aiLoading: boolean;
  setAiLoading: (loading: boolean) => void;
}

const DECISION_BUTTONS = [
  {
    value: "approved",
    label: "Approvato",
    activeClass: "bg-emerald-600 text-white",
    inactiveClass:
      "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
  },
  {
    value: "rejected",
    label: "Rifiutato",
    activeClass: "bg-red-600 text-white",
    inactiveClass: "border-red-300 text-red-700 hover:bg-red-50",
  },
  {
    value: "pending",
    label: "Da valutare",
    activeClass: "bg-amber-500 text-white",
    inactiveClass: "border-amber-300 text-amber-700 hover:bg-amber-50",
  },
] as const;

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

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)]">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-6 text-right">
        {Math.round(score)}
      </span>
    </div>
  );
}

function effectiveFee(f: EnrichedFestival): number {
  if (f.feeAmount === null) return 0;
  if (f.waiverType !== "none") return 0;
  return f.feeAmount;
}

export default function Step3Queue({
  filmId,
  premiereFestivalId,
  queueSuggestions,
  setQueueSuggestions,
  queueDecisions,
  setQueueDecisions,
  aiLoading,
  setAiLoading,
}: Step3QueueProps) {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (queueSuggestions.length > 0 || hasFetched.current) return;
    hasFetched.current = true;

    const fetchQueue = async () => {
      setAiLoading(true);
      try {
        const res = await fetch("/api/ai/suggest-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filmId, premiereFestivalId }),
        });
        if (res.ok) {
          const data = await res.json();
          const suggestions: EnrichedFestival[] = data.queue || [];
          setQueueSuggestions(suggestions);

          const defaults: Record<string, string> = {};
          suggestions.forEach((s) => {
            defaults[s.festivalId] = "pending";
          });
          setQueueDecisions(defaults);
        }
      } finally {
        setAiLoading(false);
      }
    };

    fetchQueue();
  }, [
    filmId,
    premiereFestivalId,
    queueSuggestions.length,
    setQueueSuggestions,
    setQueueDecisions,
    setAiLoading,
  ]);

  const handleDecision = (festivalId: string, decision: string) => {
    setQueueDecisions((prev: Record<string, string>) => ({ ...prev, [festivalId]: decision }));
  };

  // Budget calculations
  const approvedFestivals = queueSuggestions.filter(
    (s) => queueDecisions[s.festivalId] === "approved"
  );

  const budgetGross = approvedFestivals.reduce(
    (sum, s) => sum + (s.feeAmount || 0),
    0
  );

  const waiverSavings = approvedFestivals
    .filter((s) => s.waiverType !== "none")
    .reduce((sum, s) => sum + (s.feeAmount || 0), 0);

  const budgetNet = budgetGross - waiverSavings;

  if (aiLoading) {
    return <AiLoading message="Generazione coda suggerita in corso..." />;
  }

  return (
    <div className="space-y-4">
      {/* Budget panel */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-baseline gap-4 flex-wrap">
          <p className="text-sm font-medium">
            Budget stimato:{" "}
            <span className="text-lg font-bold">
              {formatCurrency(budgetNet)}
            </span>
          </p>
          {waiverSavings > 0 && (
            <p className="text-sm text-green-600 font-medium">
              Con waiver: {formatCurrency(waiverSavings)} risparmiati
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        Rivedi i festival suggeriti e decidi quali approvare per la coda di
        distribuzione
      </p>

      {/* Priority-grouped sections */}
      {PRIORITY_SECTIONS.map((section) => {
        const items = queueSuggestions.filter(
          (s) => s.priority === section.priority
        );
        if (items.length === 0) return null;

        return (
          <div key={section.priority} className="space-y-3">
            <h3
              className={`text-sm font-semibold pl-3 border-l-4 ${section.borderColor}`}
            >
              {section.title}
            </h3>

            {items.map((s) => {
              const currentDecision =
                queueDecisions[s.festivalId] || "pending";
              const hasWaiver = s.waiverType !== "none";

              return (
                <div
                  key={s.festivalId}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
                >
                  {/* Top row: name, score, decisions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{s.festivalName}</h4>
                      <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                        {s.festivalCity}, {s.festivalCountry}
                      </p>
                    </div>

                    {/* Decision buttons */}
                    <div className="flex gap-1 shrink-0">
                      {DECISION_BUTTONS.map((btn) => (
                        <button
                          key={btn.value}
                          type="button"
                          onClick={() =>
                            handleDecision(s.festivalId, btn.value)
                          }
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            currentDecision === btn.value
                              ? btn.activeClass
                              : btn.inactiveClass
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-2">
                    <ScoreBar score={s.score} />
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <PriorityBadge priority={s.priority} />
                    {s.academyQualifying && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                        Academy Qualifying
                      </span>
                    )}
                    {s.prizeCash !== null && s.prizeCash > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 whitespace-nowrap">
                        Premio {formatCurrency(s.prizeCash)}
                      </span>
                    )}
                    {hasWaiver && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                        Waiver
                      </span>
                    )}
                    {s.classification && (
                      <StatusBadge value={s.classification} />
                    )}
                  </div>

                  {/* Fee + deadline */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--muted-foreground)]">
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
                          <span className="font-medium">
                            {formatCurrency(s.feeAmount)}
                          </span>
                        )}
                      </span>
                    )}
                    {s.deadlineGeneral && (
                      <span>Deadline: {formatDate(s.deadlineGeneral)}</span>
                    )}
                  </div>

                  {/* Reasoning (compact) */}
                  <p className="text-sm text-[var(--muted-foreground)] mt-2 line-clamp-2">
                    {s.reasoning}
                  </p>

                  {/* Warnings */}
                  {s.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {s.warnings.map((w, i) => (
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
        );
      })}

      {queueSuggestions.length === 0 && !aiLoading && (
        <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--muted-foreground)]">
            Nessun festival disponibile per la coda.
          </p>
        </div>
      )}
    </div>
  );
}
