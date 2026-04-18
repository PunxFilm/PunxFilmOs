"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";

const CLASSIFICATION_OPTIONS = [
  { value: "", label: "—" },
  { value: "A-list", label: "A-list" },
  { value: "B-list", label: "B-list" },
  { value: "C-list", label: "C-list" },
  { value: "qualifying", label: "Qualifying" },
  { value: "regional", label: "Regional" },
  { value: "niche", label: "Niche" },
];

const TYPE_OPTIONS = [
  { value: "", label: "—" },
  { value: "short", label: "Cortometraggi" },
  { value: "feature", label: "Lungometraggi" },
  { value: "mixed", label: "Mixed" },
  { value: "documentary", label: "Documentari" },
  { value: "animation", label: "Animazione" },
  { value: "genre", label: "Genre (horror/fantasy)" },
];

export default function NewFestivalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    country: "Italia",
    city: "",
    region: "",
    classification: "",
    type: "",
    website: "",
    maxMinutes: 0,
    acceptedGenres: "",
    contactEmailInfo: "",
    submissionPlatform: "",
    internalNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = {
      name: form.name,
      country: form.country,
      city: form.city,
    };
    if (form.region) payload.region = form.region;
    if (form.classification) payload.classification = form.classification;
    if (form.type) payload.type = form.type;
    if (form.website) payload.website = form.website;
    if (form.maxMinutes) payload.maxMinutes = Number(form.maxMinutes);
    if (form.acceptedGenres) payload.acceptedGenres = form.acceptedGenres;
    if (form.contactEmailInfo) payload.contactEmailInfo = form.contactEmailInfo;
    if (form.submissionPlatform) payload.submissionPlatform = form.submissionPlatform;
    if (form.internalNotes) payload.internalNotes = form.internalNotes;

    const res = await fetch("/api/festival-masters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = await res.json();
      toast("Festival salvato. Ora aggiungi l'edizione dalla pagina di dettaglio.");
      router.push(`/festivals/${created.id}`);
    } else {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error) || "Errore nel salvataggio"
      );
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Nuovo Festival"
        subtitle="Crea il record master del festival. Le edizioni annuali (date, deadline, fee) si aggiungono poi dal dettaglio."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <FormField label="Nome" name="name" value={form.name} onChange={update} required />
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Città" name="city" value={form.city} onChange={update} required />
          <FormField label="Paese" name="country" value={form.country} onChange={update} required />
          <FormField label="Regione" name="region" value={form.region} onChange={update} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Classificazione"
            name="classification"
            type="select"
            value={form.classification}
            onChange={update}
            options={CLASSIFICATION_OPTIONS}
          />
          <FormField
            label="Tipo"
            name="type"
            type="select"
            value={form.type}
            onChange={update}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Website" name="website" value={form.website} onChange={update} />
          <FormField
            label="Durata max (min)"
            name="maxMinutes"
            type="number"
            value={form.maxMinutes}
            onChange={update}
          />
        </div>
        <FormField
          label="Generi accettati"
          name="acceptedGenres"
          value={form.acceptedGenres}
          onChange={update}
          placeholder="es. drama, comedy, experimental"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Email contatto"
            name="contactEmailInfo"
            value={form.contactEmailInfo}
            onChange={update}
          />
          <FormField
            label="Piattaforma submission"
            name="submissionPlatform"
            value={form.submissionPlatform}
            onChange={update}
            placeholder="FilmFreeway, ShortFilmDepot, direct"
          />
        </div>
        <FormField
          label="Note interne"
          name="internalNotes"
          type="textarea"
          value={form.internalNotes}
          onChange={update}
        />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva Festival"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
