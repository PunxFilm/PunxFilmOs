// Mapped to design-system tone classes: "", "accent", "ok", "warn", "info", "purple"
const tones: Record<string, string> = {
  // Submission / plan status
  draft: "",
  submitted: "info",
  accepted: "ok",
  rejected: "accent",
  withdrawn: "",
  // Task status
  todo: "",
  in_progress: "info",
  done: "ok",
  completed: "ok",
  // Priority
  high: "accent",
  medium: "warn",
  low: "",
  // Film status
  active: "ok",
  archived: "",
  // Finance
  expense: "accent",
  income: "ok",
  // Results
  official_selection: "purple",
  competition: "info",
  special_mention: "warn",
  award: "warn",
  // Plan entry / waiver request status
  pending: "warn",
  sent: "info",
  approved: "ok",
  expired: "",
  subscribed: "purple",
  // Premiere
  world: "accent",
  international: "info",
  european: "info",
  national: "",
  // Verification
  unverified: "",
  verified: "ok",
  needs_review: "warn",
  // Roles
  premiere: "warn",
  queue: "",
};

const labels: Record<string, string> = {
  draft: "Bozza",
  submitted: "Inviata",
  accepted: "Accettata",
  rejected: "Rifiutata",
  withdrawn: "Ritirata",
  todo: "Da fare",
  in_progress: "In corso",
  done: "Completato",
  high: "Alta",
  medium: "Media",
  low: "Bassa",
  active: "Attivo",
  archived: "Archiviato",
  expense: "Spesa",
  income: "Entrata",
  submission_fee: "Fee iscrizione",
  travel: "Viaggio",
  award: "Premio",
  screening_fee: "Fee proiezione",
  other: "Altro",
  "A-list": "A-list",
  "B-list": "B-list",
  Niche: "Niche",
  Regional: "Regionale",
  official_selection: "Selezione Ufficiale",
  competition: "Concorso",
  special_mention: "Menzione Speciale",
  pending: "Da valutare",
  sent: "Inviata",
  approved: "Approvato",
  expired: "Scaduta",
  subscribed: "Iscritto",
  unverified: "Non verificato",
  verified: "Verificato",
  needs_review: "Da rivedere",
  world: "World Premiere",
  international: "Int'l Premiere",
  european: "European Premiere",
  national: "National Premiere",
  premiere: "Premiere",
  queue: "Coda",
  completed: "Completata",
};

export function StatusBadge({ value }: { value: string }) {
  const tone = tones[value] ?? "";
  return <span className={`badge nb ${tone}`}>{labels[value] || value}</span>;
}
