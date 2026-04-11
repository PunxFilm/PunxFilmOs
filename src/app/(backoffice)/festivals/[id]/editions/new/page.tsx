"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";

interface EditionSummary {
  id: string;
  year: number;
  feeAmount: number | null;
  feeCurrency: string;
  premiereRules: string | null;
  durationRules: string | null;
  categoryRules: string | null;
  sectionCategories: string | null;
  themes: string | null;
  waiverPolicy: string | null;
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

export default function NewEditionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const festivalId = params.id as string;

  const [festivalName, setFestivalName] = useState("");
  const [editions, setEditions] = useState<EditionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    editionNumber: 0,
    lifecycleStatus: "",
    status: "",
    // Deadlines
    openingDate: "",
    deadlineEarly: "",
    deadlineGeneral: "",
    deadlineLate: "",
    deadlineFinal: "",
    activeDeadlineType: "",
    // Event dates
    notificationDate: "",
    eventStartDate: "",
    eventEndDate: "",
    // Fee
    feeAmount: 0,
    feeLateFee: 0,
    feeCurrency: "USD",
    docuFeeAmount: 0,
    screeningFee: 0,
    // Prizes
    prizeCash: 0,
    prizeService: "",
    prizeDescription: "",
    // Rules
    premiereRules: "",
    durationRules: "",
    categoryRules: "",
    sectionCategories: "",
    themes: "",
    // Waiver
    waiverPolicy: "",
    waiverCode: "",
    waiverNotes: "",
    // Notes
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [masterRes, editionsRes] = await Promise.all([
          fetch(`/api/festival-masters/${festivalId}`),
          fetch(`/api/festival-masters/${festivalId}/editions`),
        ]);

        if (masterRes.ok) {
          const masterData = await masterRes.json();
          setFestivalName(masterData.name || "");
        }

        if (editionsRes.ok) {
          const editionsData = await editionsRes.json();
          setEditions(editionsData);
          // Set default year to latest + 1
          if (editionsData.length > 0) {
            const latestYear = Math.max(...editionsData.map((e: EditionSummary) => e.year));
            setForm((f) => ({ ...f, year: latestYear + 1 }));
          }
        }
      } catch {
        setError("Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [festivalId]);

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleCopyFromPrevious = () => {
    if (editions.length === 0) return;
    const sorted = [...editions].sort((a, b) => b.year - a.year);
    const latest = sorted[0];

    setForm((f) => ({
      ...f,
      feeAmount: latest.feeAmount || 0,
      feeCurrency: latest.feeCurrency || "USD",
      premiereRules: latest.premiereRules || "",
      durationRules: latest.durationRules || "",
      categoryRules: latest.categoryRules || "",
      sectionCategories: latest.sectionCategories || "",
      themes: latest.themes || "",
      waiverPolicy: latest.waiverPolicy || "",
    }));

    toast(`Dati copiati dall'edizione ${latest.year}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.year) {
      setError("L'anno e obbligatorio");
      return;
    }
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      year: form.year,
      editionNumber: form.editionNumber || undefined,
      lifecycleStatus: form.lifecycleStatus || undefined,
      status: form.status || undefined,
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
      notes: form.notes || undefined,
    };

    try {
      const res = await fetch(`/api/festival-masters/${festivalId}/editions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast("Edizione creata con successo");
        router.push(`/festivals/${festivalId}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error?.toString() || "Errore durante il salvataggio");
      }
    } catch {
      setError("Errore di rete durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuova Edizione" subtitle="Caricamento..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Nuova Edizione"
        subtitle={festivalName || undefined}
      />

      {/* Copy from previous button */}
      {editions.length > 0 && (
        <button
          type="button"
          onClick={handleCopyFromPrevious}
          className="px-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          Copia da edizione precedente
        </button>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Basic info */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <h3 className="font-semibold">Informazioni base</h3>
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
          <h3 className="font-semibold">Scadenze</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Apertura iscrizioni" name="openingDate" type="date" value={form.openingDate} onChange={update} />
            <FormField label="Deadline Early" name="deadlineEarly" type="date" value={form.deadlineEarly} onChange={update} />
            <FormField label="Deadline Generale" name="deadlineGeneral" type="date" value={form.deadlineGeneral} onChange={update} />
            <FormField label="Deadline Late" name="deadlineLate" type="date" value={form.deadlineLate} onChange={update} />
            <FormField label="Deadline Finale" name="deadlineFinal" type="date" value={form.deadlineFinal} onChange={update} />
            <FormField label="Tipo deadline attiva" name="activeDeadlineType" type="select" value={form.activeDeadlineType} onChange={update} options={DEADLINE_TYPE_OPTIONS} />
          </div>
        </div>

        {/* Event dates */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <h3 className="font-semibold">Date evento</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Data notifica" name="notificationDate" type="date" value={form.notificationDate} onChange={update} />
            <FormField label="Inizio evento" name="eventStartDate" type="date" value={form.eventStartDate} onChange={update} />
            <FormField label="Fine evento" name="eventEndDate" type="date" value={form.eventEndDate} onChange={update} />
          </div>
        </div>

        {/* Fees */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <h3 className="font-semibold">Fee</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Fee" name="feeAmount" type="number" value={form.feeAmount} onChange={update} />
            <FormField label="Late Fee" name="feeLateFee" type="number" value={form.feeLateFee} onChange={update} />
            <FormField label="Valuta" name="feeCurrency" value={form.feeCurrency} onChange={update} placeholder="USD" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fee documentari" name="docuFeeAmount" type="number" value={form.docuFeeAmount} onChange={update} />
            <FormField label="Screening Fee" name="screeningFee" type="number" value={form.screeningFee} onChange={update} />
          </div>
        </div>

        {/* Prizes */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <h3 className="font-semibold">Premi</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Premio Cash" name="prizeCash" type="number" value={form.prizeCash} onChange={update} />
            <FormField label="Servizi premio" name="prizeService" value={form.prizeService} onChange={update} />
          </div>
          <FormField label="Descrizione premi" name="prizeDescription" type="textarea" value={form.prizeDescription} onChange={update} />
        </div>

        {/* Rules */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <h3 className="font-semibold">Regole</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Regole premiere" name="premiereRules" value={form.premiereRules} onChange={update} />
            <FormField label="Regole durata" name="durationRules" value={form.durationRules} onChange={update} />
            <FormField label="Regole categorie" name="categoryRules" value={form.categoryRules} onChange={update} />
            <FormField label="Sezioni/categorie" name="sectionCategories" value={form.sectionCategories} onChange={update} />
          </div>
          <FormField label="Temi" name="themes" value={form.themes} onChange={update} />
        </div>

        {/* Waiver */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <h3 className="font-semibold">Waiver</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Policy waiver" name="waiverPolicy" type="select" value={form.waiverPolicy} onChange={update} options={WAIVER_POLICY_OPTIONS} />
            <FormField label="Codice waiver" name="waiverCode" value={form.waiverCode} onChange={update} />
            <FormField label="Note waiver" name="waiverNotes" value={form.waiverNotes} onChange={update} />
          </div>
        </div>

        {/* Notes */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] p-4 space-y-4">
          <h3 className="font-semibold">Note</h3>
          <FormField label="Note" name="notes" type="textarea" value={form.notes} onChange={update} rows={4} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Crea Edizione"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/festivals/${festivalId}`)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
