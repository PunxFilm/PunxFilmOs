"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { CompletenessBar } from "@/components/completeness-bar";
import { computeMasterCompleteness } from "@/lib/completeness";
import { useToast } from "@/components/toast";

const CLASSIFICATION_OPTIONS = [
  { value: "international", label: "Internazionale" },
  { value: "national", label: "Nazionale" },
  { value: "regional", label: "Regionale" },
  { value: "local", label: "Locale" },
];

const TYPE_OPTIONS = [
  { value: "short", label: "Cortometraggio" },
  { value: "mixed", label: "Misto" },
  { value: "documentary", label: "Documentario" },
  { value: "feature", label: "Lungometraggio" },
  { value: "animation", label: "Animazione" },
  { value: "genre", label: "Genere" },
];

const SUBMISSION_PLATFORM_OPTIONS = [
  { value: "filmfreeway", label: "FilmFreeway" },
  { value: "festhome", label: "Festhome" },
  { value: "shortfilmdepot", label: "ShortFilmDepot" },
  { value: "withoutabox", label: "Withoutabox" },
  { value: "clickforfestivals", label: "Click for Festivals" },
  { value: "custom", label: "Piattaforma propria" },
  { value: "email", label: "Email" },
  { value: "other", label: "Altro" },
];

const SCREENING_TYPE_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In presenza" },
  { value: "hybrid", label: "Ibrido" },
];

const WAIVER_TYPE_OPTIONS = [
  { value: "none", label: "Nessuno" },
  { value: "code", label: "Codice" },
  { value: "agreement", label: "Accordo" },
  { value: "request_pending", label: "Richiesta in corso" },
];

const VERIFICATION_STATUS_OPTIONS = [
  { value: "unverified", label: "Non verificato" },
  { value: "verified", label: "Verificato" },
  { value: "needs_review", label: "Da rivedere" },
];

export default function FestivalMasterEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const festivalId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // Identita
    name: "",
    country: "",
    city: "",
    region: "",
    canonicalName: "",
    foundedYear: 0,
    // Classificazione
    classification: "",
    type: "",
    focus: "",
    // Web & Piattaforma
    website: "",
    instagram: "",
    submissionPlatform: "",
    submissionUrlBase: "",
    regulationsUrl: "",
    openingDate: "",
    // Requisiti Film
    maxMinutes: 0,
    maxYearsProduction: 0,
    acceptedGenres: "",
    acceptedThemes: "",
    acceptsFirstWork: false,
    directorRequirements: "",
    // Qualificazioni
    academyQualifying: false,
    baftaQualifying: false,
    canadianScreenQualifying: false,
    goyaQualifying: false,
    efaQualifying: false,
    shortFilmConferenceMember: false,
    qualifying: "",
    // Proiezione
    screeningType: "",
    screeningLocation: "",
    screeningQuality: "",
    dcp: false,
    // Supporto & Industry
    industry: false,
    travelSupport: "",
    hospitalitySupport: "",
    // Contatti
    contactName: "",
    contactRole: "",
    contactTelephone: "",
    contactEmailDirector: "",
    contactEmailInfo: "",
    contactEmailTechnical: "",
    // Note
    internalNotes: "",
    punxHistory: "",
    // Waiver
    waiverType: "none",
    waiverDetails: "",
    // Verifica
    verificationStatus: "unverified",
    dataConfidenceScore: 0,
    verificationNotes: "",
    lastVerifiedAt: "",
  });

  useEffect(() => {
    fetch(`/api/festival-masters/${festivalId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore nel caricamento");
        return res.json();
      })
      .then((data) => {
        setForm({
          name: data.name || "",
          country: data.country || "",
          city: data.city || "",
          region: data.region || "",
          canonicalName: data.canonicalName || "",
          foundedYear: data.foundedYear || 0,
          classification: data.classification || "",
          type: data.type || "",
          focus: data.focus || "",
          website: data.website || "",
          instagram: data.instagram || "",
          submissionPlatform: data.submissionPlatform || "",
          submissionUrlBase: data.submissionUrlBase || "",
          regulationsUrl: data.regulationsUrl || "",
          openingDate: data.openingDate ? data.openingDate.split("T")[0] : "",
          maxMinutes: data.maxMinutes || 0,
          maxYearsProduction: data.maxYearsProduction || 0,
          acceptedGenres: data.acceptedGenres || "",
          acceptedThemes: data.acceptedThemes || "",
          acceptsFirstWork: data.acceptsFirstWork || false,
          directorRequirements: data.directorRequirements || "",
          academyQualifying: data.academyQualifying || false,
          baftaQualifying: data.baftaQualifying || false,
          canadianScreenQualifying: data.canadianScreenQualifying || false,
          goyaQualifying: data.goyaQualifying || false,
          efaQualifying: data.efaQualifying || false,
          shortFilmConferenceMember: data.shortFilmConferenceMember || false,
          qualifying: data.qualifying || "",
          screeningType: data.screeningType || "",
          screeningLocation: data.screeningLocation || "",
          screeningQuality: data.screeningQuality || "",
          dcp: data.dcp || false,
          industry: data.industry || false,
          travelSupport: data.travelSupport || "",
          hospitalitySupport: data.hospitalitySupport || "",
          contactName: data.contactName || "",
          contactRole: data.contactRole || "",
          contactTelephone: data.contactTelephone || "",
          contactEmailDirector: data.contactEmailDirector || "",
          contactEmailInfo: data.contactEmailInfo || "",
          contactEmailTechnical: data.contactEmailTechnical || "",
          internalNotes: data.internalNotes || "",
          punxHistory: data.punxHistory || "",
          waiverType: data.waiverType || "none",
          waiverDetails: data.waiverDetails || "",
          verificationStatus: data.verificationStatus || "unverified",
          dataConfidenceScore: data.dataConfidenceScore || 0,
          verificationNotes: data.verificationNotes || "",
          lastVerifiedAt: data.lastVerifiedAt || "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [festivalId]);

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const completeness = useMemo(() => computeMasterCompleteness(form as unknown as Record<string, unknown>), [form]);

  const allMissingFields = useMemo(
    () => completeness.groups.flatMap((g) => g.missingFields),
    [completeness]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.country || !form.city) {
      setError("Nome, Paese e Citta sono obbligatori");
      return;
    }
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name,
      country: form.country,
      city: form.city,
      region: form.region || undefined,
      canonicalName: form.canonicalName || undefined,
      foundedYear: form.foundedYear || undefined,
      classification: form.classification || undefined,
      type: form.type || undefined,
      focus: form.focus || undefined,
      website: form.website || undefined,
      instagram: form.instagram || undefined,
      submissionPlatform: form.submissionPlatform || undefined,
      submissionUrlBase: form.submissionUrlBase || undefined,
      regulationsUrl: form.regulationsUrl || undefined,
      openingDate: form.openingDate || undefined,
      maxMinutes: form.maxMinutes || undefined,
      maxYearsProduction: form.maxYearsProduction || undefined,
      acceptedGenres: form.acceptedGenres || undefined,
      acceptedThemes: form.acceptedThemes || undefined,
      acceptsFirstWork: form.acceptsFirstWork,
      directorRequirements: form.directorRequirements || undefined,
      academyQualifying: form.academyQualifying,
      baftaQualifying: form.baftaQualifying,
      canadianScreenQualifying: form.canadianScreenQualifying,
      goyaQualifying: form.goyaQualifying,
      efaQualifying: form.efaQualifying,
      shortFilmConferenceMember: form.shortFilmConferenceMember,
      qualifying: form.qualifying || undefined,
      screeningType: form.screeningType || undefined,
      screeningLocation: form.screeningLocation || undefined,
      screeningQuality: form.screeningQuality || undefined,
      dcp: form.dcp,
      industry: form.industry,
      travelSupport: form.travelSupport || undefined,
      hospitalitySupport: form.hospitalitySupport || undefined,
      contactName: form.contactName || undefined,
      contactRole: form.contactRole || undefined,
      contactTelephone: form.contactTelephone || undefined,
      contactEmailDirector: form.contactEmailDirector || undefined,
      contactEmailInfo: form.contactEmailInfo || undefined,
      contactEmailTechnical: form.contactEmailTechnical || undefined,
      internalNotes: form.internalNotes || undefined,
      punxHistory: form.punxHistory || undefined,
      waiverType: form.waiverType,
      waiverDetails: form.waiverDetails || undefined,
      verificationStatus: form.verificationStatus,
      dataConfidenceScore: form.dataConfidenceScore || undefined,
      verificationNotes: form.verificationNotes || undefined,
    };

    try {
      const res = await fetch(`/api/festival-masters/${festivalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast("Festival salvato con successo");
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

  const handleMarkVerified = async () => {
    setForm((f) => ({ ...f, verificationStatus: "verified" }));
    setSaving(true);
    try {
      const res = await fetch(`/api/festival-masters/${festivalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: "verified" }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({
          ...f,
          verificationStatus: "verified",
          lastVerifiedAt: data.lastVerifiedAt || new Date().toISOString(),
        }));
        toast("Festival segnato come verificato");
      } else {
        toast("Errore nel salvataggio della verifica", "error");
      }
    } catch {
      toast("Errore di rete", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Modifica Festival" subtitle="Caricamento..." />
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div className="space-y-6">
        <PageHeader title="Modifica Festival" />
        <div className="p-6 border border-[var(--border)] rounded-lg bg-[var(--card)]">
          <p className="text-[var(--destructive)]">{error}</p>
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

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Modifica: ${form.name}`}
        subtitle={`${form.city}, ${form.country}`}
      />

      {/* Completeness Bar */}
      <CompletenessBar
        score={completeness.score}
        missingFields={allMissingFields}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 1. Identita */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Identita</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome" name="name" value={form.name} onChange={update} required />
            <FormField label="Nome canonico" name="canonicalName" value={form.canonicalName} onChange={update} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Paese" name="country" value={form.country} onChange={update} required />
            <FormField label="Citta" name="city" value={form.city} onChange={update} required />
            <FormField label="Regione" name="region" value={form.region} onChange={update} />
          </div>
          <FormField label="Anno fondazione" name="foundedYear" type="number" value={form.foundedYear} onChange={update} />
        </div>

        {/* 2. Classificazione */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Classificazione</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Classificazione" name="classification" type="select" value={form.classification} onChange={update} options={CLASSIFICATION_OPTIONS} />
            <FormField label="Tipo" name="type" type="select" value={form.type} onChange={update} options={TYPE_OPTIONS} />
            <FormField label="Focus" name="focus" value={form.focus} onChange={update} />
          </div>
        </div>

        {/* 3. Web & Piattaforma */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Web & Piattaforma</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Website" name="website" value={form.website} onChange={update} />
            <FormField label="Instagram" name="instagram" value={form.instagram} onChange={update} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Piattaforma submission" name="submissionPlatform" type="select" value={form.submissionPlatform} onChange={update} options={SUBMISSION_PLATFORM_OPTIONS} />
            <FormField label="URL submission" name="submissionUrlBase" value={form.submissionUrlBase} onChange={update} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="URL regolamento" name="regulationsUrl" value={form.regulationsUrl} onChange={update} />
            <FormField label="Data apertura" name="openingDate" type="date" value={form.openingDate} onChange={update} />
          </div>
        </div>

        {/* 4. Requisiti Film */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Requisiti Film</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Durata massima (min)" name="maxMinutes" type="number" value={form.maxMinutes} onChange={update} />
            <FormField label="Max anni produzione" name="maxYearsProduction" type="number" value={form.maxYearsProduction} onChange={update} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Generi accettati" name="acceptedGenres" value={form.acceptedGenres} onChange={update} />
            <FormField label="Temi accettati" name="acceptedThemes" value={form.acceptedThemes} onChange={update} />
          </div>
          <FormField
            type="checkbox"
            label="Accetta opere prime"
            name="acceptsFirstWork"
            value={form.acceptsFirstWork ? 1 : 0}
            onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))}
          />
          <FormField label="Requisiti regista" name="directorRequirements" type="textarea" value={form.directorRequirements} onChange={update} rows={3} />
        </div>

        {/* 5. Qualificazioni */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Qualificazioni</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField type="checkbox" label="Academy Qualifying" name="academyQualifying" value={form.academyQualifying ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
            <FormField type="checkbox" label="BAFTA Qualifying" name="baftaQualifying" value={form.baftaQualifying ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
            <FormField type="checkbox" label="Canadian Screen Qualifying" name="canadianScreenQualifying" value={form.canadianScreenQualifying ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
            <FormField type="checkbox" label="Goya Qualifying" name="goyaQualifying" value={form.goyaQualifying ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
            <FormField type="checkbox" label="EFA Qualifying" name="efaQualifying" value={form.efaQualifying ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
            <FormField type="checkbox" label="Short Film Conference Member" name="shortFilmConferenceMember" value={form.shortFilmConferenceMember ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
          </div>
          <FormField label="Qualificazioni (testo)" name="qualifying" value={form.qualifying} onChange={update} />
        </div>

        {/* 6. Proiezione */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Proiezione</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo proiezione" name="screeningType" type="select" value={form.screeningType} onChange={update} options={SCREENING_TYPE_OPTIONS} />
            <FormField label="Luogo proiezione" name="screeningLocation" value={form.screeningLocation} onChange={update} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Qualita proiezione" name="screeningQuality" value={form.screeningQuality} onChange={update} />
            <FormField type="checkbox" label="DCP" name="dcp" value={form.dcp ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
          </div>
        </div>

        {/* 7. Supporto & Industry */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Supporto & Industry</h3>
          <FormField type="checkbox" label="Industry" name="industry" value={form.industry ? 1 : 0} onChange={(n, v) => setForm((f) => ({ ...f, [n]: v === 1 }))} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Supporto viaggio" name="travelSupport" value={form.travelSupport} onChange={update} />
            <FormField label="Supporto ospitalita" name="hospitalitySupport" value={form.hospitalitySupport} onChange={update} />
          </div>
        </div>

        {/* 8. Contatti */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Contatti</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome contatto" name="contactName" value={form.contactName} onChange={update} />
            <FormField label="Ruolo" name="contactRole" value={form.contactRole} onChange={update} />
          </div>
          <FormField label="Telefono" name="contactTelephone" value={form.contactTelephone} onChange={update} />
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Email direttore" name="contactEmailDirector" value={form.contactEmailDirector} onChange={update} />
            <FormField label="Email info" name="contactEmailInfo" value={form.contactEmailInfo} onChange={update} />
            <FormField label="Email tecnica" name="contactEmailTechnical" value={form.contactEmailTechnical} onChange={update} />
          </div>
        </div>

        {/* 9. Note */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Note</h3>
          <FormField label="Note interne" name="internalNotes" type="textarea" value={form.internalNotes} onChange={update} rows={4} />
          <FormField label="Storico PunxFilm" name="punxHistory" type="textarea" value={form.punxHistory} onChange={update} rows={4} />
        </div>

        {/* 10. Waiver */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Waiver</h3>
          <FormField label="Tipo waiver" name="waiverType" type="select" value={form.waiverType} onChange={update} options={WAIVER_TYPE_OPTIONS} />
          <FormField label="Dettagli waiver" name="waiverDetails" type="textarea" value={form.waiverDetails} onChange={update} rows={3} />
        </div>

        {/* 11. Verifica */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-4">
          <h3 className="font-semibold">Verifica</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stato verifica" name="verificationStatus" type="select" value={form.verificationStatus} onChange={update} options={VERIFICATION_STATUS_OPTIONS} />
            <FormField label="Confidenza dati (0-100)" name="dataConfidenceScore" type="number" value={form.dataConfidenceScore} onChange={update} />
          </div>
          <FormField label="Note verifica" name="verificationNotes" type="textarea" value={form.verificationNotes} onChange={update} rows={3} />
          {form.lastVerifiedAt && (
            <p className="text-sm text-[var(--muted-foreground)]">
              Ultima verifica: {new Date(form.lastVerifiedAt).toLocaleString("it-IT")}
            </p>
          )}
          <button
            type="button"
            onClick={handleMarkVerified}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Segna come verificato adesso
          </button>
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
