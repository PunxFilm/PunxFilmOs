"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CompletenessBar } from "@/components/completeness-bar";
import { computeMasterCompleteness } from "@/lib/completeness";
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
  submissions?: SubmissionRecord[];
}

interface SubmissionRecord {
  id: string;
  status: string | null;
  platform: string | null;
  feeAmount: number | null;
  feeCurrency: string | null;
  film: {
    id: string;
    titleOriginal?: string;
    title?: string;
  } | null;
}

interface PlanEntryRecord {
  id: string;
  priority: string | null;
  score: number | null;
  status: string | null;
  plan: {
    id: string;
    film: {
      id: string;
      titleOriginal?: string;
      title?: string;
    } | null;
  } | null;
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
  acceptedThemes: string | null;
  acceptsFirstWork: boolean;
  directorRequirements: string | null;
  maxYearsProduction: number | null;
  punxRating: number | null;
  qualityScore: number | null;
  academyQualifying: boolean;
  baftaQualifying: boolean;
  efaQualifying: boolean;
  goyaQualifying: boolean;
  canadianScreenQualifying: boolean;
  shortFilmConferenceMember: boolean;
  qualifying: string | null;
  screeningType: string | null;
  industry: boolean;
  travelSupport: string | null;
  hospitalitySupport: string | null;
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
  regulationsUrl: string | null;
  foundedYear: number | null;
  openingDate: string | null;
  canonicalName: string | null;
  dataConfidenceScore: number | null;
  verificationStatus: string | null;
  lastVerifiedAt: string | null;
  verificationNotes: string | null;
  editions: FestivalEdition[];
  planEntries?: PlanEntryRecord[];
}

interface WaiverRequestRecord {
  id: string;
  status: string;
  requestedAt: string;
  respondedAt: string | null;
  waiverCode: string | null;
  waiverType: string | null;
  templateUsed: string | null;
  emailSentTo: string | null;
  notes: string | null;
  createdAt: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  first_contact: "Primo contatto",
  follow_up: "Follow-up",
  thank_you: "Ringraziamento",
};

const WAIVER_LABELS: Record<string, string> = {
  none: "Nessun waiver",
  code: "Codice waiver",
  agreement: "Accordo",
  request_pending: "Richiesta in corso",
};

const VERIFICATION_LABELS: Record<string, string> = {
  unverified: "Non verificato",
  verified: "Verificato",
  needs_review: "Da rivedere",
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

  // Waiver request state
  const [waiverRequests, setWaiverRequests] = useState<WaiverRequestRecord[]>([]);
  const [waiverLoading, setWaiverLoading] = useState(false);
  const [showWaiverPanel, setShowWaiverPanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string; to: string } | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [sendingWaiver, setSendingWaiver] = useState(false);
  const [approveDialogId, setApproveDialogId] = useState<string | null>(null);
  const [approveCode, setApproveCode] = useState("");
  const [approveType, setApproveType] = useState<string>("code");

  const festivalId = params.id as string;

  const loadWaiverRequests = useCallback(async () => {
    setWaiverLoading(true);
    try {
      const res = await fetch(`/api/waiver-requests?festivalMasterId=${festivalId}`);
      if (res.ok) {
        const data = await res.json();
        setWaiverRequests(data);
      }
    } catch {
      // silent
    } finally {
      setWaiverLoading(false);
    }
  }, [festivalId]);

  const handleGenerateEmail = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setGeneratingEmail(true);
    setGeneratedEmail(null);
    try {
      const res = await fetch("/api/waiver-requests/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, festivalMasterId: festivalId }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedEmail(data);
      } else {
        toast("Errore nella generazione dell'email", "error");
      }
    } catch {
      toast("Errore nella generazione dell'email", "error");
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSendWaiver = async () => {
    if (!generatedEmail || !selectedTemplate) return;
    setSendingWaiver(true);
    try {
      const res = await fetch("/api/waiver-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festivalMasterId: festivalId,
          status: "sent",
          templateUsed: selectedTemplate,
          emailSentTo: generatedEmail.to,
        }),
      });
      if (res.ok) {
        toast("Richiesta waiver registrata");
        setShowWaiverPanel(false);
        setGeneratedEmail(null);
        setSelectedTemplate("");
        loadWaiverRequests();
        // Update festival master waiver status to request_pending
        await fetch(`/api/festival-masters/${festivalId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waiverType: "request_pending" }),
        });
        if (festival) {
          setFestival({ ...festival, waiverType: "request_pending" });
        }
      } else {
        toast("Errore nella creazione della richiesta", "error");
      }
    } catch {
      toast("Errore nella creazione della richiesta", "error");
    } finally {
      setSendingWaiver(false);
    }
  };

  const handleCopyEmail = () => {
    if (!generatedEmail) return;
    const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    navigator.clipboard.writeText(text).then(() => {
      toast("Email copiata negli appunti");
    });
  };

  const handleOpenMailto = () => {
    if (!generatedEmail) return;
    const mailto = `mailto:${encodeURIComponent(generatedEmail.to)}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`;
    window.open(mailto, "_blank");
  };

  const handleApproveWaiver = async (requestId: string) => {
    try {
      const res = await fetch(`/api/waiver-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          waiverCode: approveCode || null,
          waiverType: approveType,
        }),
      });
      if (res.ok) {
        toast("Waiver approvato");
        setApproveDialogId(null);
        setApproveCode("");
        setApproveType("code");
        loadWaiverRequests();
        // Refresh festival data to reflect updated waiver status
        const festRes = await fetch(`/api/festival-masters/${festivalId}`);
        if (festRes.ok) {
          const festData = await festRes.json();
          setFestival(festData);
        }
      } else {
        toast("Errore nell'approvazione", "error");
      }
    } catch {
      toast("Errore nell'approvazione", "error");
    }
  };

  const handleRejectWaiver = async (requestId: string) => {
    try {
      const res = await fetch(`/api/waiver-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) {
        toast("Richiesta segnata come rifiutata");
        loadWaiverRequests();
      } else {
        toast("Errore nell'aggiornamento", "error");
      }
    } catch {
      toast("Errore nell'aggiornamento", "error");
    }
  };

  const handleMarkVerified = async () => {
    if (!festival) return;
    try {
      const res = await fetch(`/api/festival-masters/${festivalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "verified",
          lastVerifiedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setFestival({
          ...festival,
          verificationStatus: "verified",
          lastVerifiedAt: new Date().toISOString(),
        });
        toast("Festival segnato come verificato");
      } else {
        toast("Errore nell'aggiornamento", "error");
      }
    } catch {
      toast("Errore nell'aggiornamento", "error");
    }
  };

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

  useEffect(() => {
    loadWaiverRequests();
  }, [loadWaiverRequests]);

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

  const completeness = computeMasterCompleteness(festival as unknown as Record<string, unknown>);

  // Flatten all submissions from all editions
  const allSubmissions = (festival.editions ?? []).flatMap((edition) =>
    (edition.submissions ?? []).map((sub) => ({
      ...sub,
      editionYear: edition.year,
    }))
  );

  // Plan entries
  const planEntries = festival.planEntries ?? [];

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
          {/* Completeness & Verification */}
          <div className="flex items-center gap-4 mt-3">
            <div className="w-48">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Completezza dati</p>
              <CompletenessBar
                score={completeness.score}
                size="md"
                showLabel
                missingFields={completeness.groups.flatMap((g) => g.missingFields)}
              />
            </div>
            {festival.verificationStatus && (
              <div>
                <p className="text-xs text-[var(--muted-foreground)] mb-1">Verifica</p>
                <StatusBadge value={festival.verificationStatus} />
              </div>
            )}
            {festival.verificationStatus !== "verified" && (
              <button
                onClick={handleMarkVerified}
                className="mt-3 px-3 py-1.5 text-xs font-medium border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Segna come verificato
              </button>
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

      {/* Requisiti Film */}
      {(festival.acceptedGenres || festival.acceptedThemes || festival.acceptsFirstWork || festival.directorRequirements || festival.maxYearsProduction) && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-3">
          <h2 className="text-lg font-semibold">Requisiti Film</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {festival.acceptedGenres && (
              <div>
                <p className="text-[var(--muted-foreground)]">Generi accettati</p>
                <p>{festival.acceptedGenres}</p>
              </div>
            )}
            {festival.acceptedThemes && (
              <div>
                <p className="text-[var(--muted-foreground)]">Temi</p>
                <p>{festival.acceptedThemes}</p>
              </div>
            )}
            {festival.acceptsFirstWork && (
              <div>
                <p className="text-[var(--muted-foreground)]">Opera prima</p>
                <p>Accetta opera prima</p>
              </div>
            )}
            {festival.directorRequirements && (
              <div>
                <p className="text-[var(--muted-foreground)]">Requisiti regista</p>
                <p>{festival.directorRequirements}</p>
              </div>
            )}
            {festival.maxYearsProduction != null && (
              <div>
                <p className="text-[var(--muted-foreground)]">Max anni produzione</p>
                <p>{festival.maxYearsProduction} anni</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supporto */}
      {(festival.travelSupport || festival.hospitalitySupport) && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-3">
          <h2 className="text-lg font-semibold">Supporto</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {festival.travelSupport && (
              <div>
                <p className="text-[var(--muted-foreground)]">Supporto viaggio</p>
                <p>{festival.travelSupport}</p>
              </div>
            )}
            {festival.hospitalitySupport && (
              <div>
                <p className="text-[var(--muted-foreground)]">Ospitalita</p>
                <p>{festival.hospitalitySupport}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links */}
      {(festival.submissionUrlBase || festival.regulationsUrl) && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-3">
          <h2 className="text-lg font-semibold">Links</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {festival.submissionUrlBase && (
              <div>
                <p className="text-[var(--muted-foreground)]">URL Iscrizione</p>
                <a
                  href={festival.submissionUrlBase.startsWith("http") ? festival.submissionUrlBase : `https://${festival.submissionUrlBase}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline break-all"
                >
                  {festival.submissionUrlBase}
                </a>
              </div>
            )}
            {festival.regulationsUrl && (
              <div>
                <p className="text-[var(--muted-foreground)]">Regolamento</p>
                <a
                  href={festival.regulationsUrl.startsWith("http") ? festival.regulationsUrl : `https://${festival.regulationsUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline break-all"
                >
                  {festival.regulationsUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Qualificazioni extra */}
      {(festival.goyaQualifying || festival.canadianScreenQualifying || festival.shortFilmConferenceMember || festival.qualifying) && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-3">
          <h2 className="text-lg font-semibold">Qualificazioni extra</h2>
          <div className="flex flex-wrap gap-2">
            {festival.goyaQualifying && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Goya Qualifying
              </span>
            )}
            {festival.canadianScreenQualifying && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Canadian Screen Qualifying
              </span>
            )}
            {festival.shortFilmConferenceMember && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Short Film Conference Member
              </span>
            )}
            {festival.qualifying && (
              <div className="w-full mt-2 text-sm">
                <p className="text-[var(--muted-foreground)]">Altre qualificazioni</p>
                <p>{festival.qualifying}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meta */}
      {(festival.foundedYear || festival.openingDate || festival.canonicalName || festival.dataConfidenceScore != null) && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-3">
          <h2 className="text-lg font-semibold">Meta</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {festival.foundedYear && (
              <div>
                <p className="text-[var(--muted-foreground)]">Anno fondazione</p>
                <p>{festival.foundedYear}</p>
              </div>
            )}
            {festival.openingDate && (
              <div>
                <p className="text-[var(--muted-foreground)]">Data apertura</p>
                <p>{formatDate(festival.openingDate)}</p>
              </div>
            )}
            {festival.canonicalName && (
              <div>
                <p className="text-[var(--muted-foreground)]">Nome canonico</p>
                <p>{festival.canonicalName}</p>
              </div>
            )}
            {festival.dataConfidenceScore != null && (
              <div>
                <p className="text-[var(--muted-foreground)]">Confidenza dati</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        festival.dataConfidenceScore >= 70
                          ? "bg-emerald-500"
                          : festival.dataConfidenceScore >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${festival.dataConfidenceScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{festival.dataConfidenceScore}/100</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verifica */}
      <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-3">
        <h2 className="text-lg font-semibold">Verifica</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[var(--muted-foreground)]">Stato verifica</p>
            <StatusBadge value={festival.verificationStatus || "unverified"} />
          </div>
          {festival.lastVerifiedAt && (
            <div>
              <p className="text-[var(--muted-foreground)]">Ultima verifica</p>
              <p>{formatDate(festival.lastVerifiedAt)}</p>
            </div>
          )}
          {festival.verificationNotes && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-[var(--muted-foreground)]">Note verifica</p>
              <p className="whitespace-pre-wrap">{festival.verificationNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Waiver Section */}
      <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Waiver</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Stato attuale:{" "}
              <span className="font-medium">
                {WAIVER_LABELS[festival.waiverType] || festival.waiverType}
              </span>
              {festival.waiverDetails && (
                <span> - {festival.waiverDetails}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setShowWaiverPanel(!showWaiverPanel);
              setGeneratedEmail(null);
              setSelectedTemplate("");
            }}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {showWaiverPanel ? "Chiudi" : "Richiedi Waiver"}
          </button>
        </div>

        {/* Inline waiver request panel */}
        {showWaiverPanel && (
          <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--secondary)] space-y-4">
            <p className="text-sm font-medium">Seleziona template email</p>
            <div className="flex gap-2">
              {[
                { id: "first_contact", label: "Primo contatto" },
                { id: "follow_up", label: "Follow-up" },
                { id: "thank_you", label: "Ringraziamento" },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleGenerateEmail(tpl.id)}
                  disabled={generatingEmail}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedTemplate === tpl.id
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                      : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                  } disabled:opacity-50`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {generatingEmail && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Generazione email in corso...
              </p>
            )}

            {generatedEmail && (
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-[var(--muted-foreground)]">Destinatario</p>
                  <p className="font-medium">{generatedEmail.to || "Nessuna email trovata"}</p>
                </div>
                <div className="text-sm">
                  <p className="text-[var(--muted-foreground)]">Oggetto</p>
                  <p className="font-medium">{generatedEmail.subject}</p>
                </div>
                <div className="text-sm">
                  <p className="text-[var(--muted-foreground)] mb-1">Corpo email</p>
                  <pre className="whitespace-pre-wrap text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 max-h-64 overflow-y-auto">
                    {generatedEmail.body}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyEmail}
                    className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                  >
                    Copia email
                  </button>
                  <button
                    onClick={handleOpenMailto}
                    className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                  >
                    Apri Mail
                  </button>
                  <button
                    onClick={handleSendWaiver}
                    disabled={sendingWaiver}
                    className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {sendingWaiver ? "Registrazione..." : "Registra come inviata"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Waiver requests list */}
        {waiverLoading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Caricamento richieste...</p>
        ) : waiverRequests.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Nessuna richiesta waiver registrata.
          </p>
        ) : (
          <div className="space-y-2">
            {waiverRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between border border-[var(--border)] rounded-lg p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge value={req.status} />
                  <span className="text-[var(--muted-foreground)]">
                    {formatDate(req.requestedAt)}
                  </span>
                  {req.templateUsed && (
                    <span className="text-[var(--muted-foreground)]">
                      {TEMPLATE_LABELS[req.templateUsed] || req.templateUsed}
                    </span>
                  )}
                  {req.emailSentTo && (
                    <span className="text-[var(--muted-foreground)] break-all">
                      {req.emailSentTo}
                    </span>
                  )}
                  {req.waiverCode && (
                    <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-xs">
                      {req.waiverCode}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {req.status === "sent" && (
                    <>
                      {approveDialogId === req.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={approveType}
                            onChange={(e) => setApproveType(e.target.value)}
                            className="px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--card)]"
                          >
                            <option value="code">Codice</option>
                            <option value="agreement">Accordo</option>
                            <option value="free">Gratuito</option>
                          </select>
                          {approveType === "code" && (
                            <input
                              type="text"
                              placeholder="Codice waiver"
                              value={approveCode}
                              onChange={(e) => setApproveCode(e.target.value)}
                              className="px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--card)] w-32"
                            />
                          )}
                          <button
                            onClick={() => handleApproveWaiver(req.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:opacity-90"
                          >
                            Conferma
                          </button>
                          <button
                            onClick={() => {
                              setApproveDialogId(null);
                              setApproveCode("");
                              setApproveType("code");
                            }}
                            className="px-2 py-1 text-xs text-[var(--muted-foreground)] hover:underline"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setApproveDialogId(req.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:opacity-90"
                          >
                            Waiver ricevuto
                          </button>
                          <button
                            onClick={() => handleRejectWaiver(req.id)}
                            className="px-2 py-1 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded text-xs font-medium hover:opacity-90"
                          >
                            Rifiutato
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storico Iscrizioni */}
      {allSubmissions.length > 0 && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold">Storico Iscrizioni</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Film</th>
                  <th className="text-left px-4 py-3 font-medium">Anno</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Piattaforma</th>
                  <th className="text-left px-4 py-3 font-medium">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {allSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[var(--secondary)] transition-colors">
                    <td className="px-4 py-3">
                      {sub.film ? (
                        <Link
                          href={`/films/${sub.film.id}`}
                          className="font-medium text-[var(--primary)] hover:underline"
                        >
                          {sub.film.titleOriginal || sub.film.title || "—"}
                        </Link>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{sub.editionYear}</td>
                    <td className="px-4 py-3">
                      {sub.status ? <StatusBadge value={sub.status} /> : "—"}
                    </td>
                    <td className="px-4 py-3">{sub.platform || "—"}</td>
                    <td className="px-4 py-3">
                      {sub.feeAmount != null
                        ? formatCurrency(sub.feeAmount, sub.feeCurrency || "EUR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Piani Collegati */}
      {planEntries.length > 0 && (
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold">Piani Collegati</h2>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Film</th>
                  <th className="text-left px-4 py-3 font-medium">Priorita</th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {planEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[var(--secondary)] transition-colors">
                    <td className="px-4 py-3">
                      {entry.plan?.film ? (
                        <Link
                          href={`/strategies/${entry.plan.id}`}
                          className="font-medium text-[var(--primary)] hover:underline"
                        >
                          {entry.plan.film.titleOriginal || entry.plan.film.title || "—"}
                        </Link>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.priority ? <StatusBadge value={entry.priority} /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {entry.score != null ? (
                        <span className="font-medium">{entry.score}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.status ? <StatusBadge value={entry.status} /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
