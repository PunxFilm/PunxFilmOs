"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { SUBMISSION_STATUS_OPTIONS, PLATFORM_OPTIONS } from "@/lib/constants";

type Film = { id: string; titleOriginal: string };
type FestivalOption = {
  id: string; // editionId
  label: string; // festival name + year
};

export default function NewSubmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [films, setFilms] = useState<Film[]>([]);
  const [festivals, setFestivals] = useState<FestivalOption[]>([]);
  const [form, setForm] = useState({
    filmId: "",
    festivalEditionId: "",
    status: "draft",
    platform: "",
    submittedAt: "",
    feesPaid: 0,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/films")
      .then((r) => r.json())
      .then(setFilms);
    fetch("/api/festival-masters?limit=500")
      .then((r) => r.json())
      .then((data) => {
        const list: FestivalOption[] = (data.festivals || [])
          .map((m: { id: string; name: string; editions?: { id: string; year: number }[] }) => {
            const latestEdition = m.editions?.[0];
            if (!latestEdition) return null;
            return {
              id: latestEdition.id,
              label: `${m.name} — ${latestEdition.year}`,
            };
          })
          .filter(Boolean) as FestivalOption[];
        setFestivals(list);
      });
  }, []);

  const update = (name: string, value: string | number) =>
    setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload: Record<string, unknown> = {
      filmId: form.filmId,
      festivalEditionId: form.festivalEditionId,
      status: form.status,
      notes: form.notes || undefined,
    };
    if (form.platform) payload.platform = form.platform;
    if (form.submittedAt) payload.submittedAt = form.submittedAt;
    if (form.feesPaid) payload.feesPaid = Number(form.feesPaid);

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast("Iscrizione salvata con successo");
      router.push("/submissions");
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
      <PageHeader title="Nuova Iscrizione" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Film"
            name="filmId"
            type="select"
            value={form.filmId}
            onChange={update}
            required
            options={films.map((f) => ({ value: f.id, label: f.titleOriginal }))}
          />
          <FormField
            label="Festival (edizione)"
            name="festivalEditionId"
            type="select"
            value={form.festivalEditionId}
            onChange={update}
            required
            options={festivals.map((f) => ({ value: f.id, label: f.label }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label="Stato"
            name="status"
            type="select"
            value={form.status}
            onChange={update}
            options={SUBMISSION_STATUS_OPTIONS}
          />
          <FormField
            label="Piattaforma"
            name="platform"
            type="select"
            value={form.platform}
            onChange={update}
            options={PLATFORM_OPTIONS}
          />
          <FormField
            label="Data Invio"
            name="submittedAt"
            type="date"
            value={form.submittedAt}
            onChange={update}
          />
        </div>
        <FormField
          label="Fee Pagata (EUR)"
          name="feesPaid"
          type="number"
          value={form.feesPaid}
          onChange={update}
        />
        <FormField label="Note" name="notes" type="textarea" value={form.notes} onChange={update} />
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva Iscrizione"}
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
