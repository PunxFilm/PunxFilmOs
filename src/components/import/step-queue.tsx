"use client";

import { SheetPicker } from "./sheet-picker";
import { FestivalMatchCell } from "./festival-match-cell";
import type { CreatedFestival } from "./create-festival-modal";
import type { QueueRowDraft, SheetInfo } from "./types";

interface Props {
  skipped: boolean;
  file: File | null;
  sheets: SheetInfo[];
  selectedSheets: string[];
  rows: QueueRowDraft[];
  parsing: boolean;
  onFile: (f: File | null) => void;
  onLoadSheets: () => void;
  onToggleSheet: (name: string, checked: boolean) => void;
  onParse: () => void;
  onSkip: (skipped: boolean) => void;
  onRowSelectMaster: (rowId: string, masterId: string | null) => void;
  onRowCreated: (rowId: string, fm: CreatedFestival) => void;
  onRowEdit: (rowId: string, patch: Partial<QueueRowDraft>) => void;
  onRowRemove: (rowId: string) => void;
  onClearFile: () => void;
}

export function StepQueue({
  skipped,
  file,
  sheets,
  selectedSheets,
  rows,
  parsing,
  onFile,
  onLoadSheets,
  onToggleSheet,
  onParse,
  onSkip,
  onRowSelectMaster,
  onRowCreated,
  onRowEdit,
  onRowRemove,
  onClearFile,
}: Props) {
  const isXlsx =
    file && (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls"));

  return (
    <div className="space-y-4">
      <div className="info-box">
        Facoltativo. Se hai un file con festival candidati non ancora iscritti,
        caricalo: diventeranno voci &quot;Coda&quot; nel piano di distribuzione.
        Se il piano non esiste te lo creo.
      </div>

      {!skipped && rows.length === 0 && (
        <>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls"
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
              className="text-xs flex items-center justify-between"
              style={{ color: "var(--fg-3)" }}
            >
              <span>
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <button type="button" className="btn-ghost sm" onClick={onClearFile}>
                Rimuovi
              </button>
            </div>
          )}

          {isXlsx && sheets.length === 0 && (
            <button
              type="button"
              className="btn"
              onClick={onLoadSheets}
              disabled={!file || parsing}
            >
              {parsing ? "Leggo fogli..." : "Leggi fogli Excel"}
            </button>
          )}

          {isXlsx && sheets.length > 0 && (
            <>
              <SheetPicker
                sheets={sheets}
                selected={selectedSheets}
                onToggle={onToggleSheet}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={onParse}
                disabled={selectedSheets.length === 0 || parsing}
              >
                {parsing ? "Elaboro..." : "Importa fogli"}
              </button>
            </>
          )}

          {file && !isXlsx && (
            <button
              type="button"
              className="btn-primary"
              onClick={onParse}
              disabled={parsing}
            >
              {parsing ? "Estrazione AI in corso..." : "Estrai coda con AI"}
            </button>
          )}

          <button type="button" className="btn-ghost" onClick={() => onSkip(true)}>
            Salta step (nessuna coda da importare)
          </button>
        </>
      )}

      {skipped && rows.length === 0 && (
        <div className="info-box">
          Step saltato. Non verrà creata nessuna voce in coda.
          <div className="pt-2">
            <button
              type="button"
              className="btn sm"
              onClick={() => onSkip(false)}
            >
              Cambia idea, carica un file
            </button>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div
            className="text-xs flex items-center justify-between"
            style={{ color: "var(--fg-3)" }}
          >
            <span>{rows.length} festival in coda</span>
            <button type="button" className="btn-ghost sm" onClick={onClearFile}>
              Ricarica file
            </button>
          </div>
          <div
            className="rounded-md border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Festival</th>
                  <th>Match catalogo</th>
                  <th>Priorità</th>
                  <th>Data evento</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ opacity: r.include ? 1 : 0.4 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) =>
                          onRowEdit(r.id, { include: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <div className="t-title">{r.festivalName}</div>
                    </td>
                    <td style={{ minWidth: 240 }}>
                      <FestivalMatchCell
                        query={r.festivalName}
                        matches={r.matches}
                        selectedId={r.selectedMasterId}
                        onSelect={(id) => onRowSelectMaster(r.id, id)}
                        onCreated={(fm) => onRowCreated(r.id, fm)}
                      />
                    </td>
                    <td>
                      <select
                        value={r.priority ?? ""}
                        onChange={(e) =>
                          onRowEdit(r.id, {
                            priority: e.target.value || null,
                          })
                        }
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--fg)",
                        }}
                      >
                        <option value="">—</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={r.eventDate ?? ""}
                        onChange={(e) =>
                          onRowEdit(r.id, {
                            eventDate: e.target.value || null,
                          })
                        }
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--fg)",
                          width: 130,
                        }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost sm"
                        onClick={() => onRowRemove(r.id)}
                        style={{ color: "var(--accent)" }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
