"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency, computeEditionStatus } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface FestivalEdition {
  id: string;
  year: number;
  lifecycleStatus: string | null;
  openingDate: string | null;
  deadlineEarly: string | null;
  deadlineGeneral: string | null;
  deadlineLate: string | null;
  deadlineFinal: string | null;
  notificationDate: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  feeAmount: number | null;
  feeCurrency: string;
  premiereRules: string | null;
  prizeCash: number | null;
  prizeDescription: string | null;
  status: string | null;
}

interface FestivalMasterDetail {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string | null;
  website: string | null;
  instagram: string | null;
  classification: string | null;
  type: string | null;
  focus: string | null;
  maxMinutes: number | null;
  acceptedGenres: string | null;
  acceptsFirstWork: boolean;
  punxRating: number | null;
  qualityScore: number | null;
  academyQualifying: boolean;
  baftaQualifying: boolean;
  efaQualifying: boolean;
  screeningType: string | null;
  industry: boolean;
  contactName: string | null;
  contactRole: string | null;
  contactTelephone: string | null;
  contactEmailDirector: string | null;
  contactEmailInfo: string | null;
  contactEmailTechnical: string | null;
  internalNotes: string | null;
  punxHistory: string | null;
  waiverType: string;
  waiverDetails: string | null;
  submissionPlatform: string | null;
  submissionUrlBase: string | null;
  editions: FestivalEdition[];
}

const WAIVER_LABELS: Record<string, string> = {
  none: "Nessun waiver",
  code: "Codice waiver",
  agreement: "Accordo",
  request_pending: "Richiesta in corso",
};

export default function FestivalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [festival, setFestival] = useState<FestivalMasterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const festivalId = params.id as string;

  useEffect(() => {
    fetch(`/api/festival-masters/${festivalId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore nel caricamento");
        return res.json();
      })
      .then((data) => setFestival(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [festivalId]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Eliminare questo festival e tutte le sue edizioni? L'operazione non e reversibile."
      )
    )
      return;
    const res = await fetch(`/api/festival-masters/${festivalId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast("Festival eliminato");
      router.push("/festivals");
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Errore durante l'eliminazione", "error");
    }
  };

  const handleSetRating = async (rating: number) => {
    if (savingRating || !festival) return;
    const newRating = festival.punxRating === rating ? null : rating;
    setSavingRating(true);
    try {
      const res = await fetch(`/api/festival-masters/${festivalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ punxRating: newRating }),
      });
      if (res.ok) {
        setFestival({ ...festival, punxRating: newRating });
        toast(newRating ? `Rating impostato: ${newRating}/5` : "Rating rimosso");
      } else {
        toast("Errore nel salvataggio del rating", "error");
      }
    } catch {
      toast("Errore nel salvataggio del rating", "error");
    } finally {
      setSavingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Festival" subtitle="Caricamento..." />
      </div>
    );
  }

  if (error || !festival) {
    return (
      <div className="space-y-6">
        <PageHeader title="Festival" />
        <div className="p-6 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--destructive)]">
            {error || "Festival non trovato."}
          </p>
          <button
            onClick={() => router.push("/festivals")}
            className="mt-3 text-sm underline"
          >
            Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  const hasContacts =
    festival.contactName ||
    festival.contactEmailDirector ||
    festival.contactEmailInfo ||
    festival.contactEmailTechnical ||
    festival.contactTelephone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{festival.name}</h1>
          <p className="text-[var(--muted-foreground)]">
            {festival.city}
            {festival.region ? `, ${festival.region}` : ""}, {festival.country}
          </p>
          {/* PunxFilm Rating */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-[var(--muted-foreground)]">PunxFilm Rating:</span>
            <div
              className="flex gap-0.5"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleSetRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  disabled={savingRating}
                  className="text-xl cursor-pointer hover:scale-110 transition-transform disabled:opacity-50"
                  title={festival.punxRating === star ? "Clicca per rimuovere" : `${star}/5`}
                >
                  <span className={
                    (hoverRating ? star <= hoverRating : star <= (festival.punxRating ?? 0))
                      ? "text-amber-500"
                      : "text-gray-300"
                  }>
                    {(hoverRating ? star <= hoverRating : star <= (festival.punxRating ?? 0)) ? "★" : "☆"}
                  </span>
                </button>
              ))}
            </div>
            {festival.punxRating && (
              <span className="text-sm font-medium">{festival.punxRating}/5</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/festivals/${festivalId}/edit`}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Modifica
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Elimina
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          {festival.classification && (
            <StatusBadge value={festival.classification} />
          )}
          {festival.type && <StatusBadge value={festival.type} />}
          {festival.academyQualifying && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Academy Qualifying
            </span>
          )}
          {festival.baftaQualifying && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              BAFTA Qualifying
            </span>
          )}
          {festival.efaQualifying && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              EFA Qualifying
            </span>
          )}
          {festival.industry && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Industry
            </span>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {festival.website && (
            <div>
              <p className="text-[var(--muted-foreground)]">Sito web</p>
              <a
                href={
                  festival.website.startsWith("http")
                    ? festival.website
                    : `https://${festival.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:underline break-all"
              >
                {festival.website}
              </a>
            </div>
          )}
          {festival.instagram && (
            <div>
              <p className="text-[var(--muted-foreground)]">Instagram</p>
              <p>{festival.instagram}</p>
            </div>
          )}
          {festival.focus && (
            <div>
              <p className="text-[var(--muted-foreground)]">Focus</p>
              <p>{festival.focus}</p>
            </div>
          )}
          {festival.maxMinutes && (
            <div>
              <p className="text-[var(--muted-foreground)]">Durata max</p>
              <p>{festival.maxMinutes} min</p>
            </div>
          )}
          {festival.screeningType && (
            <div>
              <p className="text-[var(--muted-foreground)]">Tipo proiezione</p>
              <p>{festival.screeningType}</p>
            </div>
          )}
          {festival.submissionPlatform && (
            <div>
              <p className="text-[var(--muted-foreground)]">Piattaforma</p>
              <p>{festival.submissionPlatform}</p>
            </div>
          )}
          {festival.qualityScore != null && (
            <div>
              <p className="text-[var(--muted-foreground)]">AI Quality Score</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      festival.qualityScore >= 70
                        ? "bg-emerald-500"
                        : festival.qualityScore >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${festival.qualityScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{festival.qualityScore}/100</span>
              </div>
            </div>
          )}
        </div>

        {/* Waiver */}
        <div className="text-sm">
          <p className="text-[var(--muted-foreground)]">Waiver</p>
          <p>
            {WAIVER_LABELS[festival.waiverType] || festival.waiverType}
            {festival.waiverDetails && (
              <span className="text-[var(--muted-foreground)]">
                {" "}
                - {festival.waiverDetails}
              </span>
            )}
          </p>
        </div>

        {/* Contacts */}
        {hasContacts && (
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2">Contatti</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {festival.contactName && (
                <div>
                  <p className="text-[var(--muted-foreground)]">Nome</p>
                  <p>
                    {festival.contactName}
                    {festival.contactRole && (
                      <span className="text-[var(--muted-foreground)]">
                        {" "}
                        ({festival.contactRole})
                      </span>
                    )}
                  </p>
                </div>
              )}
              {festival.contactEmailDirector && (
                <div>
                  <p className="text-[var(--muted-foreground)]">
                    Email Direttore
                  </p>
                  <p className="break-all">{festival.contactEmailDirector}</p>
                </div>
              )}
              {festival.contactEmailInfo && (
                <div>
                  <p className="text-[var(--muted-foreground)]">Email Info</p>
                  <p className="break-all">{festival.contactEmailInfo}</p>
                </div>
              )}
              {festival.contactEmailTechnical && (
                <div>
                  <p className="text-[var(--muted-foreground)]">
                    Email Tecnico
                  </p>
                  <p className="break-all">{festival.contactEmailTechnical}</p>
                </div>
              )}
              {festival.contactTelephone && (
                <div>
                  <p className="text-[var(--muted-foreground)]">Telefono</p>
                  <p>{festival.contactTelephone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Internal notes & PunxFilm history */}
        {(festival.internalNotes || festival.punxHistory) && (
          <div className="pt-3 border-t border-[var(--border)] space-y-3">
            {festival.internalNotes && (
              <div className="text-sm">
                <p className="text-[var(--muted-foreground)]">Note interne</p>
                <p className="whitespace-pre-wrap">{festival.internalNotes}</p>
              </div>
            )}
            {festival.punxHistory && (
              <div className="text-sm">
                <p className="text-[var(--muted-foreground)]">
                  Storico PunxFilm
                </p>
                <p className="whitespace-pre-wrap">{festival.punxHistory}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edizioni</h2>
          <Link
            href={`/festivals/${festivalId}/editions/new`}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Nuova Edizione
          </Link>
        </div>

        {(!festival.editions || festival.editions.length === 0) ? (
          <div className="p-8 text-center border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <p className="text-[var(--muted-foreground)]">
              Nessuna edizione registrata.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {festival.editions
              .sort((a, b) => b.year - a.year)
              .map((edition) => {
                const editionStatus = computeEditionStatus(edition);
                return (
                <Link
                  key={edition.id}
                  href={`/festivals/${festivalId}/editions/${edition.id}`}
                  className="block border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 hover:bg-[var(--secondary)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          {edition.year}
                        </span>
                        {edition.lifecycleStatus && (
                          <StatusBadge value={edition.lifecycleStatus} />
                        )}
                        {edition.status && (
                          <StatusBadge value={edition.status} />
                        )}
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${editionStatus.color}`}
                        >
                          {editionStatus.label}
                        </span>
                        {editionStatus.countdown && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {editionStatus.countdown}
                          </span>
                        )}
                      </div>

                      {/* Deadlines */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
                        {edition.deadlineEarly && (
                          <span>
                            Early: {formatDate(edition.deadlineEarly)}
                          </span>
                        )}
                        {edition.deadlineGeneral && (
                          <span>
                            Generale: {formatDate(edition.deadlineGeneral)}
                          </span>
                        )}
                        {edition.deadlineLate && (
                          <span>Late: {formatDate(edition.deadlineLate)}</span>
                        )}
                        {edition.deadlineFinal && (
                          <span>
                            Finale: {formatDate(edition.deadlineFinal)}
                          </span>
                        )}
                      </div>

                      {/* Event dates */}
                      {(edition.eventStartDate || edition.eventEndDate) && (
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Evento: {formatDate(edition.eventStartDate)}
                          {edition.eventEndDate &&
                            ` - ${formatDate(edition.eventEndDate)}`}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1 text-sm">
                      {edition.feeAmount != null && (
                        <p>
                          Fee:{" "}
                          {formatCurrency(
                            edition.feeAmount,
                            edition.feeCurrency
                          )}
                        </p>
                      )}
                      {edition.premiereRules && (
                        <p className="text-[var(--muted-foreground)]">
                          Premiere: {edition.premiereRules}
                        </p>
                      )}
                      {edition.prizeCash != null && edition.prizeCash > 0 && (
                        <p className="text-emerald-700">
                          Premio: {formatCurrency(edition.prizeCash)}
                        </p>
                      )}
                      {edition.prizeDescription && !edition.prizeCash && (
                        <p className="text-[var(--muted-foreground)]">
                          {edition.prizeDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
