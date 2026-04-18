import type { FilmSheetData } from "@/lib/import/film-sheet-parser";
import type { MatchCandidate } from "./festival-match-cell";
import type { DuplicateInfo } from "./dedup-dialog";

export type FilmMode = "upload" | "manual" | "search";
export type FilmAction = "create" | "update" | "existing" | null;

export interface ConflictFilm {
  id: string;
  titleOriginal: string;
  director: string;
  year: number;
  score: number;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  headers: string[];
}

export interface StrategyRowDraft {
  id: string; // local uuid
  externalId?: number | null;
  festivalName: string;
  deadline?: string | null;
  status?: string | null;
  notificationDate?: string | null;
  listPrice?: number | null;
  eventDate?: string | null;
  location?: string | null;
  prize?: string | null;
  submissionLink?: string | null;
  websiteLink?: string | null;
  notes?: string | null;
  feesPaid?: number | null;
  matches: MatchCandidate[];
  selectedMasterId: string | null;
  include: boolean;
}

export interface QueueRowDraft {
  id: string;
  festivalName: string;
  eventDate?: string | null;
  deadline?: string | null;
  matches: MatchCandidate[];
  selectedMasterId: string | null;
  include: boolean;
  priority?: string | null;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  film: {
    mode: FilmMode;
    file: File | null;
    data: FilmSheetData | null;
    action: FilmAction;
    existingId: string | null;
    conflicts: ConflictFilm[];
    manualData: Partial<FilmSheetData>;
    parsing: boolean;
  };
  submissions: {
    file: File | null;
    sheets: SheetInfo[];
    selectedSheets: string[];
    rows: StrategyRowDraft[];
    duplicates: DuplicateInfo[];
    dedupResolutions: Record<string, "update" | "skip" | "duplicate">;
    discount: number;
    parsing: boolean;
  };
  queue: {
    skipped: boolean;
    file: File | null;
    sheets: SheetInfo[];
    selectedSheets: string[];
    rows: QueueRowDraft[];
    parsing: boolean;
  };
  saving: boolean;
  errors: Record<string, string>;
}

export function makeInitialState(): WizardState {
  return {
    step: 1,
    film: {
      mode: "upload",
      file: null,
      data: null,
      action: null,
      existingId: null,
      conflicts: [],
      manualData: {},
      parsing: false,
    },
    submissions: {
      file: null,
      sheets: [],
      selectedSheets: [],
      rows: [],
      duplicates: [],
      dedupResolutions: {},
      discount: 0,
      parsing: false,
    },
    queue: {
      skipped: false,
      file: null,
      sheets: [],
      selectedSheets: [],
      rows: [],
      parsing: false,
    },
    saving: false,
    errors: {},
  };
}
