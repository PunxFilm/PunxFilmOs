"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { StatusBadge } from "@/components/status-badge";
import { FestivalMatchCard } from "@/components/festival-match-card";
import { useToast } from "@/components/toast";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils";

interface Festival {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  deadlineGeneral?: string | null;
  feesAmount?: number | null;
  specialization?: string | null;
}

interface Submission {
  id: string;
  status: string;
}

interface PlanEntry {
  id: string;
  role: string;
  position: number;
  status: string;
  matchScore: number | null;
  matchReasoning: string | null;
  festivalMaster: Festival;
  submission: Submission | null;
  submissionId: string | null;
}

interface Plan {
  id: string;
  premiereLevel: string;
  status: string;
  aiAnalysis: string | null;
  film: {
    id: string;
    titleOriginal: string;
    director: string;
    genre: string;
    duration: number;
    year: number;
    country: string;
    language: string;
  };
  entries: PlanEntry[];
}

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Inline subscribe form state
  const [subscribeEntryId, setSubscribeEntryId] = useState<string | null>(null);
  const [subscribeForm, setSubscribeForm] = useState({ feesPaid: 0, platform: "" });

  const fetchPlan = () => {
    fetch(`/api/distribution-plans/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const updateEntryStatus = async (entryId: string, newStatus: string) => {
    setActionLoading(entryId);
    try {
      const res = await fetch(`/api/distribution-plans/${params.id}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: [{ id: entryId, status: newStatus }] }),
      });
      if (res.ok) {
        toast(newStatus === "approved" ? "Entry approvata" : "Entry rifiutata");
        fetchPlan();
      } else {
        const data = await res.json();
        toast(data.error || "Errore nell'aggiornamento");
      }
    } catch {
      toast("Errore di rete");
    }
    setActionLoading(null);
  };

  const handleSubscribe = async (entryId: string) => {
    setActionLoading(entryId);
    try {
      const res = await fetch(`/api/distribution-plans/${params.id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          feesPaid: subscribeForm.feesPaid,
          platform: subscribeForm.platform || null,
        }),
      });
      if (res.ok) {
        toast("Iscrizione completata");
        setSubscribeEntryId(null);
        setSubscribeForm({ feesPaid: 0, platform: "" });
        fetchPlan();
      } else {
        const data = await res.json();
        toast(data.error || "Errore nell'iscrizione");
      }
    } catch {
      toast("Errore di rete");
    }
    setActionLoading(null);
  };

  const updatePlanStatus = async (newStatus: string) => {
    setActionLoading("plan-status");
    try {
      const res = await fetch(`/api/distribution-plans/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast(`Piano aggiornato: ${newStatus}`);
        fetchPlan();
      } else {
        const data = await res.json();
        toast(data.error || "Errore nell'aggiornamento");
      }
    } catch {
      toast("Errore di rete");
    }
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!confirm("Eliminare questo piano di distribuzione?")) return;
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/distribution-plans/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Piano eliminato");
        router.push("/strategies");
      } else {
        toast("Errore nell'eliminazione");
      }
    } catch {
      toast("Errore di rete");
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
        <p className="text-[var(--muted-foreground)]">Caricamento...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-12 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
        <p className="text-[var(--muted-foreground)]">Piano non trovato.</p>
      </div>
    );
  }

  const premiere = plan.entries.find((e) => e.role === "premiere");
  const queue = plan.entries
    .filter((e) => e.role === "queue")
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <PageHeader title={plan.film.titleOriginal} />

      {/* Film info card */}
      <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{plan.film.titleOriginal}</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {plan.film.director} &middot; {plan.film.year} &middot;{" "}
              {plan.film.genre} &middot; {formatDuration(plan.film.duration)} &middot;{" "}
              {plan.film.country}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge value={plan.premiereLevel} />
            <StatusBadge value={plan.status} />
          </div>
        </div>
      </div>

      {/* Premiere section */}
      {premiere && (
        <div>
          <h3 className="font-semibold mb-3">Premiere</h3>
          <div className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50">
            <FestivalMatchCard
              festival={premiere.festivalMaster}
              score={premiere.matchScore || 0}
              reasoning={premiere.matchReasoning || ""}
              status={premiere.status}
            />
          </div>
        </div>
      )}

      {/* Queue section */}
      {queue.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">
            Coda Festival ({queue.length})
          </h3>
          <div className="space-y-3">
            {queue.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{entry.festivalMaster.name}</h4>
                      <StatusBadge value={entry.festivalMaster.category} />
                      <StatusBadge value={entry.status} />
                    </div>
                    {entry.matchScore !== null && (
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Score: {Math.round(entry.matchScore)}
                      </p>
                    )}
                    {entry.matchReasoning && (
                      <p className="text-sm mt-1">{entry.matchReasoning}</p>
                    )}
                  </div>
                </div>

                {/* Action buttons based on status */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {entry.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateEntryStatus(entry.id, "approved")}
                        disabled={actionLoading === entry.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        Approva
                      </button>
                      <button
                        onClick={() => updateEntryStatus(entry.id, "rejected")}
                        disabled={actionLoading === entry.id}
                        className="px-3 py-1.5 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        Rifiuta
                      </button>
                    </>
                  )}

                  {entry.status === "approved" && (
                    <>
                      {subscribeEntryId === entry.id ? (
                        <div className="w-full mt-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] space-y-3">
                          <FormField
                            label="Fee pagata"
                            name="feesPaid"
                            type="number"
                            value={subscribeForm.feesPaid}
                            onChange={(_name: string, value: string | number) =>
                              setSubscribeForm((f) => ({
                                ...f,
                                feesPaid: Number(value),
                              }))
                            }
                          />
                          <FormField
                            label="Piattaforma"
                            name="platform"
                            type="select"
                            value={subscribeForm.platform}
                            onChange={(_name: string, value: string | number) =>
                              setSubscribeForm((f) => ({
                                ...f,
                                platform: String(value),
                              }))
                            }
                            options={PLATFORM_OPTIONS}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubscribe(entry.id)}
                              disabled={actionLoading === entry.id}
                              className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              {actionLoading === entry.id
                                ? "Iscrizione..."
                                : "Conferma Iscrizione"}
                            </button>
                            <button
                              onClick={() => setSubscribeEntryId(null)}
                              className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSubscribeEntryId(entry.id);
                            setSubscribeForm({
                              feesPaid: entry.festivalMaster.feesAmount || 0,
                              platform: "",
                            });
                          }}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:opacity-90"
                        >
                          Iscrivi
                        </button>
                      )}
                    </>
                  )}

                  {entry.status === "subscribed" && entry.submission && (
                    <Link
                      href={`/submissions/${entry.submission.id}`}
                      className="inline-flex items-center gap-1.5"
                    >
                      <StatusBadge value="subscribed" />
                      <span className="text-xs text-[var(--primary)] hover:underline">
                        Vedi iscrizione
                      </span>
                    </Link>
                  )}

                  {entry.status === "rejected" && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Rifiutato
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan-level actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
        {plan.status === "draft" && (
          <button
            onClick={() => updatePlanStatus("active")}
            disabled={actionLoading === "plan-status"}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Attiva Piano
          </button>
        )}
        {plan.status === "active" && (
          <button
            onClick={() => updatePlanStatus("completed")}
            disabled={actionLoading === "plan-status"}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Completa Piano
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={actionLoading === "delete"}
          className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 ml-auto"
        >
          Elimina Piano
        </button>
      </div>
    </div>
  );
}
