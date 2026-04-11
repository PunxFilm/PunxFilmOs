"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { FINANCE_TYPE_OPTIONS, FINANCE_CATEGORY_OPTIONS } from "@/lib/constants";

export default function EditFinancePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [form, setForm] = useState({
    type: "expense", category: "submission_fee", amount: 0,
    description: "", date: "", filmTitle: "", festivalName: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/finance/${params.id}`).then((r) => r.json()).then((data) => {
      setForm({
        type: data.type, category: data.category, amount: data.amount,
        description: data.description || "", date: data.date.split("T")[0],
        filmTitle: data.filmTitle || "", festivalName: data.festivalName || "",
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
    const payload = { ...form, filmTitle: form.filmTitle || undefined, festivalName: form.festivalName || undefined };
    const res = await fetch(`/api/finance/${params.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast("Movimento salvato con successo");
      router.push("/finance");
    } else {
      const data = await res.json();
      setError(data.error?.toString() || "Errore nel salvataggio");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Eliminare questo movimento?")) return;
    await fetch(`/api/finance/${params.id}`, { method: "DELETE" });
    toast("Movimento eliminato");
    router.push("/finance");
  };

  if (loading) return <p className="text-[var(--muted-foreground)]">Caricamento...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Modifica Movimento" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Tipo" name="type" type="select" value={form.type} onChange={update} required
            options={FINANCE_TYPE_OPTIONS} />
          <FormField label="Categoria" name="category" type="select" value={form.category} onChange={update} required
            options={FINANCE_CATEGORY_OPTIONS} />
          <FormField label="Data" name="date" type="date" value={form.date} onChange={update} required />
        </div>
        <FormField label="Importo (€)" name="amount" type="number" value={form.amount} onChange={update} required />
        <FormField label="Descrizione" name="description" type="textarea" value={form.description} onChange={update} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Film" name="filmTitle" value={form.filmTitle} onChange={update} />
          <FormField label="Festival" name="festivalName" value={form.festivalName} onChange={update} />
        </div>
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
