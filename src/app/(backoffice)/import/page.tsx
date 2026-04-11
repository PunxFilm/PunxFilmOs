"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { WizardStepper } from "@/components/wizard-stepper";
import { FormField } from "@/components/form-field";
import { StatusBadge } from "@/components/status-badge";
import { AiLoading } from "@/components/ai-loading";
import { useToast } from "@/components/toast";
import { formatDuration } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ImportMethod = "pdf" | "csv" | "manual";

interface DirectorData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  cf: string;
  piva: string;
  bioIt: string;
  bioEn: string;
}

interface ProducerData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
}

interface ContractData {
  startDate: string;
  endDate: string;
  distributorName: string;
  clientName: string;
}

interface FilmData {
  title: string;
  director: string;
  year: number;
  duration: number;
  genre: string;
  country: string;
  language: string;
  synopsis: string;
}

interface FestivalMasterOption {
  id: string;
  name: string;
}

interface SubmissionEntry {
  id: string;
  festivalName: string;
  matchedFestivalMasterId: string;
  matchConfidence: "high" | "medium" | "low";
  status: string;
  feePaid: number;
  feeCharged: number;
  submittedAt: string;
  platform: string;
  notes: string;
}

interface QueueEntry {
  id: string;
  festivalName: string;
  matchedFestivalMasterId: string;
  matchConfidence: "high" | "medium" | "low";
  position: number;
  priority: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WIZARD_STEPS = ["Metodo", "Dati Film", "Strategia", "Conferma"];

const emptyDirector: DirectorData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  cf: "",
  piva: "",
  bioIt: "",
  bioEn: "",
};

const emptyProducer: ProducerData = {
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
};

const emptyContract: ContractData = {
  startDate: "",
  endDate: "",
  distributorName: "",
  clientName: "",
};

const emptyFilm: FilmData = {
  title: "",
  director: "",
  year: new Date().getFullYear(),
  duration: 0,
  genre: "",
  country: "Italia",
  language: "Italiano",
  synopsis: "",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let entryIdCounter = 0;
function nextEntryId() {
  return `tmp_${++entryIdCounter}`;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function ImportWizardPage() {
  const router = useRouter();
  const { toast } = useToast();

  /* Wizard state */
  const [step, setStep] = useState(1);

  /* Step 1 */
  const [method, setMethod] = useState<ImportMethod | "">("");

  /* Step 2 — files */
  const [filmPdfFile, setFilmPdfFile] = useState<File | null>(null);
  const [strategyPdfFile, setStrategyPdfFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  /* Step 2 — parsed data */
  const [film, setFilm] = useState<FilmData>({ ...emptyFilm });
  const [director, setDirector] = useState<DirectorData>({ ...emptyDirector });
  const [producer, setProducer] = useState<ProducerData>({ ...emptyProducer });
  const [contract, setContract] = useState<ContractData>({ ...emptyContract });
  const [dataParsed, setDataParsed] = useState(false);

  /* Step 3 — strategy */
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [strategyParsed, setStrategyParsed] = useState(false);

  /* Shared */
  const [festivalMasters, setFestivalMasters] = useState<FestivalMasterOption[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Load festival masters for match dropdowns */
  useEffect(() => {
    fetch("/api/festival-masters")
      .then((r) => r.json())
      .then((data) => setFestivalMasters(data.festivals ?? data ?? []))
      .catch(() => {});
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Navigation                                                       */
  /* ---------------------------------------------------------------- */

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return method !== "";
      case 2:
        return film.title.trim() !== "";
      case 3:
        return true; // can always skip strategy
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) {
      switch (step) {
        case 1:
          toast("Seleziona un metodo di importazione", "error");
          break;
        case 2:
          toast("Inserisci almeno il titolo del film", "error");
          break;
      }
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  /* ---------------------------------------------------------------- */
  /*  AI Parse — PDF                                                   */
  /* ---------------------------------------------------------------- */

  const handleParsePdf = async () => {
    if (!filmPdfFile && pdfFiles.length === 0) {
      toast("Seleziona almeno un PDF", "error");
      return;
    }

    setAiLoading(true);
    try {
      const formData = new FormData();
      // Add main film PDF
      if (filmPdfFile) {
        formData.append("film_sheet", filmPdfFile);
      }
      // Add strategy PDF
      if (strategyPdfFile) {
        formData.append("strategy", strategyPdfFile);
      }
      // Add any additional PDF files
      for (const f of pdfFiles) {
        // Auto-detect type by filename
        const name = f.name.toLowerCase();
        if (name.includes("strateg") || name.includes("iscriz") || name.includes("coda") || name.includes("submission")) {
          formData.append("strategy", f);
        } else {
          formData.append("film_sheet", f);
        }
      }

      const res = await fetch("/api/import/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error?.toString() || "Errore nell'analisi del PDF", "error");
        setAiLoading(false);
        return;
      }

      const { results } = await res.json();

      // Process each result
      for (const result of results || []) {
        if (result.data.error) {
          toast(`Errore in ${result.fileName}: ${result.data.error}`, "error");
          continue;
        }

        if (result.type === "film_sheet") {
          const d = result.data;
          setFilm((prev) => ({
            ...prev,
            title: d.titleOriginal || prev.title,
            titleInternational: d.titleInternational || prev.titleInternational,
            titleOtherLanguages: d.titleOtherLanguages || prev.titleOtherLanguages,
            screenwriters: d.screenwriters || prev.screenwriters,
            duration: d.duration || prev.duration,
            genre: d.genre || prev.genre,
            country: d.country || prev.country,
            year: d.year || prev.year,
            productionBudget: d.productionBudget || prev.productionBudget,
            shootingFormat: d.shootingFormat || prev.shootingFormat,
            soundFormat: d.soundFormat || prev.soundFormat,
            aspectRatio: d.aspectRatio || prev.aspectRatio,
            musicRights: d.musicRights || prev.musicRights,
            spokenLanguages: d.spokenLanguages || prev.spokenLanguages,
            subtitleLanguages: d.subtitleLanguages || prev.subtitleLanguages,
            synopsisShortIt: d.synopsisShortIt || prev.synopsisShortIt,
            synopsisShortEn: d.synopsisShortEn || prev.synopsisShortEn,
            synopsisLongIt: d.synopsisLongIt || prev.synopsisLongIt,
            synopsisLongEn: d.synopsisLongEn || prev.synopsisLongEn,
          }));
          if (d.director) {
            setDirector((prev) => ({
              ...prev,
              firstName: d.director.firstName || prev.firstName,
              lastName: d.director.lastName || prev.lastName,
              email: d.director.email || prev.email,
              phone: d.director.phone || prev.phone,
              birthDate: d.director.birthDate || prev.birthDate,
              cf: d.director.codiceFiscale || prev.cf,
              piva: d.director.partitaIva || prev.piva,
              bioIt: d.director.bioIt || prev.bioIt,
              bioEn: d.director.bioEn || prev.bioEn,
            }));
          }
          if (d.producer) {
            setProducer((prev) => ({
              ...prev,
              firstName: d.producer.firstName || prev.firstName,
              lastName: d.producer.lastName || prev.lastName,
              company: d.producer.company || prev.company,
              email: d.producer.email || prev.email,
              phone: d.producer.phone || prev.phone,
            }));
          }
          setDataParsed(true);
        }

        if (result.type === "strategy") {
          // Iscrizioni (submissions già fatte)
          if (result.data.submissions) {
            const subs = result.data.submissions as Array<Record<string, unknown>>;
            setSubmissions((prev) => [
              ...prev,
              ...subs.map((s) => ({
                id: nextEntryId(),
                festivalName: (s.festivalName as string) || "",
                matchedFestivalMasterId: "",
                matchConfidence: "low" as const,
                status: mapStatus(s.status as string),
                feePaid: (s.estimatedFee as number) || 0,
                feeCharged: (s.estimatedFee as number) || 0,
                submittedAt: (s.deadline as string) || "",
                platform: "",
                notes: "",
              })),
            ]);
          }
          // Coda (festival pianificati, non ancora iscritti)
          if (result.data.queue) {
            const q = result.data.queue as Array<Record<string, unknown>>;
            setQueueEntries((prev) => [
              ...prev,
              ...q.map((item, i) => ({
                id: nextEntryId(),
                festivalName: (item.festivalName as string) || "",
                matchedFestivalMasterId: "",
                matchConfidence: "low" as const,
                position: prev.length + i + 1,
                priority: "medium" as const,
              })),
            ]);
          }
          setStrategyParsed(true);
        }
      }

      // Auto-match festivals
      const allFestivalNames = [
        ...submissions.map((s) => s.festivalName),
      ];
      if (allFestivalNames.length > 0) {
        try {
          const matchRes = await fetch("/api/import/match-festivals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ festivals: allFestivalNames.map((n) => ({ name: n })) }),
          });
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            // Update submissions with match results
            setSubmissions((prev) =>
              prev.map((s) => {
                const match = matchData.results?.find(
                  (m: { festivalName: string }) => m.festivalName === s.festivalName
                );
                if (match && match.festivalMasterId) {
                  return {
                    ...s,
                    matchedFestivalMasterId: match.festivalMasterId,
                    matchConfidence: match.confidence === "exact" ? "high" : match.confidence === "fuzzy" ? "medium" : "low",
                  };
                }
                return s;
              })
            );
          }
        } catch { /* ignore match errors */ }
      }

      toast(`${results.length} documento/i analizzato/i con successo`);
    } catch (e) {
      toast("Errore imprevisto nell'analisi del PDF", "error");
    }
    setAiLoading(false);
  };

  function mapStatus(status: string): string {
    if (!status) return "draft";
    const s = status.toLowerCase();
    if (s.includes("not selected") || s.includes("rejected")) return "rejected";
    if (s.includes("selected") || s.includes("accepted")) return "accepted";
    if (s.includes("undecided") || s.includes("pending")) return "submitted";
    return "draft";
  }

  /* ---------------------------------------------------------------- */
  /*  AI Parse — CSV                                                   */
  /* ---------------------------------------------------------------- */

  const handleParseCsv = async () => {
    if (!csvFile) {
      toast("Seleziona un file CSV/Excel", "error");
      return;
    }

    setAiLoading(true);
    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile);

      const res = await fetch("/api/import/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error?.toString() || "Errore nell'analisi del file", "error");
        setAiLoading(false);
        return;
      }

      const data = await res.json();

      if (data.film) setFilm((prev) => ({ ...prev, ...data.film }));
      if (data.director) setDirector((prev) => ({ ...prev, ...data.director }));
      if (data.producer) setProducer((prev) => ({ ...prev, ...data.producer }));
      if (data.contract) setContract((prev) => ({ ...prev, ...data.contract }));

      setDataParsed(true);

      if (data.submissions?.length) {
        setSubmissions(
          data.submissions.map((s: Partial<SubmissionEntry>) => ({
            id: nextEntryId(),
            festivalName: s.festivalName || "",
            matchedFestivalMasterId: s.matchedFestivalMasterId || "",
            matchConfidence: s.matchConfidence || "low",
            status: s.status || "draft",
            feePaid: s.feePaid || 0,
            feeCharged: s.feeCharged || 0,
            submittedAt: s.submittedAt || "",
            platform: s.platform || "",
            notes: s.notes || "",
          }))
        );
        setStrategyParsed(true);
      }

      toast("File analizzato con successo");
    } catch {
      toast("Errore imprevisto nell'analisi del file", "error");
    }
    setAiLoading(false);
  };

  /* ---------------------------------------------------------------- */
  /*  Final Save                                                       */
  /* ---------------------------------------------------------------- */

  const handleImport = async () => {
    setSaving(true);
    try {
      const payload = {
        film,
        director,
        producer,
        contract,
        submissions: submissions.map((s) => ({
          festivalName: s.festivalName,
          festivalMasterId: s.matchedFestivalMasterId || null,
          status: s.status,
          feePaid: s.feePaid,
          feeCharged: s.feeCharged,
          submittedAt: s.submittedAt || null,
          platform: s.platform || null,
          notes: s.notes || null,
        })),
        queue: queueEntries.map((q) => ({
          festivalName: q.festivalName,
          festivalMasterId: q.matchedFestivalMasterId || null,
          position: q.position,
          priority: q.priority,
        })),
      };

      const res = await fetch("/api/import/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error?.toString() || "Errore durante l'importazione", "error");
        setSaving(false);
        return;
      }

      toast("Importazione completata con successo!");
      router.push("/films");
    } catch {
      toast("Errore imprevisto durante l'importazione", "error");
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Update helpers                                                   */
  /* ---------------------------------------------------------------- */

  const updateFilm = (name: string, value: string | number) =>
    setFilm((f) => ({ ...f, [name]: value }));

  const updateDirector = (name: string, value: string | number) =>
    setDirector((d) => ({ ...d, [name]: value }));

  const updateProducer = (name: string, value: string | number) =>
    setProducer((p) => ({ ...p, [name]: value }));

  const updateContract = (name: string, value: string | number) =>
    setContract((c) => ({ ...c, [name]: value }));

  const updateSubmission = (id: string, field: string, value: string | number) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const updateQueueEntry = (id: string, field: string, value: string | number) => {
    setQueueEntries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Computed totals                                                   */
  /* ---------------------------------------------------------------- */

  const totalFeePaid = submissions.reduce((acc, s) => acc + (s.feePaid || 0), 0);
  const totalFeeCharged = submissions.reduce((acc, s) => acc + (s.feeCharged || 0), 0);

  /* ---------------------------------------------------------------- */
  /*  Festival master options for selects                               */
  /* ---------------------------------------------------------------- */

  const festivalMasterOptions = festivalMasters.map((fm) => ({
    value: fm.id,
    label: fm.name,
  }));

  /* ================================================================ */
  /*  STEP 1 — Metodo                                                  */
  /* ================================================================ */

  function renderStep1() {
    const methods: { key: ImportMethod; title: string; desc: string }[] = [
      {
        key: "pdf",
        title: "Upload PDF",
        desc: "Upload scheda film PDF + strategia PDF",
      },
      {
        key: "csv",
        title: "Upload CSV",
        desc: "Upload CSV/Excel file",
      },
      {
        key: "manual",
        title: "Inserimento Manuale",
        desc: "Compila il form manualmente",
      },
    ];

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Scegli il metodo di importazione</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {methods.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                method === m.key
                  ? "border-[var(--primary)] ring-2 ring-[var(--ring)] bg-[var(--card)]"
                  : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50"
              }`}
            >
              <h3 className="font-medium text-sm">{m.title}</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {m.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  STEP 2 — Dati Film                                               */
  /* ================================================================ */

  function renderStep2() {
    return (
      <div className="space-y-6">
        {/* File upload area — PDF method */}
        {method === "pdf" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Upload documenti</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Carica uno o più PDF. Il sistema riconosce automaticamente schede film e documenti strategia dal nome del file.
            </p>

            {/* Multi-file upload — accumulates files */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Aggiungi PDF (Scheda Film, Strategia, Iscrizioni, Coda, Report...)
              </label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  if (newFiles.length === 0) return;
                  setPdfFiles((prev) => {
                    // Avoid duplicates by name
                    const existingNames = new Set(prev.map((f) => f.name));
                    const unique = newFiles.filter((f) => !existingNames.has(f.name));
                    return [...prev, ...unique];
                  });
                  // Reset input so same file can be re-selected if removed
                  e.target.value = "";
                }}
                className="w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] text-sm file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-[var(--secondary)] file:text-sm file:font-medium"
              />
            </div>

            {/* Show uploaded files with remove button */}
            {pdfFiles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-[var(--muted-foreground)]">{pdfFiles.length} file caricati</p>
                {pdfFiles.map((f, i) => {
                  const n = f.name.toLowerCase();
                  const isStrategy = n.includes("strateg") || n.includes("iscriz") || n.includes("coda") || n.includes("submission") || n.includes("report");
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${isStrategy ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                        {isStrategy ? "Strategia" : "Scheda Film"}
                      </span>
                      <span className="flex-1">{f.name}</span>
                      <span className="text-[var(--muted-foreground)]">({(f.size / 1024).toFixed(0)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setPdfFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-[var(--destructive)] hover:opacity-70 text-xs font-medium"
                      >
                        Rimuovi
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Analyze button */}
            {!dataParsed && (
              <div>
                {aiLoading ? (
                  <AiLoading message="Analisi PDF in corso... Questo può richiedere alcuni secondi per file." />
                ) : (
                  <button
                    type="button"
                    onClick={handleParsePdf}
                    disabled={pdfFiles.length === 0 && !filmPdfFile}
                    className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Analizza {pdfFiles.length > 1 ? `${pdfFiles.length} documenti` : "documento"} con AI
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* File upload area — CSV method */}
        {method === "csv" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Upload file</h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                File CSV/Excel <span className="text-[var(--accent)]">*</span>
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCsvFile(file);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-[var(--secondary)] file:text-sm file:font-medium"
              />
              {csvFile && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {csvFile.name} ({(csvFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
            {!dataParsed && (
              <div>
                {aiLoading ? (
                  <AiLoading message="Analisi file in corso..." />
                ) : (
                  <button
                    type="button"
                    onClick={handleParseCsv}
                    disabled={!csvFile}
                    className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Analizza con AI
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual method header */}
        {method === "manual" && (
          <h2 className="text-lg font-semibold">Inserimento manuale dati film</h2>
        )}

        {/* Data form — shown after parse or always for manual */}
        {(dataParsed || method === "manual") && (
          <div className="space-y-6">
            {dataParsed && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
                Dati estratti dal PDF. Verifica e correggi i campi se necessario.
              </div>
            )}

            {/* Film section */}
            <fieldset className="space-y-4 p-4 rounded-lg border border-[var(--border)]">
              <legend className="px-2 text-sm font-semibold">Dati Film</legend>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Titolo" name="title" value={film.title} onChange={updateFilm} required />
                <FormField label="Regista" name="director" value={film.director} onChange={updateFilm} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Anno" name="year" type="number" value={film.year} onChange={updateFilm} />
                <FormField label="Durata (min)" name="duration" type="number" value={film.duration} onChange={updateFilm} />
                <FormField label="Genere" name="genre" value={film.genre} onChange={updateFilm} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Paese" name="country" value={film.country} onChange={updateFilm} />
                <FormField label="Lingua" name="language" value={film.language} onChange={updateFilm} />
              </div>
              <FormField label="Sinossi" name="synopsis" type="textarea" value={film.synopsis} onChange={updateFilm} />
            </fieldset>

            {/* Director section */}
            <fieldset className="space-y-4 p-4 rounded-lg border border-[var(--border)]">
              <legend className="px-2 text-sm font-semibold">Regista</legend>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nome" name="firstName" value={director.firstName} onChange={updateDirector} />
                <FormField label="Cognome" name="lastName" value={director.lastName} onChange={updateDirector} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email" name="email" value={director.email} onChange={updateDirector} />
                <FormField label="Telefono" name="phone" value={director.phone} onChange={updateDirector} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Data di nascita" name="birthDate" type="date" value={director.birthDate} onChange={updateDirector} />
                <FormField label="Codice Fiscale" name="cf" value={director.cf} onChange={updateDirector} />
                <FormField label="P.IVA" name="piva" value={director.piva} onChange={updateDirector} />
              </div>
              <FormField label="Bio (IT)" name="bioIt" type="textarea" value={director.bioIt} onChange={updateDirector} />
              <FormField label="Bio (EN)" name="bioEn" type="textarea" value={director.bioEn} onChange={updateDirector} />
            </fieldset>

            {/* Producer section */}
            <fieldset className="space-y-4 p-4 rounded-lg border border-[var(--border)]">
              <legend className="px-2 text-sm font-semibold">Produttore</legend>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nome" name="firstName" value={producer.firstName} onChange={updateProducer} />
                <FormField label="Cognome" name="lastName" value={producer.lastName} onChange={updateProducer} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Azienda" name="company" value={producer.company} onChange={updateProducer} />
                <FormField label="Email" name="email" value={producer.email} onChange={updateProducer} />
                <FormField label="Telefono" name="phone" value={producer.phone} onChange={updateProducer} />
              </div>
            </fieldset>

            {/* Contract section */}
            <fieldset className="space-y-4 p-4 rounded-lg border border-[var(--border)]">
              <legend className="px-2 text-sm font-semibold">Contratto</legend>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Data inizio" name="startDate" type="date" value={contract.startDate} onChange={updateContract} />
                <FormField label="Data fine" name="endDate" type="date" value={contract.endDate} onChange={updateContract} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Distributore" name="distributorName" value={contract.distributorName} onChange={updateContract} />
                <FormField label="Cliente" name="clientName" value={contract.clientName} onChange={updateContract} />
              </div>
            </fieldset>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /*  STEP 3 — Strategia                                               */
  /* ================================================================ */

  function renderStep3() {
    const hasStrategy = strategyParsed && (submissions.length > 0 || queueEntries.length > 0);

    if (!hasStrategy) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Strategia di distribuzione</h2>
          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] text-center space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Nessuna strategia trovata nel PDF caricato.
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Puoi saltare questo passaggio e aggiungere la strategia in seguito.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Strategia di distribuzione</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Verifica i festival estratti e correggi eventuali corrispondenze errate.
        </p>

        {/* Submissions */}
        {submissions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Iscrizioni ({submissions.length})</h3>
            <div className="space-y-2">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{sub.festivalName}</span>
                      <ConfidenceBadge confidence={sub.matchConfidence} />
                    </div>
                    <StatusBadge value={sub.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                        Festival Master
                      </label>
                      <select
                        value={sub.matchedFestivalMasterId}
                        onChange={(e) =>
                          updateSubmission(sub.id, "matchedFestivalMasterId", e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
                      >
                        <option value="">-- Nessuno --</option>
                        {festivalMasterOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                        Stato
                      </label>
                      <select
                        value={sub.status}
                        onChange={(e) =>
                          updateSubmission(sub.id, "status", e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
                      >
                        <option value="draft">Bozza</option>
                        <option value="submitted">Inviata</option>
                        <option value="accepted">Accettata</option>
                        <option value="rejected">Rifiutata</option>
                        <option value="withdrawn">Ritirata</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                        Fee pagata
                      </label>
                      <input
                        type="number"
                        value={sub.feePaid}
                        onChange={(e) =>
                          updateSubmission(sub.id, "feePaid", Number(e.target.value))
                        }
                        className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                        Fee addebitata
                      </label>
                      <input
                        type="number"
                        value={sub.feeCharged}
                        onChange={(e) =>
                          updateSubmission(sub.id, "feeCharged", Number(e.target.value))
                        }
                        className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue entries */}
        {queueEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Coda ({queueEntries.length})</h3>
            <div className="space-y-2">
              {queueEntries.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      #{q.position}
                    </span>
                    <span className="text-sm font-medium">{q.festivalName}</span>
                    <ConfidenceBadge confidence={q.matchConfidence} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                        Festival Master
                      </label>
                      <select
                        value={q.matchedFestivalMasterId}
                        onChange={(e) =>
                          updateQueueEntry(q.id, "matchedFestivalMasterId", e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
                      >
                        <option value="">-- Nessuno --</option>
                        {festivalMasterOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                        Priorita
                      </label>
                      <select
                        value={q.priority}
                        onChange={(e) =>
                          updateQueueEntry(q.id, "priority", e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
                      >
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Bassa</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /*  STEP 4 — Conferma                                                */
  /* ================================================================ */

  function renderStep4() {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Riepilogo importazione</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Verifica i dati prima di procedere con l&apos;importazione.
        </p>

        {/* Film summary */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-2">
          <h3 className="text-sm font-semibold">Film</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            <SummaryField label="Titolo" value={film.title} />
            <SummaryField label="Regista" value={film.director} />
            <SummaryField label="Anno" value={String(film.year)} />
            <SummaryField label="Durata" value={formatDuration(film.duration)} />
            <SummaryField label="Genere" value={film.genre} />
            <SummaryField label="Paese" value={film.country} />
            <SummaryField label="Lingua" value={film.language} />
          </div>
          {film.synopsis && (
            <p className="text-xs text-[var(--muted-foreground)] mt-2 line-clamp-2">
              {film.synopsis}
            </p>
          )}
        </div>

        {/* Director */}
        {(director.firstName || director.lastName) && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-2">
            <h3 className="text-sm font-semibold">Regista</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              <SummaryField label="Nome" value={`${director.firstName} ${director.lastName}`.trim()} />
              <SummaryField label="Email" value={director.email} />
              <SummaryField label="Telefono" value={director.phone} />
              <SummaryField label="CF" value={director.cf} />
              <SummaryField label="P.IVA" value={director.piva} />
              <SummaryField label="Data nascita" value={director.birthDate} />
            </div>
          </div>
        )}

        {/* Producer */}
        {(producer.firstName || producer.lastName || producer.company) && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-2">
            <h3 className="text-sm font-semibold">Produttore</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              <SummaryField label="Nome" value={`${producer.firstName} ${producer.lastName}`.trim()} />
              <SummaryField label="Azienda" value={producer.company} />
              <SummaryField label="Email" value={producer.email} />
              <SummaryField label="Telefono" value={producer.phone} />
            </div>
          </div>
        )}

        {/* Contract */}
        {(contract.startDate || contract.endDate || contract.distributorName || contract.clientName) && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-2">
            <h3 className="text-sm font-semibold">Contratto</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <SummaryField label="Inizio" value={contract.startDate} />
              <SummaryField label="Fine" value={contract.endDate} />
              <SummaryField label="Distributore" value={contract.distributorName} />
              <SummaryField label="Cliente" value={contract.clientName} />
            </div>
          </div>
        )}

        {/* Submissions */}
        {submissions.length > 0 && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3">
            <h3 className="text-sm font-semibold">
              Iscrizioni ({submissions.length})
            </h3>
            <div className="divide-y divide-[var(--border)]">
              {submissions.map((sub) => {
                const matched = festivalMasters.find(
                  (fm) => fm.id === sub.matchedFestivalMasterId
                );
                return (
                  <div key={sub.id} className="py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{sub.festivalName}</span>
                      {matched && (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          → {matched.name}
                        </span>
                      )}
                      <StatusBadge value={sub.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      {sub.feePaid > 0 && <span>Pagata: {formatCurrency(sub.feePaid)}</span>}
                      {sub.feeCharged > 0 && <span>Addebitata: {formatCurrency(sub.feeCharged)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Queue */}
        {queueEntries.length > 0 && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3">
            <h3 className="text-sm font-semibold">
              Coda ({queueEntries.length})
            </h3>
            <div className="divide-y divide-[var(--border)]">
              {queueEntries.map((q) => {
                const matched = festivalMasters.find(
                  (fm) => fm.id === q.matchedFestivalMasterId
                );
                return (
                  <div key={q.id} className="py-2 flex items-center gap-2 text-sm">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      #{q.position}
                    </span>
                    <span>{q.festivalName}</span>
                    {matched && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        → {matched.name}
                      </span>
                    )}
                    <StatusBadge value={q.priority} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Totals */}
        {(totalFeeCharged > 0 || totalFeePaid > 0) && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Fee stimate (addebitate al cliente):</span>
              <span className="font-semibold">{formatCurrency(totalFeeCharged)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Fee pagate (al festival):</span>
              <span className="font-semibold">{formatCurrency(totalFeePaid)}</span>
            </div>
          </div>
        )}

        {/* Import button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={saving}
            className="w-full px-4 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Importazione in corso..." : "Importa Tutto"}
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Import Wizard" />

      <WizardStepper steps={WIZARD_STEPS} currentStep={step} />

      <div className="mt-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Navigation */}
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
          <div className="flex gap-2">
            {step === 3 && !strategyParsed && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
              >
                Salta
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={aiLoading}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Avanti
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const styles: Record<string, string> = {
    high: "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Bassa",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[confidence]}`}
    >
      {labels[confidence]}
    </span>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[var(--muted-foreground)]">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
    </div>
  );
}
