"use client";

import { FormField } from "@/components/form-field";
import { AiLoading } from "@/components/ai-loading";
import { StatusBadge } from "@/components/status-badge";
import { PREMIERE_LEVEL_OPTIONS } from "@/lib/constants";

interface Step1FilmProps {
  films: any[];
  filmId: string;
  setFilmId: (id: string) => void;
  premiereLevel: string;
  setPremiereLevel: (level: string) => void;
  aiAnalysis: any;
  setAiAnalysis: (analysis: any) => void;
  aiLoading: boolean;
  setAiLoading: (loading: boolean) => void;
}

export default function Step1Film({
  films,
  filmId,
  setFilmId,
  premiereLevel,
  setPremiereLevel,
  aiAnalysis,
  setAiAnalysis,
  aiLoading,
  setAiLoading,
}: Step1FilmProps) {
  const handleAnalyze = async () => {
    if (!filmId) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch("/api/ai/analyze-film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filmId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
        if (data.premiereLevel && !premiereLevel) {
          setPremiereLevel(data.premiereLevel);
        }
      }
    } finally {
      setAiLoading(false);
    }
  };

  const materialPercent = aiAnalysis?.materialProgress ?? 0;
  const materialColor =
    materialPercent === 100
      ? "bg-emerald-500"
      : materialPercent > 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          label="Film"
          name="filmId"
          type="select"
          value={filmId}
          onChange={(_name, value) => {
            setFilmId(value as string);
            setAiAnalysis(null);
            setPremiereLevel("");
          }}
          required
          options={films.map((f) => ({
            value: f.id,
            label: `${f.titleOriginal} - ${Math.round(f.duration)} min | ${f.genre}`,
          }))}
        />

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!filmId || aiLoading}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Analizza con AI
        </button>
      </div>

      {aiLoading && <AiLoading message="Analisi del film in corso..." />}

      {aiAnalysis && !aiLoading && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Livello premiere suggerito:</span>
            <StatusBadge value={aiAnalysis.premiereLevel} />
          </div>

          <p className="text-sm">{aiAnalysis.reasoning}</p>

          <div>
            <p className="text-sm font-medium mb-1">Punti di forza:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {aiAnalysis.keyStrengths?.map((strength: string, i: number) => (
                <li key={i} className="text-sm text-[var(--muted-foreground)]">
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium">Target audience:</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {aiAnalysis.targetAudience}
            </p>
          </div>

          {/* Material progress bar */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Materiali: {aiAnalysis.uploadedMaterials ?? 0}/{aiAnalysis.totalMaterials ?? 0} caricati ({materialPercent}%)
            </p>
            <div className="w-full h-2.5 rounded-full bg-[var(--muted)]">
              <div
                className={`h-2.5 rounded-full transition-all ${materialColor}`}
                style={{ width: `${materialPercent}%` }}
              />
            </div>
            {materialPercent < 100 && (
              <p className="text-xs text-amber-600 font-medium">
                {"Attenzione: non potrai inviare iscrizioni finch\u00e9 la checklist non \u00e8 al 100%"}
              </p>
            )}
          </div>
        </div>
      )}

      <FormField
        label="Livello Premiere"
        name="premiereLevel"
        type="select"
        value={premiereLevel}
        onChange={(_name, value) => setPremiereLevel(value as string)}
        required
        options={PREMIERE_LEVEL_OPTIONS}
      />
    </div>
  );
}
