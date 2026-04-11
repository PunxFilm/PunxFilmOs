"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { FESTIVAL_CATEGORY_OPTIONS, FESTIVAL_SPECIALIZATION_OPTIONS, PREMIERE_REQUIREMENT_OPTIONS } from "@/lib/constants";

export default function NewFestivalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", country: "Italia", city: "", category: "B-list",
    deadlineGeneral: "", deadlineEarly: "", feesAmount: 0, website: "", notes: "",
    specialization: "", acceptedFormats: "", durationMin: 0, durationMax: 0,
    themes: "", premiereRequirement: "", festivalStartDate: "", festivalEndDate: "",
    selectionHistory: "", acceptedLanguages: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      feesAmount: form.feesAmount || undefined,
      deadlineGeneral: form.deadlineGeneral || undefined,
      deadlineEarly: form.deadlineEarly || undefined,
      specialization: form.specialization || undefined,
      acceptedFormats: form.acceptedFormats || undefined,
      durationMin: form.durationMin || undefined,
      durationMax: form.durationMax || undefined,
      themes: form.themes || undefined,
      premiereRequirement: form.premiereRequirement || undefined,
      festivalStartDate: form.festivalStartDate || undefined,
      festivalEndDate: form.festivalEndDate || undefined,
      selectionHistory: form.selectionHistory || undefined,
      acceptedLanguages: form.acceptedLanguages || undefined,
    };
    const res = await fetch("/api/festivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast("Festival salvato con successo");
      router.push("/festivals");
    } else {
      const data = await res.json();
      setError(data.error?.toString() || "Errore nel salvataggio");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Nuovo Festival" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <FormField label="Nome" name="name" value={form.name} onChange={update} required />
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Città" name="city" value={form.city} onChange={update} required />
          <FormField label="Paese" name="country" value={form.country} onChange={update} required />
          <FormField label="Categoria" name="category" type="select" value={form.category} onChange={update}
            options={FESTIVAL_CATEGORY_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Deadline Generale" name="deadlineGeneral" type="date" value={form.deadlineGeneral} onChange={update} />
          <FormField label="Deadline Early Bird" name="deadlineEarly" type="date" value={form.deadlineEarly} onChange={update} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fee (€)" name="feesAmount" type="number" value={form.feesAmount} onChange={update} />
          <FormField label="Website" name="website" value={form.website} onChange={update} />
        </div>
        <FormField label="Note" name="notes" type="textarea" value={form.notes} onChange={update} />
        <div className="pt-4 border-t border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--muted-foreground)] mb-3">Informazioni per AI Matching</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Specializzazione" name="specialization" type="select" value={form.specialization} onChange={update}
                options={FESTIVAL_SPECIALIZATION_OPTIONS} />
              <FormField label="Premiere Requirement" name="premiereRequirement" type="select" value={form.premiereRequirement} onChange={update}
                options={PREMIERE_REQUIREMENT_OPTIONS} />
            </div>
            <FormField label="Formati accettati" name="acceptedFormats" value={form.acceptedFormats} onChange={update} placeholder="es. short,feature,documentary" />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Durata min (min)" name="durationMin" type="number" value={form.durationMin} onChange={update} />
              <FormField label="Durata max (min)" name="durationMax" type="number" value={form.durationMax} onChange={update} />
            </div>
            <FormField label="Temi" name="themes" value={form.themes} onChange={update} placeholder="es. sociale,ambiente,LGBTQ+" />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Data inizio festival" name="festivalStartDate" type="date" value={form.festivalStartDate} onChange={update} />
              <FormField label="Data fine festival" name="festivalEndDate" type="date" value={form.festivalEndDate} onChange={update} />
            </div>
            <FormField label="Storico selezioni" name="selectionHistory" type="textarea" value={form.selectionHistory} onChange={update} placeholder="Storico selezioni, preferenze del festival..." />
            <FormField label="Lingue accettate" name="acceptedLanguages" value={form.acceptedLanguages} onChange={update} placeholder="any oppure Italian,English" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvataggio..." : "Salva Festival"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm">Annulla</button>
        </div>
      </form>
    </div>
  );
}
