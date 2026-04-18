"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { TASK_STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";

export default function NewTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [films, setFilms] = useState<{ id: string; titleOriginal: string }[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", status: "todo", priority: "medium", dueDate: "", filmId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/films").then((r) => r.json()).then(setFilms);
  }, []);

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      ...form,
      dueDate: form.dueDate || undefined,
      filmId: form.filmId || undefined,
    };
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast("Task salvato con successo");
      router.push("/tasks");
    } else {
      const data = await res.json();
      setError(data.error?.toString() || "Errore nel salvataggio");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Nuovo Task" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <FormField label="Titolo" name="title" value={form.title} onChange={update} required />
        <FormField label="Descrizione" name="description" type="textarea" value={form.description} onChange={update} />
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Stato" name="status" type="select" value={form.status} onChange={update}
            options={TASK_STATUS_OPTIONS} />
          <FormField label="Priorità" name="priority" type="select" value={form.priority} onChange={update}
            options={PRIORITY_OPTIONS} />
          <FormField label="Scadenza" name="dueDate" type="date" value={form.dueDate} onChange={update} />
        </div>
        <FormField label="Film (opzionale)" name="filmId" type="select" value={form.filmId} onChange={update}
          options={films.map((f) => ({ value: f.id, label: f.titleOriginal }))} />
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvataggio..." : "Salva Task"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm">Annulla</button>
        </div>
      </form>
    </div>
  );
}
