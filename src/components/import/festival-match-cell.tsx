"use client";

import { useState } from "react";
import {
  CreateFestivalModal,
  type CreatedFestival,
} from "./create-festival-modal";

export interface MatchCandidate {
  festivalMasterId: string;
  name: string;
  country: string | null;
  confidence: number;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.95)
    return <span className="badge ok">{Math.round(confidence * 100)}%</span>;
  if (confidence >= 0.8)
    return <span className="badge info">{Math.round(confidence * 100)}%</span>;
  if (confidence >= 0.65)
    return <span className="badge warn">{Math.round(confidence * 100)}%</span>;
  return <span className="badge">{Math.round(confidence * 100)}%</span>;
}

export function FestivalMatchCell({
  query,
  matches,
  selectedId,
  onSelect,
  onCreated,
}: {
  query: string;
  matches: MatchCandidate[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreated: (fm: CreatedFestival) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleChange = (val: string) => {
    if (val === "__create__") {
      setModalOpen(true);
    } else {
      onSelect(val || null);
    }
  };

  const hasMatches = matches.length > 0;
  const currentMatch = matches.find((m) => m.festivalMasterId === selectedId);

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm px-2 py-1 rounded flex-1 min-w-0"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
        }}
      >
        <option value="">— seleziona —</option>
        {matches.map((m) => (
          <option key={m.festivalMasterId} value={m.festivalMasterId}>
            {m.name}
            {m.country ? ` (${m.country})` : ""} — {Math.round(m.confidence * 100)}%
          </option>
        ))}
        {!hasMatches && (
          <option value="" disabled>
            Nessun match trovato
          </option>
        )}
        <option value="__create__">+ Crea nuovo festival…</option>
      </select>
      {currentMatch && (
        <ConfidenceBadge confidence={currentMatch.confidence} />
      )}
      <CreateFestivalModal
        open={modalOpen}
        initialName={query}
        onClose={() => setModalOpen(false)}
        onCreated={(fm) => {
          onCreated(fm);
          onSelect(fm.id);
        }}
      />
    </div>
  );
}
