"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { SUBMISSION_STATUS_OPTIONS, PLATFORM_OPTIONS, SUBMISSION_RESULT_OPTIONS } from "@/lib/constants";

export default function EditSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [films, setFilms] = useState<{ id: string; title: string }[]>([]);
  const [festivals, setFestivals] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    filmId: "", festivalId: "", status: "draft", platform: "", submittedAt: "", feesPaid: 0, result: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/films").then((r) => r.json()),
      fetch("/api/festivals").then((r) => r.json()),
      fetch(`/api/submissions/${params.id}`).then((r) => r.json()),
    ]).then(([f, fe, data]) => {
      setFilms(f);
      setFestivals(fe);
      setForm({
        filmId: data.filmId, festivalId: data.festivalId, status: data.status,
        platform: data.platform || "", submittedAt: data.submittedAt ? data.submittedAt.split("T")[0] : "",
        feesPaid: data.feesPaid || 0, result: data.result || "", notes: data.notes || "",
      });
      setLoading(false);
    });
  }, [params.id]);

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
      result: form.result || undefined,
    };
    const res = await fetch(`/api/submissions/${params.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
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

  const handleDelete = async () => {
    if (!confirm("Eliminare questa iscrizione?")) return;
    await fetch(`/api/submissions/${params.id}`, { method: "DELETE" });
    toast("Iscrizione eliminata");
    router.push("/submissions");
  };

  if (loading) return <p className="text-[var(--muted-foreground)]">Caricamento...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Modifica Iscrizione" />
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
          <FormField label="Risultato" name="result" type="select" value={form.result} onChange={update}
            options={SUBMISSION_RESULT_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data Invio" name="submittedAt" type="date" value={form.submittedAt} onChange={update} />
          <FormField label="Fee Pagata (EUR)" name="feesPaid" type="number" value={form.feesPaid} onChange={update} />
        </div>
        <FormField label="Note" name="notes" type="textarea" value={form.notes} onChange={update} />
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm">Annulla</button>
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-sm ml-auto">Elimina</button>
        </div>
      </form>
    </div>
  );
}
