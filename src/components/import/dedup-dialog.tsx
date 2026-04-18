"use client";

import { useState } from "react";

export interface DuplicateInfo {
  festivalMasterId: string;
  festivalName: string;
  existingSubmissionId: string;
  existingStatus: string;
  existingFeesPaid: number | null;
  existingListPrice: number | null;
  proposedStatus: string | null;
  proposedFeesPaid: number | null;
  proposedListPrice: number | null;
}

type Resolution = "update" | "skip" | "duplicate";

export function DedupDialog({
  duplicates,
  resolutions,
  onResolve,
  onApplyAll,
}: {
  duplicates: DuplicateInfo[];
  resolutions: Record<string, Resolution>;
  onResolve: (masterId: string, r: Resolution) => void;
  onApplyAll: (r: Resolution) => void;
}) {
  const [bulkChoice, setBulkChoice] = useState<Resolution>("update");

  if (duplicates.length === 0) return null;

  return (
    <div
      className="rounded-md border p-4 space-y-3"
      style={{
        background: "color-mix(in oklch, var(--warn) 10%, transparent)",
        borderColor: "color-mix(in oklch, var(--warn) 40%, transparent)",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: "var(--warn)" }}>
            Attenzione: {duplicates.length} iscrizion
            {duplicates.length === 1 ? "e già esistente" : "i già esistenti"}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--fg-2)" }}>
            Scegli come procedere per ciascuna, o applica la stessa scelta a tutte.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--fg-3)" }}>
          Applica a tutte:
        </span>
        <select
          value={bulkChoice}
          onChange={(e) => setBulkChoice(e.target.value as Resolution)}
          className="text-xs px-2 py-1 rounded"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        >
          <option value="update">Aggiorna esistente</option>
          <option value="skip">Salta (non importare)</option>
          <option value="duplicate">Crea duplicato</option>
        </select>
        <button
          type="button"
          className="btn sm"
          onClick={() => onApplyAll(bulkChoice)}
        >
          Applica
        </button>
      </div>

      <div
        className="divide-y rounded overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        {duplicates.map((d) => {
          const res = resolutions[d.festivalMasterId];
          return (
            <div
              key={d.festivalMasterId}
              className="p-3 flex items-center gap-3 text-sm"
              style={{ background: "var(--card)" }}
            >
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 500 }}>{d.festivalName}</div>
                <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                  Esistente: {d.existingStatus}
                  {d.existingListPrice != null && ` • listino €${d.existingListPrice}`}
                  {d.existingFeesPaid != null && ` • pagato €${d.existingFeesPaid}`}
                </div>
                <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                  Nuovo: {d.proposedStatus ?? "—"}
                  {d.proposedListPrice != null && ` • listino €${d.proposedListPrice}`}
                  {d.proposedFeesPaid != null && ` • pagato €${d.proposedFeesPaid}`}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  className={res === "update" ? "btn-primary sm" : "btn sm"}
                  onClick={() => onResolve(d.festivalMasterId, "update")}
                >
                  Aggiorna
                </button>
                <button
                  type="button"
                  className={res === "skip" ? "btn-primary sm" : "btn sm"}
                  onClick={() => onResolve(d.festivalMasterId, "skip")}
                >
                  Salta
                </button>
                <button
                  type="button"
                  className={res === "duplicate" ? "btn-primary sm" : "btn sm"}
                  onClick={() => onResolve(d.festivalMasterId, "duplicate")}
                >
                  Duplica
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
