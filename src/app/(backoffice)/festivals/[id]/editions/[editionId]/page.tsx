"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface EditionData {
  id: string;
  festivalMasterId: string;
  festivalName: string | null;
  year: number;
  editionNumber: number | null;
  lifecycleStatus: string | null;
  isLocked: boolean;
  // Deadlines
  openingDate: string | null;
  deadlineEarly: string | null;
  deadlineGeneral: string | null;
  deadlineLate: string | null;
  deadlineFinal: string | null;
  deadlineRaw: string | null;
  activeDeadlineType: string | null;
  activeDeadlineDate: string | null;
  // Event
  notificationDate: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  eventPeriodRaw: string | null;
  // Fee
  feeAmountRaw: string | null;
  feeAmount: number | null;
  feeLateFee: number | null;
  feeCurrency: string;
  docuFeeRaw: string | null;
  docuFeeAmount: number | null;
  screeningFee: number | null;
  // Prizes
  prizeRaw: string | null;
  prizeCash: number | null;
  prizeService: string | null;
  prizeDescription: string | null;
  docuPrizeRaw: string | null;
  // Rules
  premiereRules: string | null;
  durationRules: string | null;
  categoryRules: string | null;
  regulationsText: string | null;
  sectionCategories: string | null;
  themes: string | null;
  // Waiver
  waiverPolicy: string | null;
  waiverCode: string | null;
  waiverNotes: string | null;
  // Status
  status: string | null;
  notes: string | null;
}

const LIFECYCLE_OPTIONS = [
  { value: "draft", label: "Bozza" },
  { value: "scouting", label: "Scouting" },
  { value: "submission_open", label: "Iscrizioni aperte" },
  { value: "submission_closed", label: "Iscrizioni chiuse" },
  { value: "selection", label: "Selezione" },
  { value: "event", label: "Evento" },
  { value: "completed", label: "Completata" },
];

const STATUS_OPTIONS = [
  { value: "aperta", label: "Aperta" },
  { value: "chiusa", label: "Chiusa" },
  { value: "in_valutazione", label: "In valutazione" },
  { value: "completata", label: "Completata" },
];

const WAIVER_POLICY_OPTIONS = [
  { value: "non_dichiarata", label: "Non dichiarata" },
  { value: "no_waiver", label: "No waiver" },
  { value: "waiver_disponibile", label: "Waiver disponibile" },
  { value: "waiver_ottenuto", label: "Waiver ottenuto" },
];

const DEADLINE_TYPE_OPTIONS = [
  { value: "none", label: "Nessuna" },
  { value: "early", label: "Early" },
  { value: "regular", label: "Regular" },
  { value: "late", label: "Late" },
  { value: "final", label: "Final" },
];

function toDateInput(val: string | null): string {
  if (!val) return "";
  return val.split("T")[0];
}

export default function EditionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const festivalId = params.id as string;
  const editionId = params.editionId as string;

  const [edition, setEdition] = useState<EditionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    year: 2025,
    editionNumber: 0,
    lifecycleStatus: "",
    openingDate: "",
    deadlineEarly: "",
    deadlineGeneral: "",
    deadlineLate: "",
    deadlineFinal: "",
    activeDeadlineType: "",
    notificationDate: "",
    eventStartDate: "",
    eventEndDate: "",
    feeAmount: 0,
    feeLateFee: 0,
    feeCurrency: "USD",
    docuFeeAmount: 0,
    screeningFee: 0,
    prizeCash: 0,
    prizeService: "",
    prizeDescription: "",
    premiereRules: "",
    durationRules: "",
    categoryRules: "",
    sectionCategories: "",
    themes: "",
    waiverPolicy: "",
    waiverCode: "",
    waiverNotes: "",
    status: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/festival-editions/${editionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore nel caricamento");
        return res.json();
      })
      .then((data: EditionData) => {
        setEdition(data);
        setForm({
          year: data.year,
          editionNumber: data.editionNumber || 0,
          lifecycleStatus: data.lifecycleStatus || "",
          openingDate: toDateInput(data.openingDate),
          deadlineEarly: toDateInput(data.deadlineEarly),
          deadlineGeneral: toDateInput(data.deadlineGeneral),
          deadlineLate: toDateInput(data.deadlineLate),
          deadlineFinal: toDateInput(data.deadlineFinal),
          activeDeadlineType: data.activeDeadlineType || "",
          notificationDate: toDateInput(data.notificationDate),
          eventStartDate: toDateInput(data.eventStartDate),
          eventEndDate: toDateInput(data.eventEndDate),
          feeAmount: data.feeAmount || 0,
          feeLateFee: data.feeLateFee || 0,
          feeCurrency: data.feeCurrency || "USD",
          docuFeeAmount: data.docuFeeAmount || 0,
          screeningFee: data.screeningFee || 0,
          prizeCash: data.prizeCash || 0,
          prizeService: data.prizeService || "",
          prizeDescription: data.prizeDescription || "",
          premiereRules: data.premiereRules || "",
          durationRules: data.durationRules || "",
          categoryRules: data.categoryRules || "",
          sectionCategories: data.sectionCategories || "",
          themes: data.themes || "",
          waiverPolicy: data.waiverPolicy || "",
          waiverCode: data.waiverCode || "",
          waiverNotes: data.waiverNotes || "",
          status: data.status || "",
          notes: data.notes || "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [editionId]);

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      year: form.year,
      editionNumber: form.editionNumber || undefined,
      lifecycleStatus: form.lifecycleStatus || undefined,
      openingDate: form.openingDate || undefined,
      deadlineEarly: form.deadlineEarly || undefined,
      deadlineGeneral: form.deadlineGeneral || undefined,
      deadlineLate: form.deadlineLate || undefined,
      deadlineFinal: form.deadlineFinal || undefined,
      activeDeadlineType: form.activeDeadlineType || undefined,
      notificationDate: form.notificationDate || undefined,
      eventStartDate: form.eventStartDate || undefined,
      eventEndDate: form.eventEndDate || undefined,
      feeAmount: form.feeAmount || undefined,
      feeLateFee: form.feeLateFee || undefined,
      feeCurrency: form.feeCurrency,
      docuFeeAmount: form.docuFeeAmount || undefined,
      screeningFee: form.screeningFee || undefined,
      prizeCash: form.prizeCash || undefined,
      prizeService: form.prizeService || undefined,
      prizeDescription: form.prizeDescription || undefined,
      premiereRules: form.premiereRules || undefined,
      durationRules: form.durationRules || undefined,
      categoryRules: form.categoryRules || undefined,
      sectionCategories: form.sectionCategories || undefined,
      themes: form.themes || undefined,
      waiverPolicy: form.waiverPolicy || undefined,
      waiverCode: form.waiverCode || undefined,
      waiverNotes: form.waiverNotes || undefined,
      status: form.status || undefined,
      notes: form.notes || undefined,
    };

    const res = await fetch(`/api/festival-editions/${editionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      setEdition(updated);
      toast("Edizione salvata con successo");
      setEditing(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.toString() || "Errore durante il salvataggio");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Eliminare questa edizione? L'operazione non e reversibile."
      )
    )
      return;
    const res = await fetch(`/api/festival-editions/${editionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast("Edizione eliminata");
      router.push(`/festivals/${festivalId}`);
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Errore durante l'eliminazione", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edizione" subtitle="Caricamento..." />
      </div>
    );
  }

  if (error && !edition) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edizione" />
        <div className="p-6 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--destructive)]">
            {error || "Edizione non trovata."}
          </p>
          <button
            onClick={() => router.push(`/festivals/${festivalId}`)}
            className="mt-3 text-sm underline"
          >
            Torna al festival
          </button>
        </div>
      </div>
    );
  }

  if (!edition) return null;

  // View mode
  if (!editing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {edition.festivalName || "Edizione"} - {edition.year}
            </h1>
            <button
              onClick={() => router.push(`/festivals/${festivalId}`)}
              className="text-sm text-[var(--muted-foreground)] hover:underline"
            >
              Torna al festival
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Modifica
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Elimina
            </button>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          {edition.lifecycleStatus && (
            <StatusBadge value={edition.lifecycleStatus} />
          )}
          {edition.status && <StatusBadge value={edition.status} />}
          {edition.isLocked && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Bloccata
            </span>
          )}
        </div>

        {/* Info card */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-6 space-y-4">
          {/* Deadlines */}
          <div>
            <p className="text-sm font-medium mb-2">Scadenze</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Apertura</p>
                <p>{formatDate(edition.openingDate)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Early Bird</p>
                <p>{formatDate(edition.deadlineEarly)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Generale</p>
                <p>{formatDate(edition.deadlineGeneral)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Late</p>
                <p>{formatDate(edition.deadlineLate)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Finale</p>
                <p>{formatDate(edition.deadlineFinal)}</p>
              </div>
              {edition.activeDeadlineType && (
                <div>
                  <p className="text-[var(--muted-foreground)]">
                    Deadline attiva
                  </p>
                  <p>
                    {edition.activeDeadlineType}
                    {edition.activeDeadlineDate &&
                      ` (${formatDate(edition.activeDeadlineDate)})`}
                  </p>
                </div>
              )}
            </div>
            {edition.deadlineRaw && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Raw: {edition.deadlineRaw}
              </p>
            )}
          </div>

          {/* Event dates */}
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2">Date evento</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Notifica</p>
                <p>{formatDate(edition.notificationDate)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Inizio</p>
                <p>{formatDate(edition.eventStartDate)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Fine</p>
                <p>{formatDate(edition.eventEndDate)}</p>
              </div>
            </div>
            {edition.eventPeriodRaw && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Raw: {edition.eventPeriodRaw}
              </p>
            )}
          </div>

          {/* Fees */}
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2">Fee</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Fee</p>
                <p>
                  {edition.feeAmount != null
                    ? `${formatCurrency(edition.feeAmount)} ${edition.feeCurrency}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Late Fee</p>
                <p>
                  {edition.feeLateFee != null
                    ? formatCurrency(edition.feeLateFee)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Fee Docu</p>
                <p>
                  {edition.docuFeeAmount != null
                    ? formatCurrency(edition.docuFeeAmount)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Screening Fee</p>
                <p>
                  {edition.screeningFee != null
                    ? formatCurrency(edition.screeningFee)
                    : "—"}
                </p>
              </div>
            </div>
            {edition.feeAmountRaw && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Raw: {edition.feeAmountRaw}
              </p>
            )}
          </div>

          {/* Prizes */}
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2">Premi</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Premio Cash</p>
                <p>
                  {edition.prizeCash != null
                    ? formatCurrency(edition.prizeCash)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Servizi</p>
                <p>{edition.prizeService || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Descrizione</p>
                <p>{edition.prizeDescription || "—"}</p>
              </div>
            </div>
            {edition.prizeRaw && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Raw: {edition.prizeRaw}
              </p>
            )}
          </div>

          {/* Rules */}
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2">Regole</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Premiere</p>
                <p>{edition.premiereRules || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Durata</p>
                <p>{edition.durationRules || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Categorie</p>
                <p>{edition.categoryRules || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Sezioni</p>
                <p>{edition.sectionCategories || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Temi</p>
                <p>{edition.themes || "—"}</p>
              </div>
            </div>
            {edition.regulationsText && (
              <div className="mt-2 text-sm">
                <p className="text-[var(--muted-foreground)]">Regolamento</p>
                <p className="whitespace-pre-wrap">
                  {edition.regulationsText}
                </p>
              </div>
            )}
          </div>

          {/* Waiver */}
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2">Waiver</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Policy</p>
                <p>{edition.waiverPolicy || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Codice</p>
                <p>{edition.waiverCode || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Note</p>
                <p>{edition.waiverNotes || "—"}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {edition.notes && (
            <div className="pt-3 border-t border-[var(--border)] text-sm">
              <p className="text-[var(--muted-foreground)]">Note</p>
              <p className="whitespace-pre-wrap">{edition.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Modifica Edizione ${edition.year}`}
        subtitle={edition.festivalName || undefined}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Basic info */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <p className="text-sm font-medium">Informazioni base</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Anno"
              name="year"
              type="number"
              value={form.year}
              onChange={update}
              required
            />
            <FormField
              label="Numero edizione"
              name="editionNumber"
              type="number"
              value={form.editionNumber}
              onChange={update}
            />
            <FormField
              label="Stato lifecycle"
              name="lifecycleStatus"
              type="select"
              value={form.lifecycleStatus}
              onChange={update}
              options={LIFECYCLE_OPTIONS}
            />
          </div>
          <FormField
            label="Stato"
            name="status"
            type="select"
            value={form.status}
            onChange={update}
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Deadlines */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <p className="text-sm font-medium">Scadenze</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Apertura iscrizioni"
              name="openingDate"
              type="date"
              value={form.openingDate}
              onChange={update}
            />
            <FormField
              label="Deadline Early"
              name="deadlineEarly"
              type="date"
              value={form.deadlineEarly}
              onChange={update}
            />
            <FormField
              label="Deadline Generale"
              name="deadlineGeneral"
              type="date"
              value={form.deadlineGeneral}
              onChange={update}
            />
            <FormField
              label="Deadline Late"
              name="deadlineLate"
              type="date"
              value={form.deadlineLate}
              onChange={update}
            />
            <FormField
              label="Deadline Finale"
              name="deadlineFinal"
              type="date"
              value={form.deadlineFinal}
              onChange={update}
            />
            <FormField
              label="Tipo deadline attiva"
              name="activeDeadlineType"
              type="select"
              value={form.activeDeadlineType}
              onChange={update}
              options={DEADLINE_TYPE_OPTIONS}
            />
          </div>
        </div>

        {/* Event dates */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <p className="text-sm font-medium">Date evento</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Data notifica"
              name="notificationDate"
              type="date"
              value={form.notificationDate}
              onChange={update}
            />
            <FormField
              label="Inizio evento"
              name="eventStartDate"
              type="date"
              value={form.eventStartDate}
              onChange={update}
            />
            <FormField
              label="Fine evento"
              name="eventEndDate"
              type="date"
              value={form.eventEndDate}
              onChange={update}
            />
          </div>
        </div>

        {/* Fees */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <p className="text-sm font-medium">Fee</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Fee"
              name="feeAmount"
              type="number"
              value={form.feeAmount}
              onChange={update}
            />
            <FormField
              label="Late Fee"
              name="feeLateFee"
              type="number"
              value={form.feeLateFee}
              onChange={update}
            />
            <FormField
              label="Valuta"
              name="feeCurrency"
              value={form.feeCurrency}
              onChange={update}
              placeholder="USD"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Fee documentari"
              name="docuFeeAmount"
              type="number"
              value={form.docuFeeAmount}
              onChange={update}
            />
            <FormField
              label="Screening Fee"
              name="screeningFee"
              type="number"
              value={form.screeningFee}
              onChange={update}
            />
          </div>
        </div>

        {/* Prizes */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <p className="text-sm font-medium">Premi</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Premio Cash"
              name="prizeCash"
              type="number"
              value={form.prizeCash}
              onChange={update}
            />
            <FormField
              label="Servizi premio"
              name="prizeService"
              value={form.prizeService}
              onChange={update}
            />
          </div>
          <FormField
            label="Descrizione premi"
            name="prizeDescription"
            type="textarea"
            value={form.prizeDescription}
            onChange={update}
          />
        </div>

        {/* Rules */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <p className="text-sm font-medium">Regole</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Regole premiere"
              name="premiereRules"
              value={form.premiereRules}
              onChange={update}
            />
            <FormField
              label="Regole durata"
              name="durationRules"
              value={form.durationRules}
              onChange={update}
            />
            <FormField
              label="Regole categorie"
              name="categoryRules"
              value={form.categoryRules}
              onChange={update}
            />
            <FormField
              label="Sezioni/categorie"
              name="sectionCategories"
              value={form.sectionCategories}
              onChange={update}
            />
          </div>
          <FormField
            label="Temi"
            name="themes"
            value={form.themes}
            onChange={update}
          />
        </div>

        {/* Waiver */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <p className="text-sm font-medium">Waiver</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Policy waiver"
              name="waiverPolicy"
              type="select"
              value={form.waiverPolicy}
              onChange={update}
              options={WAIVER_POLICY_OPTIONS}
            />
            <FormField
              label="Codice waiver"
              name="waiverCode"
              value={form.waiverCode}
              onChange={update}
            />
            <FormField
              label="Note waiver"
              name="waiverNotes"
              value={form.waiverNotes}
              onChange={update}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <FormField
            label="Note"
            name="notes"
            type="textarea"
            value={form.notes}
            onChange={update}
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError("");
            }}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-sm ml-auto"
          >
            Elimina
          </button>
        </div>
      </form>
    </div>
  );
}
