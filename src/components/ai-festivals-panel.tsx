"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { AiLoading } from "@/components/ai-loading";

interface FestivalSuggestion {
  festivalId: string;
  score: number;
  reasoning: string;
  priority: "A" | "B" | "C";
  festivalName: string;
  classification: string;
  academyQualifying: boolean;
  editionYear: number | null;
  feeAmount: number | null;
  deadlineGeneral: string | null;
}

interface Props {
  filmId: string;
  defaultPremiereLevel?: string;
}

export function AIFestivalsPanel({ filmId, defaultPremiereLevel = "international" }: Props) {
  const [premiereLevel, setPremiereLevel] = useState(defaultPremiereLevel);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FestivalSuggestion[] | null>(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setSuggestions(null);
    try {
      const res = await fetch("/api/ai/rank-festivals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filmId, premiereLevel }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Errore dal servizio AI");
        return;
      }
      const data = await res.json();
      setSuggestions(data.rankings || []);
    } catch (e) {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          🤖 Festival consigliati dall'AI
        </h2>
      </div>

      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1 text-[var(--muted-foreground)]">
              Livello premiere desiderato
            </label>
            <select
              value={premiereLevel}
              onChange={(e) => setPremiereLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              disabled={loading}
            >
              <option value="world">World premiere</option>
              <option value="international">International premiere</option>
              <option value="european">European premiere</option>
              <option value="national">National premiere</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Analisi in corso..." : "Analizza con AI"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {loading && <AiLoading message="Claude sta analizzando il match film-festival…" />}

      {suggestions && suggestions.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)] italic">
          Nessun festival compatibile trovato.
        </p>
      )}

      {suggestions && suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s) => (
            <li
              key={s.festivalId}
              className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
            >
              <Link
                href={`/festivals/${s.festivalId}`}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        s.priority === "A"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.priority === "B"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      Priority {s.priority}
                    </span>
                    <span className="text-xs font-medium">Score {s.score}/100</span>
                    {s.academyQualifying && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent)] text-[var(--accent-foreground)]">
                        Oscar
                      </span>
                    )}
                    {s.classification && <StatusBadge value={s.classification} />}
                  </div>
                  <p className="font-medium text-sm mt-1">{s.festivalName}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                    {s.reasoning}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
