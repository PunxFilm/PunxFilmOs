"use client";

import { useRef } from "react";
import { FilmSearch } from "./film-search";
import type { ConflictFilm, FilmAction, FilmMode } from "./types";
import type { FilmSheetData } from "@/lib/import/film-sheet-parser";

interface Props {
  mode: FilmMode;
  file: File | null;
  data: FilmSheetData | null;
  manualData: Partial<FilmSheetData>;
  action: FilmAction;
  existingId: string | null;
  conflicts: ConflictFilm[];
  parsing: boolean;
  onModeChange: (m: FilmMode) => void;
  onFile: (f: File | null) => void;
  onParse: () => void;
  onResolveConflict: (action: "create" | "update") => void;
  onSelectExisting: (film: { id: string; titleOriginal: string; director: string; year: number }) => void;
  onManualChange: (patch: Partial<FilmSheetData>) => void;
  onManualCommit: () => void;
  onClearFilm: () => void;
}

export function StepFilm({
  mode,
  file,
  data,
  manualData,
  action,
  existingId,
  conflicts,
  parsing,
  onModeChange,
  onFile,
  onParse,
  onResolveConflict,
  onSelectExisting,
  onManualChange,
  onManualCommit,
  onClearFilm,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="info-box">
        Carica la scheda del film (PDF o Word). L&apos;AI estrae titolo, regista,
        sinossi, bio. Se il film esiste già nel catalogo te lo segnalo. Puoi
        anche compilarla a mano o collegare un film già presente.
      </div>

      {/* Tab selector */}
      <div className="segmented">
        <button
          type="button"
          className={mode === "upload" ? "active" : ""}
          onClick={() => onModeChange("upload")}
        >
          Carica file
        </button>
        <button
          type="button"
          className={mode === "manual" ? "active" : ""}
          onClick={() => onModeChange("manual")}
        >
          Inserisci a mano
        </button>
        <button
          type="button"
          className={mode === "search" ? "active" : ""}
          onClick={() => onModeChange("search")}
        >
          Film esistente
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div className="space-y-3">
          {!data && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  background: "var(--bg-2)",
                  borderColor: "var(--border)",
                  color: "var(--fg)",
                }}
              />
              {file && (
                <div
                  className="text-xs flex items-center gap-2"
                  style={{ color: "var(--fg-3)" }}
                >
                  <span>
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              )}
              <button
                type="button"
                className="btn-primary"
                disabled={!file || parsing}
                onClick={onParse}
              >
                {parsing ? "Estrazione AI in corso..." : "Estrai dati con AI"}
              </button>
            </>
          )}

          {data && (
            <ParsedFilmSummary
              data={data}
              conflicts={conflicts}
              action={action}
              existingId={existingId}
              onResolveConflict={onResolveConflict}
              onSelectExisting={onSelectExisting}
              onClear={onClearFilm}
            />
          )}
        </div>
      )}

      {/* Manual mode */}
      {mode === "manual" && (
        <ManualForm
          data={manualData}
          onChange={onManualChange}
          onCommit={onManualCommit}
        />
      )}

      {/* Search existing */}
      {mode === "search" && (
        <div className="space-y-3">
          <FilmSearch
            selectedId={existingId}
            onSelect={(f) => onSelectExisting(f)}
          />
          {existingId && action === "existing" && (
            <div className="info-box">
              Film selezionato. Procedi allo step successivo per aggiungere
              iscrizioni.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParsedFilmSummary({
  data,
  conflicts,
  action,
  existingId,
  onResolveConflict,
  onSelectExisting,
  onClear,
}: {
  data: FilmSheetData;
  conflicts: ConflictFilm[];
  action: FilmAction;
  existingId: string | null;
  onResolveConflict: (a: "create" | "update") => void;
  onSelectExisting: (f: {
    id: string;
    titleOriginal: string;
    director: string;
    year: number;
  }) => void;
  onClear: () => void;
}) {
  const directorName = data.director
    ? `${data.director.firstName ?? ""} ${data.director.lastName ?? ""}`.trim()
    : "—";

  return (
    <div className="space-y-3">
      <div
        className="rounded-md border p-3 space-y-2"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">
              {data.titleOriginal ?? "(senza titolo)"}
            </div>
            <div className="text-xs" style={{ color: "var(--fg-3)" }}>
              {directorName}
              {data.year ? ` • ${data.year}` : ""}
              {data.duration ? ` • ${data.duration}′` : ""}
              {data.genre ? ` • ${data.genre}` : ""}
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost sm"
            onClick={onClear}
            style={{ fontSize: 11 }}
          >
            Cambia file
          </button>
        </div>
        {data.synopsisShortIt && (
          <p className="text-xs" style={{ color: "var(--fg-2)" }}>
            {data.synopsisShortIt}
          </p>
        )}
      </div>

      {conflicts.length > 0 && action == null && (
        <div
          className="rounded-md border p-3 space-y-2"
          style={{
            background: "color-mix(in oklch, var(--warn) 10%, transparent)",
            borderColor: "color-mix(in oklch, var(--warn) 40%, transparent)",
          }}
        >
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--warn)" }}
          >
            Possibile duplicato trovato
          </div>
          <div className="text-xs" style={{ color: "var(--fg-2)" }}>
            Nel catalogo esistono già questi film simili:
          </div>
          <ul className="text-xs space-y-1" style={{ color: "var(--fg-2)" }}>
            {conflicts.slice(0, 3).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  <strong>{c.titleOriginal}</strong> — {c.director} ({c.year})
                </span>
                <div className="flex items-center gap-2">
                  <span className="badge warn">
                    match {Math.round(c.score * 100)}%
                  </span>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() =>
                      onSelectExisting({
                        id: c.id,
                        titleOriginal: c.titleOriginal,
                        director: c.director,
                        year: c.year,
                      })
                    }
                  >
                    Usa questo
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="btn-primary sm"
              onClick={() => onResolveConflict("create")}
            >
              Crea nuovo (ignora duplicati)
            </button>
            {conflicts[0] && (
              <button
                type="button"
                className="btn sm"
                onClick={() => onResolveConflict("update")}
              >
                Aggiorna {conflicts[0].titleOriginal}
              </button>
            )}
          </div>
        </div>
      )}

      {(action === "create" ||
        action === "update" ||
        (action === "existing" && existingId)) && (
        <div className="info-box">
          {action === "create" && "Sarà creato un nuovo film."}
          {action === "update" &&
            "Il film esistente sarà aggiornato con i nuovi dati (campi vuoti)."}
          {action === "existing" && "Userò il film esistente selezionato."}
        </div>
      )}

      {conflicts.length === 0 && action == null && (
        <div className="info-box">
          Nessun duplicato trovato. Pronto a creare nuovo film.
          <div className="pt-2">
            <button
              type="button"
              className="btn-primary sm"
              onClick={() => onResolveConflict("create")}
            >
              Conferma creazione
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualForm({
  data,
  onChange,
  onCommit,
}: {
  data: Partial<FilmSheetData>;
  onChange: (patch: Partial<FilmSheetData>) => void;
  onCommit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InputRow
          label="Titolo originale *"
          value={data.titleOriginal ?? ""}
          onChange={(v) => onChange({ titleOriginal: v })}
        />
        <InputRow
          label="Titolo internazionale"
          value={data.titleInternational ?? ""}
          onChange={(v) => onChange({ titleInternational: v })}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <InputRow
          label="Nome regista"
          value={data.director?.firstName ?? ""}
          onChange={(v) =>
            onChange({
              director: { ...(data.director ?? {}), firstName: v },
            })
          }
        />
        <InputRow
          label="Cognome regista"
          value={data.director?.lastName ?? ""}
          onChange={(v) =>
            onChange({
              director: { ...(data.director ?? {}), lastName: v },
            })
          }
        />
        <InputRow
          label="Email regista"
          value={data.director?.email ?? ""}
          onChange={(v) =>
            onChange({
              director: { ...(data.director ?? {}), email: v },
            })
          }
        />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <InputRow
          label="Anno"
          type="number"
          value={data.year != null ? String(data.year) : ""}
          onChange={(v) => onChange({ year: v ? parseInt(v, 10) : null })}
        />
        <InputRow
          label="Durata (min)"
          type="number"
          value={data.duration != null ? String(data.duration) : ""}
          onChange={(v) => onChange({ duration: v ? parseFloat(v) : null })}
        />
        <InputRow
          label="Genere"
          value={data.genre ?? ""}
          onChange={(v) => onChange({ genre: v })}
        />
        <InputRow
          label="Paese"
          value={data.country ?? ""}
          onChange={(v) => onChange({ country: v })}
        />
      </div>
      <div>
        <label
          className="block text-xs font-medium mb-1"
          style={{ color: "var(--fg-2)" }}
        >
          Sinossi breve (IT)
        </label>
        <textarea
          value={data.synopsisShortIt ?? ""}
          onChange={(e) => onChange({ synopsisShortIt: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        />
      </div>
      <button
        type="button"
        className="btn-primary"
        onClick={onCommit}
        disabled={!data.titleOriginal?.trim()}
      >
        Conferma dati film
      </button>
    </div>
  );
}

function InputRow({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1"
        style={{ color: "var(--fg-2)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded text-sm"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
        }}
      />
    </div>
  );
}
