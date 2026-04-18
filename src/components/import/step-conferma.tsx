"use client";

import type { WizardState } from "./types";

function formatEur(v: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);
}

export function StepConferma({
  state,
  saving,
  onCommit,
}: {
  state: WizardState;
  saving: boolean;
  onCommit: () => void;
}) {
  const filmTitle =
    state.film.action === "existing"
      ? state.film.conflicts.find((c) => c.id === state.film.existingId)
          ?.titleOriginal ?? "(film esistente)"
      : state.film.data?.titleOriginal ??
        state.film.manualData.titleOriginal ??
        "(senza titolo)";

  const activeRows = state.submissions.rows.filter(
    (r) => r.include && r.selectedMasterId
  );
  const skippedNoMatch = state.submissions.rows.filter(
    (r) => r.include && !r.selectedMasterId
  );
  const totalList = activeRows.reduce(
    (acc, r) => acc + (r.listPrice ?? 0),
    0
  );
  const totalFeesPaid = activeRows.reduce(
    (acc, r) => acc + (r.feesPaid ?? 0),
    0
  );
  const margin = totalList - totalFeesPaid;
  const charged = totalList - state.submissions.discount;

  const activeQueue = state.queue.rows.filter(
    (r) => r.include && r.selectedMasterId
  );

  return (
    <div className="space-y-4">
      <div className="info-box">
        Controlla il riepilogo. Al click su Conferma salvo tutto in
        un&apos;unica transazione: se qualcosa fallisce, niente viene scritto.
      </div>

      <div
        className="rounded-md border p-4 space-y-2"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="text-xs font-semibold uppercase"
          style={{ color: "var(--fg-3)" }}
        >
          Film
        </div>
        <div className="text-sm font-semibold">{filmTitle}</div>
        <div className="text-xs" style={{ color: "var(--fg-3)" }}>
          Azione:{" "}
          <strong>
            {state.film.action === "create" && "Crea nuovo"}
            {state.film.action === "update" && "Aggiorna esistente"}
            {state.film.action === "existing" && "Usa esistente"}
            {state.film.action == null && "— non impostata"}
          </strong>
        </div>
      </div>

      <div
        className="rounded-md border p-4 space-y-3"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="text-xs font-semibold uppercase"
          style={{ color: "var(--fg-3)" }}
        >
          Iscrizioni
        </div>
        <div className="text-sm">
          <strong>{activeRows.length}</strong> da importare
          {skippedNoMatch.length > 0 && (
            <span style={{ color: "var(--warn)" }}>
              {" "}
              • {skippedNoMatch.length} senza match festival (saranno saltate)
            </span>
          )}
        </div>
        {activeRows.length > 0 && (
          <div className="space-y-1 text-xs" style={{ color: "var(--fg-2)" }}>
            <div className="flex justify-between">
              <span>Prezzo listino totale</span>
              <span className="mono">{formatEur(totalList)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pagato ai festival</span>
              <span className="mono">- {formatEur(totalFeesPaid)}</span>
            </div>
            <div
              className="flex justify-between pt-1 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <span>Margine lordo</span>
              <span className="mono" style={{ color: "var(--ok)" }}>
                {formatEur(margin)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sconto applicato</span>
              <span className="mono">
                {formatEur(state.submissions.discount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                <strong>Addebitato al cliente</strong>
              </span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {formatEur(charged)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-md border p-4 space-y-2"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="text-xs font-semibold uppercase"
          style={{ color: "var(--fg-3)" }}
        >
          Coda
        </div>
        {state.queue.skipped && activeQueue.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--fg-3)" }}>
            Step saltato, nessuna voce in coda.
          </div>
        ) : (
          <div className="text-sm">
            <strong>{activeQueue.length}</strong> festival da aggiungere in coda
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          type="button"
          className="btn-primary"
          onClick={onCommit}
          disabled={saving || state.film.action == null}
          style={{ width: "100%", padding: "10px", fontSize: 14 }}
        >
          {saving
            ? "Salvataggio in corso…"
            : "Conferma e importa tutto"}
        </button>
      </div>
    </div>
  );
}
