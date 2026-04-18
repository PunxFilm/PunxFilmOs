"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { useToast } from "@/components/toast";
import { StatusBadge } from "@/components/status-badge";
import { AIFestivalsPanel } from "@/components/ai-festivals-panel";
import { FILM_STATUS_OPTIONS } from "@/lib/constants";

interface Material {
  id: string;
  type: string;
  status: string;
  url: string | null;
  isRequired: boolean;
}

interface Plan {
  id: string;
  premiereLevel: string;
  status: string;
  entries: { id: string; role: string }[];
}

interface Submission {
  id: string;
  status: string;
  result: string | null;
  festivalEdition: {
    year: number;
    festivalMaster: { name: string };
  };
}

interface FilmDetail {
  id: string;
  titleOriginal: string;
  titleInternational: string | null;
  director: string;
  year: number;
  duration: number;
  genre: string;
  country: string;
  language: string;
  synopsisShortIt: string | null;
  synopsisShortEn: string | null;
  status: string;
  materials: Material[];
  distributionPlans: Plan[];
  submissions: Submission[];
}

const MATERIAL_LABELS: Record<string, string> = {
  screener_link: "Screener",
  poster: "Poster",
  still: "Still",
  synopsis_it: "Sinossi IT",
  synopsis_en: "Sinossi EN",
  bio_director: "Bio regista",
  tech_sheet: "Scheda tecnica",
  trailer: "Trailer",
  dcp: "DCP",
  press_kit: "Press kit",
  subtitles_en: "Sottotitoli EN",
  subtitles_it: "Sottotitoli IT",
  dialogue_list: "Dialogue list",
};

export default function FilmDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [form, setForm] = useState({
    titleOriginal: "",
    titleInternational: "",
    director: "",
    year: 2024,
    duration: 0,
    genre: "",
    country: "",
    language: "",
    synopsisShortIt: "",
    synopsisShortEn: "",
    status: "onboarding",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/films/${params.id}`)
      .then((r) => r.json())
      .then((data: FilmDetail) => {
        setFilm(data);
        setForm({
          titleOriginal: data.titleOriginal,
          titleInternational: data.titleInternational || "",
          director: data.director,
          year: data.year,
          duration: data.duration,
          genre: data.genre,
          country: data.country,
          language: data.language,
          synopsisShortIt: data.synopsisShortIt || "",
          synopsisShortEn: data.synopsisShortEn || "",
          status: data.status,
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
    const payload: Record<string, unknown> = {
      titleOriginal: form.titleOriginal,
      director: form.director,
      year: Number(form.year),
      duration: Number(form.duration),
      genre: form.genre,
      country: form.country,
      language: form.language,
      status: form.status,
    };
    if (form.titleInternational) payload.titleInternational = form.titleInternational;
    if (form.synopsisShortIt) payload.synopsisShortIt = form.synopsisShortIt;
    if (form.synopsisShortEn) payload.synopsisShortEn = form.synopsisShortEn;

    const res = await fetch(`/api/films/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast("Film salvato con successo");
      router.refresh();
    } else {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error) || "Errore"
      );
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Eliminare questo film? Verranno eliminati anche materiali, piani e iscrizioni collegati."
      )
    )
      return;
    const res = await fetch(`/api/films/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Film eliminato");
      router.push("/films");
    }
  };

  if (loading || !film)
    return <p className="text-[var(--muted-foreground)]">Caricamento...</p>;

  const requiredMissing = film.materials.filter(
    (m) => m.isRequired && m.status === "missing"
  ).length;
  const requiredTotal = film.materials.filter((m) => m.isRequired).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={film.titleOriginal}
        subtitle={`${film.director} · ${film.year} · ${film.duration}′ · ${film.genre}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Materials status */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
            Materiali
          </p>
          <p className="text-2xl font-semibold mt-1">
            {requiredTotal - requiredMissing}/{requiredTotal}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {requiredMissing > 0 ? `${requiredMissing} obbligatori mancanti` : "Tutti caricati"}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
            Piani distribuzione
          </p>
          <p className="text-2xl font-semibold mt-1">{film.distributionPlans.length}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {film.distributionPlans.filter((p) => p.status === "active").length} attivi
          </p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
            Iscrizioni
          </p>
          <p className="text-2xl font-semibold mt-1">{film.submissions.length}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {film.submissions.filter((s) => s.result === "official_selection").length} selezioni
          </p>
        </div>
      </div>

      {/* Materials table */}
      {film.materials.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
            Materiali
          </h2>
          <div className="border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-hidden">
            <ul className="divide-y divide-[var(--border)]">
              {film.materials.map((m) => (
                <li key={m.id} className="p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {MATERIAL_LABELS[m.type] || m.type}
                    </span>
                    {m.isRequired && (
                      <span className="text-[10px] bg-[var(--accent)] text-[var(--accent-foreground)] px-1.5 py-0.5 rounded">
                        OBB
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                      >
                        Apri
                      </a>
                    )}
                    <StatusBadge value={m.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Plans */}
      {film.distributionPlans.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
            Piani distribuzione
          </h2>
          <div className="space-y-2">
            {film.distributionPlans.map((p) => (
              <Link
                key={p.id}
                href={`/strategies/${p.id}`}
                className="block p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    Premiere {p.premiereLevel} · {p.entries.length} festival
                  </span>
                  <StatusBadge value={p.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI suggestions */}
      <AIFestivalsPanel filmId={film.id} />

      {/* Submissions */}
      {film.submissions.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
            Iscrizioni ({film.submissions.length})
          </h2>
          <ul className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg bg-[var(--card)] overflow-hidden">
            {film.submissions.map((s) => (
              <li key={s.id} className="p-3 flex items-center justify-between text-sm">
                <Link href={`/submissions/${s.id}`} className="flex-1 min-w-0 truncate">
                  {s.festivalEdition.festivalMaster.name} · {s.festivalEdition.year}
                </Link>
                <div className="flex items-center gap-2">
                  <StatusBadge value={s.status} />
                  {s.result && <StatusBadge value={s.result} />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Edit form */}
      <section className="space-y-2 pt-4 border-t border-[var(--border)]">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          Modifica dati
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Titolo originale"
              name="titleOriginal"
              value={form.titleOriginal}
              onChange={update}
              required
            />
            <FormField
              label="Titolo internazionale"
              name="titleInternational"
              value={form.titleInternational}
              onChange={update}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Regista"
              name="director"
              value={form.director}
              onChange={update}
              required
            />
            <FormField
              label="Anno"
              name="year"
              type="number"
              value={form.year}
              onChange={update}
              required
            />
            <FormField
              label="Durata (min)"
              name="duration"
              type="number"
              value={form.duration}
              onChange={update}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Genere"
              name="genre"
              value={form.genre}
              onChange={update}
              required
            />
            <FormField
              label="Paese"
              name="country"
              value={form.country}
              onChange={update}
              required
            />
            <FormField
              label="Lingua"
              name="language"
              value={form.language}
              onChange={update}
            />
          </div>
          <FormField
            label="Stato"
            name="status"
            type="select"
            value={form.status}
            onChange={update}
            options={FILM_STATUS_OPTIONS}
          />
          <FormField
            label="Sinossi IT"
            name="synopsisShortIt"
            type="textarea"
            value={form.synopsisShortIt}
            onChange={update}
          />
          <FormField
            label="Sinossi EN"
            name="synopsisShortEn"
            type="textarea"
            value={form.synopsisShortEn}
            onChange={update}
          />
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-sm ml-auto"
            >
              Elimina film
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
