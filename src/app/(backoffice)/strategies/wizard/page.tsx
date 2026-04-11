"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { WizardStepper } from "@/components/wizard-stepper";
import { useToast } from "@/components/toast";
import Step1Film from "./step-1-film";
import Step2Premiere from "./step-2-premiere";
import Step3Queue from "./step-3-queue";
import Step4Summary from "./step-4-summary";
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

interface AiAnalysis {
  premiereLevel: string;
  reasoning: string;
  keyStrengths: string[];
  targetAudience: string;
}

const WIZARD_STEPS = [
  "Scegli Film",
  "Festival Premiere",
  "Costruisci Coda",
  "Riepilogo",
];

export default function WizardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [films, setFilms] = useState<Film[]>([]);
  const [filmId, setFilmId] = useState("");
  const [premiereLevel, setPremiereLevel] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [premiereFestivalId, setPremiereFestivalId] = useState("");
  const [festivalRankings, setFestivalRankings] = useState<EnrichedFestival[]>([]);
  const [queueSuggestions, setQueueSuggestions] = useState<EnrichedFestival[]>([]);
  const [queueDecisions, setQueueDecisions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/films")
      .then((r) => r.json())
      .then(setFilms);
  }, []);

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return filmId !== "" && premiereLevel !== "";
      case 2:
        return premiereFestivalId !== "";
      case 3:
        return Object.values(queueDecisions).some((d) => d === "approved");
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) {
      switch (step) {
        case 1:
          toast("Seleziona un film e un livello di premiere", "error");
          break;
        case 2:
          toast("Seleziona il festival per la premiere", "error");
          break;
        case 3:
          toast("Approva almeno un festival per la coda", "error");
          break;
      }
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Create the distribution plan
      const planRes = await fetch("/api/distribution-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filmId,
          premiereLevel,
          status: "draft",
          aiAnalysis: aiAnalysis ? JSON.stringify(aiAnalysis) : undefined,
        }),
      });
      if (!planRes.ok) {
        const err = await planRes.json();
        toast(err.error?.toString() || "Errore nella creazione del piano", "error");
        setSaving(false);
        return;
      }
      const plan = await planRes.json();

      // 2. Build entries: premiere + all queue festivals with enriched data
      const entries: {
        festivalMasterId: string;
        festivalEditionId: string | null;
        role: string;
        position: number;
        status: string;
        priority: string;
        matchScore?: number;
        matchReasoning?: string;
        estimatedFee: number;
        waiverApplied: boolean;
        waiverCode: string | null;
      }[] = [];

      // Premiere entry
      const premiereRanking = festivalRankings.find(
        (r) => r.festivalId === premiereFestivalId
      );
      if (premiereRanking) {
        const waiverApplied = premiereRanking.waiverType !== "none";
        entries.push({
          festivalMasterId: premiereFestivalId,
          festivalEditionId: premiereRanking.festivalEditionId,
          role: "premiere",
          position: 0,
          status: "approved",
          priority: premiereRanking.priority,
          matchScore: premiereRanking.score,
          matchReasoning: premiereRanking.reasoning,
          estimatedFee: waiverApplied ? 0 : (premiereRanking.feeAmount || 0),
          waiverApplied,
          waiverCode: waiverApplied ? premiereRanking.waiverCode : null,
        });
      }

      // Queue entries
      let position = 1;
      queueSuggestions.forEach((s) => {
        const decision = queueDecisions[s.festivalId];
        if (decision === "approved" || decision === "rejected" || decision === "pending") {
          const waiverApplied = s.waiverType !== "none";
          entries.push({
            festivalMasterId: s.festivalId,
            festivalEditionId: s.festivalEditionId,
            role: "queue",
            position: position++,
            status: decision,
            priority: s.priority,
            matchScore: s.score,
            matchReasoning: s.reasoning,
            estimatedFee: waiverApplied ? 0 : (s.feeAmount || 0),
            waiverApplied,
            waiverCode: waiverApplied ? s.waiverCode : null,
          });
        }
      });

      // 3. POST entries
      const entriesRes = await fetch(
        `/api/distribution-plans/${plan.id}/entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries }),
        }
      );
      if (!entriesRes.ok) {
        const err = await entriesRes.json();
        toast(
          err.error?.toString() || "Errore nella creazione delle entry",
          "error"
        );
        setSaving(false);
        return;
      }

      toast("Piano di distribuzione creato!");
      router.push("/strategies");
    } catch {
      toast("Errore imprevisto nel salvataggio", "error");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Nuova Strategia di Distribuzione" />

      <WizardStepper steps={WIZARD_STEPS} currentStep={step} />

      <div className="mt-6">
        {step === 1 && (
          <Step1Film
            films={films}
            filmId={filmId}
            setFilmId={setFilmId}
            premiereLevel={premiereLevel}
            setPremiereLevel={setPremiereLevel}
            aiAnalysis={aiAnalysis}
            setAiAnalysis={setAiAnalysis}
            aiLoading={aiLoading}
            setAiLoading={setAiLoading}
          />
        )}

        {step === 2 && (
          <Step2Premiere
            filmId={filmId}
            premiereLevel={premiereLevel}
            festivalRankings={festivalRankings}
            setFestivalRankings={setFestivalRankings}
            premiereFestivalId={premiereFestivalId}
            setPremiereFestivalId={setPremiereFestivalId}
            aiLoading={aiLoading}
            setAiLoading={setAiLoading}
          />
        )}

        {step === 3 && (
          <Step3Queue
            filmId={filmId}
            premiereFestivalId={premiereFestivalId}
            queueSuggestions={queueSuggestions}
            setQueueSuggestions={setQueueSuggestions}
            queueDecisions={queueDecisions}
            setQueueDecisions={setQueueDecisions}
            aiLoading={aiLoading}
            setAiLoading={setAiLoading}
          />
        )}

        {step === 4 && (
          <Step4Summary
            filmId={filmId}
            films={films}
            premiereLevel={premiereLevel}
            premiereFestivalId={premiereFestivalId}
            queueSuggestions={queueSuggestions}
            queueDecisions={queueDecisions}
            festivalRankings={festivalRankings}
            saving={saving}
            setSaving={setSaving}
            onSave={handleSave}
          />
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-[var(--border)]">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
          >
            Indietro
          </button>
        ) : (
          <div />
        )}

        {step < 4 && (
          <button
            type="button"
            onClick={handleNext}
            disabled={aiLoading}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Avanti
          </button>
        )}
      </div>
    </div>
  );
}
