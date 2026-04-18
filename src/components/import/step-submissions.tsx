"use client";

import { SheetPicker } from "./sheet-picker";
import { FestivalMatchCell } from "./festival-match-cell";
import { DedupDialog } from "./dedup-dialog";
import { ContabileBox } from "./contabile-box";
import type { CreatedFestival } from "./create-festival-modal";
import type { StrategyRowDraft, SheetInfo } from "./types";

interface Props {
  file: File | null;
  sheets: SheetInfo[];
  selectedSheets: string[];
  rows: StrategyRowDraft[];
  duplicates: Parameters<typeof DedupDialog>[0]["duplicates"];
  dedupResolutions: Record<string, "update" | "skip" | "duplicate">;
  discount: number;
  parsing: boolean;
  canSkipStep: boolean;
  onFile: (f: File | null) => void;
  onLoadSheets: () => void;
  onToggleSheet: (name: string, checked: boolean) => void;
  onParse: () => void;
  onRowSelectMaster: (rowId: string, masterId: string | null) => void;
  onRowCreated: (rowId: string, fm: CreatedFestival) => void;
  onRowEdit: (rowId: string, patch: Partial<StrategyRowDraft>) => void;
  onRowRemove: (rowId: string) => void;
  onDedupResolve: (
    masterId: string,
    r: "update" | "skip" | "duplicate"
  ) => void;
  onDedupApplyAll: (r: "update" | "skip" | "duplicate") => void;
  onDiscountChange: (v: number) => void;
  onClearFile: () => void;
  onSkip: () => void;
}

export function StepSubmissions({
  file,
  sheets,
  selectedSheets,
  rows,
  duplicates,
  dedupResolutions,
  discount,
  parsing,
  canSkipStep,
  onFile,
  onLoadSheets,
  onToggleSheet,
  onParse,
  onRowSelectMaster,
  onRowCreated,
  onRowEdit,
  onRowRemove,
  onDedupResolve,
  onDedupApplyAll,
  onDiscountChange,
  onClearFile,
  onSkip,
}: Props) {
  const totalListPrice = rows
    .filter((r) => r.include)
    .reduce((acc, r) => acc + (r.listPrice ?? 0), 0);
  const totalFeesPaid = rows
    .filter((r) => r.include)
    .reduce((acc, r) => acc + (r.feesPaid ?? 0), 0);

  const isXlsx =
    file && (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls"));

  return (
    <div className="space-y-4">
      <div className="info-box">
        Carica il file delle iscrizioni (PDF o Excel). Per ogni festival ti
        mostro il match col catalogo interno: conferma o crea un festival nuovo.
        Alla fine decido lo sconto da applicare al cliente e genero i movimenti
        contabili.
      </div>

      {rows.length === 0 && (
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
                {parsing
                  ? "Elaboro..."
                  : `Importa ${selectedSheets.length} foglio${selectedSheets.length === 1 ? "" : "i"}`}
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
              {parsing ? "Estrazione AI in corso..." : "Estrai iscrizioni con AI"}
            </button>
          )}

          {canSkipStep && (
            <button type="button" className="btn-ghost" onClick={onSkip}>
              Salta (nessuna iscrizione)
            </button>
          )}
        </>
      )}

      {rows.length > 0 && (
        <>
          <div
            className="text-xs flex items-center justify-between"
            style={{ color: "var(--fg-3)" }}
          >
            <span>{rows.length} iscrizioni trovate</span>
            <button type="button" className="btn-ghost sm" onClick={onClearFile}>
              Ricarica file
            </button>
          </div>

          {duplicates.length > 0 && (
            <DedupDialog
              duplicates={duplicates}
              resolutions={dedupResolutions}
              onResolve={onDedupResolve}
              onApplyAll={onDedupApplyAll}
            />
          )}

          <div
            className="rounded-md border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Festival (da file)</th>
                  <th>Match catalogo</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: "right" }}>Listino</th>
                  <th style={{ textAlign: "right" }}>Pagato festival</th>
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
                    <td style={{ maxWidth: 180 }}>
                      <div className="t-title">{r.festivalName}</div>
                      {r.location && (
                        <div className="t-sub">{r.location}</div>
                      )}
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
                        value={r.status ?? ""}
                        onChange={(e) =>
                          onRowEdit(r.id, { status: e.target.value || null })
                        }
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--fg)",
                        }}
                      >
                        <option value="">—</option>
                        <option value="Not Selected">Not Selected</option>
                        <option value="Selected">Selected</option>
                        <option value="Undecided">Undecided</option>
                        <option value="submitted">Inviata</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={r.deadline ?? ""}
                        onChange={(e) =>
                          onRowEdit(r.id, { deadline: e.target.value || null })
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
                    <td style={{ textAlign: "right" }}>
                      <input
                        type="number"
                        step="0.5"
                        value={r.listPrice ?? ""}
                        onChange={(e) =>
                          onRowEdit(r.id, {
                            listPrice: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                        className="text-xs px-2 py-1 rounded mono"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--fg)",
                          width: 80,
                          textAlign: "right",
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        type="number"
                        step="0.5"
                        value={r.feesPaid ?? ""}
                        onChange={(e) =>
                          onRowEdit(r.id, {
                            feesPaid: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                        className="text-xs px-2 py-1 rounded mono"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--fg)",
                          width: 80,
                          textAlign: "right",
                        }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost sm"
                        onClick={() => onRowRemove(r.id)}
                        title="Rimuovi"
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

          <ContabileBox
            totalListPrice={totalListPrice}
            totalFeesPaid={totalFeesPaid}
            discount={discount}
            maxDiscount={Math.max(0, totalListPrice - totalFeesPaid)}
            onDiscountChange={onDiscountChange}
          />
        </>
      )}
    </div>
  );
}
