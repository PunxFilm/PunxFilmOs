"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { SUBMISSION_STATUS_OPTIONS, PLATFORM_OPTIONS } from "@/lib/constants";

export default function NewSubmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [films, setFilms] = useState<{ id: string; title: string }[]>([]);
  const [festivals, setFestivals] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    filmId: "", festivalId: "", status: "draft", platform: "", submittedAt: "", feesPaid: 0, notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/films").then((r) => r.json()).then(setFilms);
    fetch("/api/festivals").then((r) => r.json()).then(setFestivals);
  }, []);

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      ...form,
      feesPaid: form.feesPaid || undefined,
      submittedAt: form.submittedAt || undefined,
      platform: form.platform || undefined,
    };
    const res = await fetch("/api/submissions", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast("Iscrizione salvata con successo");
      router.push("/submissions");
    } else {
      const data = await res.json();
      setError(data.error?.toString() || "Errore nel salvataggio");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Nuova Iscrizione" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Film" name="filmId" type="select" value={form.filmId} onChange={update} required
            options={films.map((f) => ({ value: f.id, label: f.title }))} />
          <FormField label="Festival" name="festivalId" type="select" value={form.festivalId} onChange={update} required
            options={festivals.map((f) => ({ value: f.id, label: f.name }))} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Stato" name="status" type="select" value={form.status} onChange={update}
            options={SUBMISSION_STATUS_OPTIONS} />
          <FormField label="Piattaforma" name="platform" type="select" value={form.platform} onChange={update}
            options={PLATFORM_OPTIONS} />
          <FormField label="Data Invio" name="submittedAt" type="date" value={form.submittedAt} onChange={update} />
        </div>
        <FormField label="Fee Pagata (EUR)" name="feesPaid" type="number" value={form.feesPaid} onChange={update} />
        <FormField label="Note" name="notes" type="textarea" value={form.notes} onChange={update} />
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvataggio..." : "Salva Iscrizione"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm">Annulla</button>
        </div>
      </form>
    </div>
  );
}
