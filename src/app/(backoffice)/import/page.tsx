"use client";

import { useReducer, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toast";
import { ImportWizardStepper } from "@/components/import/wizard-stepper";
import { StepFilm } from "@/components/import/step-film";
import { StepSubmissions } from "@/components/import/step-submissions";
import { StepQueue } from "@/components/import/step-queue";
import { StepConferma } from "@/components/import/step-conferma";
import {
  type WizardState,
  type StrategyRowDraft,
  type QueueRowDraft,
  makeInitialState,
} from "@/components/import/types";
import type { FilmSheetData } from "@/lib/import/film-sheet-parser";
import type { MatchCandidate } from "@/components/import/festival-match-cell";
import type { DuplicateInfo } from "@/components/import/dedup-dialog";
import type { CreatedFestival } from "@/components/import/create-festival-modal";

type Action =
  | { type: "SET_STEP"; step: 1 | 2 | 3 | 4 }
  | { type: "FILM_MODE"; mode: WizardState["film"]["mode"] }
  | { type: "FILM_FILE"; file: File | null }
  | { type: "FILM_PARSING"; parsing: boolean }
  | {
      type: "FILM_PARSED";
      data: FilmSheetData;
      conflicts: WizardState["film"]["conflicts"];
    }
  | { type: "FILM_CLEAR" }
  | {
      type: "FILM_ACTION";
      action: "create" | "update" | "existing";
      existingId?: string | null;
    }
  | { type: "FILM_MANUAL_PATCH"; patch: Partial<FilmSheetData> }
  | {
      type: "FILM_SELECT_EXISTING";
      film: {
        id: string;
        titleOriginal: string;
        director: string;
        year: number;
      };
    }
  | { type: "SUBS_FILE"; file: File | null }
  | { type: "SUBS_SHEETS"; sheets: WizardState["submissions"]["sheets"] }
  | { type: "SUBS_TOGGLE_SHEET"; name: string; checked: boolean }
  | { type: "SUBS_PARSING"; parsing: boolean }
  | {
      type: "SUBS_ROWS";
      rows: StrategyRowDraft[];
      duplicates: DuplicateInfo[];
    }
  | { type: "SUBS_ROW_MASTER"; rowId: string; masterId: string | null }
  | { type: "SUBS_ROW_CREATED"; rowId: string; fm: CreatedFestival }
  | { type: "SUBS_ROW_EDIT"; rowId: string; patch: Partial<StrategyRowDraft> }
  | { type: "SUBS_ROW_REMOVE"; rowId: string }
  | {
      type: "SUBS_DEDUP_RESOLVE";
      masterId: string;
      resolution: "update" | "skip" | "duplicate";
    }
  | {
      type: "SUBS_DEDUP_APPLY_ALL";
      resolution: "update" | "skip" | "duplicate";
    }
  | { type: "SUBS_DISCOUNT"; value: number }
  | { type: "SUBS_CLEAR" }
  | { type: "QUEUE_FILE"; file: File | null }
  | { type: "QUEUE_SHEETS"; sheets: WizardState["queue"]["sheets"] }
  | { type: "QUEUE_TOGGLE_SHEET"; name: string; checked: boolean }
  | { type: "QUEUE_PARSING"; parsing: boolean }
  | { type: "QUEUE_ROWS"; rows: QueueRowDraft[] }
  | { type: "QUEUE_ROW_MASTER"; rowId: string; masterId: string | null }
  | { type: "QUEUE_ROW_CREATED"; rowId: string; fm: CreatedFestival }
  | { type: "QUEUE_ROW_EDIT"; rowId: string; patch: Partial<QueueRowDraft> }
  | { type: "QUEUE_ROW_REMOVE"; rowId: string }
  | { type: "QUEUE_SKIP"; skipped: boolean }
  | { type: "QUEUE_CLEAR" }
  | { type: "SAVING"; saving: boolean };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };

    case "FILM_MODE":
      return {
        ...state,
        film: {
          ...state.film,
          mode: action.mode,
          // reset action quando si cambia tab
          action: null,
          existingId: null,
        },
      };
    case "FILM_FILE":
      return { ...state, film: { ...state.film, file: action.file } };
    case "FILM_PARSING":
      return { ...state, film: { ...state.film, parsing: action.parsing } };
    case "FILM_PARSED":
      return {
        ...state,
        film: {
          ...state.film,
          data: action.data,
          conflicts: action.conflicts,
          parsing: false,
          action: action.conflicts.length === 0 ? null : null, // lascia all'utente
        },
      };
    case "FILM_CLEAR":
      return {
        ...state,
        film: {
          ...makeInitialState().film,
          mode: state.film.mode,
        },
      };
    case "FILM_ACTION":
      return {
        ...state,
        film: {
          ...state.film,
          action: action.action,
          existingId: action.existingId ?? state.film.existingId,
        },
      };
    case "FILM_MANUAL_PATCH":
      return {
        ...state,
        film: {
          ...state.film,
          manualData: { ...state.film.manualData, ...action.patch },
        },
      };
    case "FILM_SELECT_EXISTING":
      return {
        ...state,
        film: {
          ...state.film,
          action: "existing",
          existingId: action.film.id,
          // Manteniamo i conflicts così lo step-conferma può risalire al titolo
          conflicts:
            state.film.conflicts.find((c) => c.id === action.film.id)
              ? state.film.conflicts
              : [
                  {
                    id: action.film.id,
                    titleOriginal: action.film.titleOriginal,
                    director: action.film.director,
                    year: action.film.year,
                    score: 1,
                  },
                  ...state.film.conflicts,
                ],
        },
      };

    case "SUBS_FILE":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          file: action.file,
          sheets: [],
          selectedSheets: [],
        },
      };
    case "SUBS_SHEETS":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          sheets: action.sheets,
          selectedSheets: action.sheets.map((s) => s.name),
        },
      };
    case "SUBS_TOGGLE_SHEET": {
      const selected = new Set(state.submissions.selectedSheets);
      if (action.checked) selected.add(action.name);
      else selected.delete(action.name);
      return {
        ...state,
        submissions: {
          ...state.submissions,
          selectedSheets: Array.from(selected),
        },
      };
    }
    case "SUBS_PARSING":
      return {
        ...state,
        submissions: { ...state.submissions, parsing: action.parsing },
      };
    case "SUBS_ROWS":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          rows: action.rows,
          duplicates: action.duplicates,
          parsing: false,
          dedupResolutions: action.duplicates.reduce(
            (acc, d) => {
              acc[d.festivalMasterId] = "update";
              return acc;
            },
            {} as Record<string, "update" | "skip" | "duplicate">
          ),
        },
      };
    case "SUBS_ROW_MASTER":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          rows: state.submissions.rows.map((r) =>
            r.id === action.rowId
              ? { ...r, selectedMasterId: action.masterId }
              : r
          ),
        },
      };
    case "SUBS_ROW_CREATED": {
      const newMatch: MatchCandidate = {
        festivalMasterId: action.fm.id,
        name: action.fm.name,
        country: null,
        confidence: 1.0,
      };
      return {
        ...state,
        submissions: {
          ...state.submissions,
          rows: state.submissions.rows.map((r) =>
            r.id === action.rowId
              ? {
                  ...r,
                  matches: [newMatch, ...r.matches],
                  selectedMasterId: action.fm.id,
                }
              : r
          ),
        },
      };
    }
    case "SUBS_ROW_EDIT":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          rows: state.submissions.rows.map((r) =>
            r.id === action.rowId ? { ...r, ...action.patch } : r
          ),
        },
      };
    case "SUBS_ROW_REMOVE":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          rows: state.submissions.rows.filter((r) => r.id !== action.rowId),
        },
      };
    case "SUBS_DEDUP_RESOLVE":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          dedupResolutions: {
            ...state.submissions.dedupResolutions,
            [action.masterId]: action.resolution,
          },
        },
      };
    case "SUBS_DEDUP_APPLY_ALL": {
      const all: Record<string, "update" | "skip" | "duplicate"> = {};
      for (const d of state.submissions.duplicates)
        all[d.festivalMasterId] = action.resolution;
      return {
        ...state,
        submissions: { ...state.submissions, dedupResolutions: all },
      };
    }
    case "SUBS_DISCOUNT":
      return {
        ...state,
        submissions: { ...state.submissions, discount: action.value },
      };
    case "SUBS_CLEAR":
      return { ...state, submissions: makeInitialState().submissions };

    case "QUEUE_FILE":
      return {
        ...state,
        queue: {
          ...state.queue,
          file: action.file,
          sheets: [],
          selectedSheets: [],
          skipped: false,
        },
      };
    case "QUEUE_SHEETS":
      return {
        ...state,
        queue: {
          ...state.queue,
          sheets: action.sheets,
          selectedSheets: action.sheets.map((s) => s.name),
        },
      };
    case "QUEUE_TOGGLE_SHEET": {
      const selected = new Set(state.queue.selectedSheets);
      if (action.checked) selected.add(action.name);
      else selected.delete(action.name);
      return {
        ...state,
        queue: { ...state.queue, selectedSheets: Array.from(selected) },
      };
    }
    case "QUEUE_PARSING":
      return { ...state, queue: { ...state.queue, parsing: action.parsing } };
    case "QUEUE_ROWS":
      return {
        ...state,
        queue: { ...state.queue, rows: action.rows, parsing: false },
      };
    case "QUEUE_ROW_MASTER":
      return {
        ...state,
        queue: {
          ...state.queue,
          rows: state.queue.rows.map((r) =>
            r.id === action.rowId
              ? { ...r, selectedMasterId: action.masterId }
              : r
          ),
        },
      };
    case "QUEUE_ROW_CREATED": {
      const newMatch: MatchCandidate = {
        festivalMasterId: action.fm.id,
        name: action.fm.name,
        country: null,
        confidence: 1.0,
      };
      return {
        ...state,
        queue: {
          ...state.queue,
          rows: state.queue.rows.map((r) =>
            r.id === action.rowId
              ? {
                  ...r,
                  matches: [newMatch, ...r.matches],
                  selectedMasterId: action.fm.id,
                }
              : r
          ),
        },
      };
    }
    case "QUEUE_ROW_EDIT":
      return {
        ...state,
        queue: {
          ...state.queue,
          rows: state.queue.rows.map((r) =>
            r.id === action.rowId ? { ...r, ...action.patch } : r
          ),
        },
      };
    case "QUEUE_ROW_REMOVE":
      return {
        ...state,
        queue: {
          ...state.queue,
          rows: state.queue.rows.filter((r) => r.id !== action.rowId),
        },
      };
    case "QUEUE_SKIP":
      return { ...state, queue: { ...state.queue, skipped: action.skipped } };
    case "QUEUE_CLEAR":
      return { ...state, queue: makeInitialState().queue };
    case "SAVING":
      return { ...state, saving: action.saving };
    default:
      return state;
  }
}

const WIZARD_STEPS = [
  { num: 1, title: "Film" },
  { num: 2, title: "Iscrizioni" },
  { num: 3, title: "Coda" },
  { num: 4, title: "Conferma" },
];

function rowId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function ImportWizardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(reducer, makeInitialState());

  // ──────────────────────────────────────────────
  // STEP 1 — Film
  // ──────────────────────────────────────────────

  const parseFilmSheet = useCallback(async () => {
    if (!state.film.file) return;
    dispatch({ type: "FILM_PARSING", parsing: true });
    try {
      const fd = new FormData();
      fd.append("file", state.film.file);
      const res = await fetch("/api/import/film-sheet", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Errore parsing scheda", "error");
        dispatch({ type: "FILM_PARSING", parsing: false });
        return;
      }
      const data = await res.json();
      dispatch({
        type: "FILM_PARSED",
        data: data.filmData,
        conflicts: data.conflicts ?? [],
      });
      toast("Dati film estratti");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Errore di rete", "error");
      dispatch({ type: "FILM_PARSING", parsing: false });
    }
  }, [state.film.file, toast]);

  const handleFilmResolveConflict = useCallback(
    (action: "create" | "update") => {
      const existingId =
        action === "update" ? state.film.conflicts[0]?.id : null;
      dispatch({ type: "FILM_ACTION", action, existingId });
    },
    [state.film.conflicts]
  );

  const handleManualCommit = useCallback(() => {
    const title = state.film.manualData.titleOriginal?.trim();
    if (!title) {
      toast("Titolo obbligatorio", "error");
      return;
    }
    // Usa manualData come data e segna action=create
    dispatch({
      type: "FILM_PARSED",
      data: state.film.manualData as FilmSheetData,
      conflicts: [],
    });
    dispatch({ type: "FILM_ACTION", action: "create" });
    dispatch({ type: "FILM_MODE", mode: "upload" });
    toast("Dati film salvati");
  }, [state.film.manualData, toast]);

  // ──────────────────────────────────────────────
  // STEP 2 — Submissions
  // ──────────────────────────────────────────────

  const loadSubsSheets = useCallback(async () => {
    if (!state.submissions.file) return;
    dispatch({ type: "SUBS_PARSING", parsing: true });
    try {
      const fd = new FormData();
      fd.append("file", state.submissions.file);
      const res = await fetch("/api/import/xlsx-sheets", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Errore lettura fogli", "error");
        dispatch({ type: "SUBS_PARSING", parsing: false });
        return;
      }
      const { sheets } = await res.json();
      dispatch({ type: "SUBS_SHEETS", sheets });
      dispatch({ type: "SUBS_PARSING", parsing: false });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Errore di rete", "error");
      dispatch({ type: "SUBS_PARSING", parsing: false });
    }
  }, [state.submissions.file, toast]);

  const parseSubs = useCallback(async () => {
    if (!state.submissions.file) return;
    dispatch({ type: "SUBS_PARSING", parsing: true });
    try {
      const fd = new FormData();
      fd.append("file", state.submissions.file);
      if (state.film.action === "existing" && state.film.existingId) {
        fd.append("filmId", state.film.existingId);
      }
      for (const s of state.submissions.selectedSheets) {
        fd.append("sheetNames", s);
      }
      const res = await fetch("/api/import/submissions", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Errore import iscrizioni", "error");
        dispatch({ type: "SUBS_PARSING", parsing: false });
        return;
      }
      const { rows, duplicates } = await res.json();
      const drafts: StrategyRowDraft[] = rows.map(
        (r: {
          festivalName: string;
          matches?: MatchCandidate[];
          [key: string]: unknown;
        }) => ({
          id: rowId("sub"),
          externalId: (r.externalId as number) ?? null,
          festivalName: r.festivalName,
          deadline: (r.deadline as string) ?? null,
          status: (r.status as string) ?? null,
          notificationDate: (r.notificationDate as string) ?? null,
          listPrice: (r.listPrice as number) ?? null,
          eventDate: (r.eventDate as string) ?? null,
          location: (r.location as string) ?? null,
          prize: (r.prize as string) ?? null,
          submissionLink: (r.submissionLink as string) ?? null,
          websiteLink: (r.websiteLink as string) ?? null,
          notes: (r.notes as string) ?? null,
          feesPaid: (r.feesPaid as number) ?? null,
          matches: r.matches ?? [],
          selectedMasterId: r.matches && r.matches.length > 0 ? r.matches[0].festivalMasterId : null,
          include: true,
        })
      );
      dispatch({ type: "SUBS_ROWS", rows: drafts, duplicates: duplicates ?? [] });
      toast(`${drafts.length} iscrizioni importate`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Errore di rete", "error");
      dispatch({ type: "SUBS_PARSING", parsing: false });
    }
  }, [
    state.submissions.file,
    state.submissions.selectedSheets,
    state.film.action,
    state.film.existingId,
    toast,
  ]);

  // ──────────────────────────────────────────────
  // STEP 3 — Queue
  // ──────────────────────────────────────────────

  const loadQueueSheets = useCallback(async () => {
    if (!state.queue.file) return;
    dispatch({ type: "QUEUE_PARSING", parsing: true });
    try {
      const fd = new FormData();
      fd.append("file", state.queue.file);
      const res = await fetch("/api/import/xlsx-sheets", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Errore lettura fogli", "error");
        dispatch({ type: "QUEUE_PARSING", parsing: false });
        return;
      }
      const { sheets } = await res.json();
      dispatch({ type: "QUEUE_SHEETS", sheets });
      dispatch({ type: "QUEUE_PARSING", parsing: false });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Errore di rete", "error");
      dispatch({ type: "QUEUE_PARSING", parsing: false });
    }
  }, [state.queue.file, toast]);

  const parseQueue = useCallback(async () => {
    if (!state.queue.file) return;
    dispatch({ type: "QUEUE_PARSING", parsing: true });
    try {
      const fd = new FormData();
      fd.append("file", state.queue.file);
      for (const s of state.queue.selectedSheets) fd.append("sheetNames", s);
      const res = await fetch("/api/import/queue", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Errore import coda", "error");
        dispatch({ type: "QUEUE_PARSING", parsing: false });
        return;
      }
      const { rows } = await res.json();
      const drafts: QueueRowDraft[] = rows.map(
        (r: {
          festivalName: string;
          eventDate?: string | null;
          deadline?: string | null;
          matches?: MatchCandidate[];
        }) => ({
          id: rowId("q"),
          festivalName: r.festivalName,
          eventDate: r.eventDate ?? null,
          deadline: r.deadline ?? null,
          matches: r.matches ?? [],
          selectedMasterId:
            r.matches && r.matches.length > 0
              ? r.matches[0].festivalMasterId
              : null,
          include: true,
          priority: null,
        })
      );
      dispatch({ type: "QUEUE_ROWS", rows: drafts });
      toast(`${drafts.length} festival in coda`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Errore di rete", "error");
      dispatch({ type: "QUEUE_PARSING", parsing: false });
    }
  }, [state.queue.file, state.queue.selectedSheets, toast]);

  // ──────────────────────────────────────────────
  // STEP 4 — Commit
  // ──────────────────────────────────────────────

  const handleCommit = useCallback(async () => {
    if (state.film.action == null) {
      toast("Scegli un'azione per il film (crea / aggiorna / esistente)", "error");
      return;
    }
    dispatch({ type: "SAVING", saving: true });
    try {
      const activeSubs = state.submissions.rows.filter(
        (r) => r.include && r.selectedMasterId
      );
      const activeQueue = state.queue.rows.filter(
        (r) => r.include && r.selectedMasterId
      );

      // Calcolo sconto proporzionale: per ogni submission, estimatedFee = listPrice - (discount * listPrice/totalList)
      const totalList = activeSubs.reduce(
        (acc, r) => acc + (r.listPrice ?? 0),
        0
      );
      const discount = state.submissions.discount;

      const payload = {
        film: {
          action: state.film.action,
          data: state.film.data ?? undefined,
          existingId: state.film.existingId ?? undefined,
          updateId: state.film.action === "update" ? state.film.existingId ?? undefined : undefined,
        },
        submissions: activeSubs.map((r) => {
          const listPrice = r.listPrice ?? 0;
          const proportion = totalList > 0 ? listPrice / totalList : 0;
          const rowDiscount = discount * proportion;
          const estimatedFee = Math.max(0, listPrice - rowDiscount);
          return {
            festivalMasterId: r.selectedMasterId!,
            festivalName: r.festivalName,
            status: r.status,
            listPrice: r.listPrice,
            feesPaid: r.feesPaid,
            estimatedFee: listPrice > 0 ? Math.round(estimatedFee * 100) / 100 : null,
            notes: r.notes,
            deadline: r.deadline,
            notificationDate: r.notificationDate,
            eventDate: r.eventDate,
            externalId: r.externalId,
            submissionLink: r.submissionLink,
            prize: r.prize,
            location: r.location,
          };
        }),
        queue: activeQueue.map((r, i) => ({
          festivalMasterId: r.selectedMasterId!,
          priority: r.priority,
          position: i,
          eventDate: r.eventDate,
        })),
        dedupResolutions: state.submissions.dedupResolutions,
      };

      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Errore durante l'import", "error");
        dispatch({ type: "SAVING", saving: false });
        return;
      }

      const { summary } = await res.json();
      toast(
        `Import completato: ${summary.submissionsCreated} iscrizioni, ${summary.queueEntriesCreated} in coda`
      );
      router.push(`/films/${summary.filmId}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Errore di rete", "error");
      dispatch({ type: "SAVING", saving: false });
    }
  }, [
    state.film,
    state.submissions.rows,
    state.submissions.discount,
    state.submissions.dedupResolutions,
    state.queue.rows,
    router,
    toast,
  ]);

  // ──────────────────────────────────────────────
  // Nav
  // ──────────────────────────────────────────────

  const canAdvance = (() => {
    switch (state.step) {
      case 1:
        return state.film.action != null;
      case 2:
        return true; // anche se 0 iscrizioni va bene
      case 3:
        return true;
      default:
        return false;
    }
  })();

  const handleNext = () => {
    if (!canAdvance) {
      if (state.step === 1) {
        toast(
          "Scegli un'azione per il film prima di procedere",
          "error"
        );
      }
      return;
    }
    dispatch({
      type: "SET_STEP",
      step: Math.min(4, state.step + 1) as 1 | 2 | 3 | 4,
    });
  };

  const handleBack = () => {
    dispatch({
      type: "SET_STEP",
      step: Math.max(1, state.step - 1) as 1 | 2 | 3 | 4,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Import Wizard" />

      <ImportWizardStepper steps={WIZARD_STEPS} current={state.step} />

      <div className="mt-2">
        {state.step === 1 && (
          <StepFilm
            mode={state.film.mode}
            file={state.film.file}
            data={state.film.data}
            manualData={state.film.manualData}
            action={state.film.action}
            existingId={state.film.existingId}
            conflicts={state.film.conflicts}
            parsing={state.film.parsing}
            onModeChange={(m) => dispatch({ type: "FILM_MODE", mode: m })}
            onFile={(f) => dispatch({ type: "FILM_FILE", file: f })}
            onParse={parseFilmSheet}
            onResolveConflict={handleFilmResolveConflict}
            onSelectExisting={(f) =>
              dispatch({ type: "FILM_SELECT_EXISTING", film: f })
            }
            onManualChange={(patch) =>
              dispatch({ type: "FILM_MANUAL_PATCH", patch })
            }
            onManualCommit={handleManualCommit}
            onClearFilm={() => dispatch({ type: "FILM_CLEAR" })}
          />
        )}

        {state.step === 2 && (
          <StepSubmissions
            file={state.submissions.file}
            sheets={state.submissions.sheets}
            selectedSheets={state.submissions.selectedSheets}
            rows={state.submissions.rows}
            duplicates={state.submissions.duplicates}
            dedupResolutions={state.submissions.dedupResolutions}
            discount={state.submissions.discount}
            parsing={state.submissions.parsing}
            canSkipStep={true}
            onFile={(f) => dispatch({ type: "SUBS_FILE", file: f })}
            onLoadSheets={loadSubsSheets}
            onToggleSheet={(name, checked) =>
              dispatch({ type: "SUBS_TOGGLE_SHEET", name, checked })
            }
            onParse={parseSubs}
            onRowSelectMaster={(rowId, masterId) =>
              dispatch({ type: "SUBS_ROW_MASTER", rowId, masterId })
            }
            onRowCreated={(rowId, fm) =>
              dispatch({ type: "SUBS_ROW_CREATED", rowId, fm })
            }
            onRowEdit={(rowId, patch) =>
              dispatch({ type: "SUBS_ROW_EDIT", rowId, patch })
            }
            onRowRemove={(rowId) =>
              dispatch({ type: "SUBS_ROW_REMOVE", rowId })
            }
            onDedupResolve={(masterId, r) =>
              dispatch({
                type: "SUBS_DEDUP_RESOLVE",
                masterId,
                resolution: r,
              })
            }
            onDedupApplyAll={(r) =>
              dispatch({ type: "SUBS_DEDUP_APPLY_ALL", resolution: r })
            }
            onDiscountChange={(v) =>
              dispatch({ type: "SUBS_DISCOUNT", value: v })
            }
            onClearFile={() => dispatch({ type: "SUBS_CLEAR" })}
            onSkip={() =>
              dispatch({
                type: "SET_STEP",
                step: 3,
              })
            }
          />
        )}

        {state.step === 3 && (
          <StepQueue
            skipped={state.queue.skipped}
            file={state.queue.file}
            sheets={state.queue.sheets}
            selectedSheets={state.queue.selectedSheets}
            rows={state.queue.rows}
            parsing={state.queue.parsing}
            onFile={(f) => dispatch({ type: "QUEUE_FILE", file: f })}
            onLoadSheets={loadQueueSheets}
            onToggleSheet={(name, checked) =>
              dispatch({ type: "QUEUE_TOGGLE_SHEET", name, checked })
            }
            onParse={parseQueue}
            onSkip={(skipped) => dispatch({ type: "QUEUE_SKIP", skipped })}
            onRowSelectMaster={(rowId, masterId) =>
              dispatch({ type: "QUEUE_ROW_MASTER", rowId, masterId })
            }
            onRowCreated={(rowId, fm) =>
              dispatch({ type: "QUEUE_ROW_CREATED", rowId, fm })
            }
            onRowEdit={(rowId, patch) =>
              dispatch({ type: "QUEUE_ROW_EDIT", rowId, patch })
            }
            onRowRemove={(rowId) =>
              dispatch({ type: "QUEUE_ROW_REMOVE", rowId })
            }
            onClearFile={() => dispatch({ type: "QUEUE_CLEAR" })}
          />
        )}

        {state.step === 4 && (
          <StepConferma
            state={state}
            saving={state.saving}
            onCommit={handleCommit}
          />
        )}
      </div>

      {/* Navigation */}
      <div
        className="flex justify-between pt-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        {state.step > 1 ? (
          <button type="button" className="btn" onClick={handleBack}>
            Indietro
          </button>
        ) : (
          <div />
        )}

        {state.step < 4 && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
            disabled={!canAdvance}
          >
            Avanti
          </button>
        )}
      </div>
    </div>
  );
}
