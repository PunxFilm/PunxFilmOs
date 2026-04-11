"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { FILM_STATUS_OPTIONS } from "@/lib/constants";

export default function EditFilmPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "", director: "", year: 2024, duration: 0, genre: "", country: "", language: "", synopsis: "", status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/films/${params.id}`).then((r) => r.json()).then((data) => {
      setForm({
        title: data.title, director: data.director, year: data.year, duration: data.duration,
        genre: data.genre, country: data.country, language: data.language, synopsis: data.synopsis || "", status: data.status,
      });
      setLoading(false);
    });
  }, [params.id]);

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/films/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Film salvato con successo");
      router.push("/films");
    } else {
      const data = await res.json();
      setError(data.error || "Errore durante il salvataggio");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Eliminare questo film? Verranno eliminate anche tutte le iscrizioni collegate.")) return;
    const res = await fetch(`/api/films/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Film eliminato");
      router.push("/films");
    } else {
      const data = await res.json();
      setError(data.error || "Errore durante l'eliminazione");
    }
  };

  if (loading) return <p className="text-[var(--muted-foreground)]">Caricamento...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Modifica Film" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Titolo" name="title" value={form.title} onChange={update} required />
          <FormField label="Regista" name="director" value={form.director} onChange={update} required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Anno" name="year" type="number" value={form.year} onChange={update} required />
          <FormField label="Durata (min)" name="duration" type="number" value={form.duration} onChange={update} required />
          <FormField label="Genere" name="genre" value={form.genre} onChange={update} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Paese" name="country" value={form.country} onChange={update} required />
          <FormField label="Lingua" name="language" value={form.language} onChange={update} />
        </div>
        <FormField label="Stato" name="status" type="select" value={form.status} onChange={update}
          options={FILM_STATUS_OPTIONS} />
        <FormField label="Sinossi" name="synopsis" type="textarea" value={form.synopsis} onChange={update} />
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm">
            Annulla
          </button>
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-sm ml-auto">
            Elimina
          </button>
        </div>
      </form>
    </div>
  );
}
