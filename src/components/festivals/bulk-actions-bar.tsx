"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { toCSV, downloadCSV, csvDate } from "@/lib/csv-export";
import { primaryEmail } from "@/lib/email-templates";
import type { EditionListItem } from "./types";

interface FilmOption {
  id: string;
  titleOriginal: string;
  duration: number;
}

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  allEditions: EditionListItem[]; // per recuperare dati delle selected
  onClear: () => void;
  initialFilmId?: string; // pre-selezione del film dal contesto "per questo film"
}

export function BulkActionsBar({
  selectedIds,
  allEditions,
  onClear,
  initialFilmId = "",
}: BulkActionsBarProps) {
  const { toast } = useToast();
  const [films, setFilms] = useState<FilmOption[]>([]);
  const [filmId, setFilmId] = useState(initialFilmId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialFilmId) setFilmId(initialFilmId);
  }, [initialFilmId]);

  useEffect(() => {
    fetch("/api/films")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setFilms(
            data.map((f) => ({
              id: f.id,
              titleOriginal: f.titleOriginal,
              duration: f.duration,
            }))
          );
        }
      })
      .catch(() => {
        /* fallback silent */
      });
  }, []);

  if (selectedIds.size === 0) return null;

  const selected = allEditions.filter((e) => selectedIds.has(e.id));
  const count = selectedIds.size;

  const handleAddToPlan = async () => {
    if (!filmId) {
      toast("Scegli prima un film", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/festivals/bulk-add-to-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filmId,
          editionIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error?.toString() || "Errore nell'aggiunta al piano", "error");
        return;
      }
      const data = await res.json();
      toast(
        `${data.added} festival aggiunti al piano di "${data.filmTitle}"${
          data.skipped > 0 ? ` (${data.skipped} già presenti)` : ""
        }`
      );
      onClear();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyEmails = async () => {
    const emails = Array.from(
      new Set(
        selected
          .map((e) => primaryEmail(e.festivalMaster.contactEmailInfo))
          .filter((x): x is string => !!x)
      )
    );
    if (emails.length === 0) {
      toast("Nessuna email nei selezionati", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(emails.join("; "));
      toast(`${emails.length} email copiate negli appunti`);
    } catch {
      toast("Clipboard non disponibile", "error");
    }
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const csv = toCSV(selected, [
      { key: "name", label: "Nome", value: (e) => e.festivalMaster.name },
      { key: "city", label: "Città", value: (e) => e.festivalMaster.city },
      { key: "country", label: "Paese", value: (e) => e.festivalMaster.country },
      {
        key: "classification",
        label: "Classificazione",
        value: (e) => e.festivalMaster.classification || "",
      },
      { key: "year", label: "Anno", value: (e) => e.year },
      {
        key: "deadline",
        label: "Deadline",
        value: (e) => csvDate(e.activeDeadlineDate),
      },
      {
        key: "fee",
        label: "Fee",
        value: (e) => (e.feeAmount != null ? e.feeAmount : ""),
      },
      { key: "currency", label: "Currency", value: (e) => e.feeCurrency },
      {
        key: "prize",
        label: "Premio",
        value: (e) => e.prizeCash || e.prizeDescription || "",
      },
      {
        key: "eventStart",
        label: "Evento start",
        value: (e) => csvDate(e.eventStartDate),
      },
      {
        key: "eventEnd",
        label: "Evento end",
        value: (e) => csvDate(e.eventEndDate),
      },
      {
        key: "website",
        label: "Website",
        value: (e) => e.festivalMaster.website || "",
      },
      {
        key: "platform",
        label: "Platform",
        value: (e) => e.festivalMaster.submissionPlatform || "",
      },
      {
        key: "submissionUrl",
        label: "Submission URL",
        value: (e) => e.festivalMaster.submissionUrlBase || "",
      },
      {
        key: "email",
        label: "Email",
        value: (e) => e.festivalMaster.contactEmailInfo || "",
      },
      {
        key: "oscar",
        label: "Oscar",
        value: (e) => (e.festivalMaster.academyQualifying ? "yes" : ""),
      },
      {
        key: "bafta",
        label: "BAFTA",
        value: (e) => (e.festivalMaster.baftaQualifying ? "yes" : ""),
      },
      {
        key: "efa",
        label: "EFA",
        value: (e) => (e.festivalMaster.efaQualifying ? "yes" : ""),
      },
      {
        key: "goya",
        label: "Goya",
        value: (e) => (e.festivalMaster.goyaQualifying ? "yes" : ""),
      },
    ]);
    downloadCSV(`festivals-${today}.csv`, csv);
    toast(`${count} festival esportati in CSV`);
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 bg-[var(--primary)] text-[var(--primary-foreground)] border-t border-[var(--border)] shadow-lg">
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm">{count} selezionati</span>
          <button
            type="button"
            onClick={onClear}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Deseleziona
          </button>
        </div>

        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <select
            value={filmId}
            onChange={(e) => setFilmId(e.target.value)}
            className="px-2 py-1.5 rounded text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-w-[180px]"
            aria-label="Film per aggiunta al piano"
          >
            <option value="">🎬 Scegli un film…</option>
            {films.map((f) => (
              <option key={f.id} value={f.id}>
                {f.titleOriginal} ({Math.round(f.duration)}′)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddToPlan}
            disabled={!filmId || submitting}
            className="px-3 py-1.5 rounded bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
          >
            {submitting ? "Aggiunta…" : "➕ Aggiungi al piano"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyEmails}
            className="px-3 py-1.5 rounded border border-white/30 text-sm hover:bg-white/10 whitespace-nowrap"
          >
            📋 Copia email
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded border border-white/30 text-sm hover:bg-white/10 whitespace-nowrap"
          >
            📥 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
