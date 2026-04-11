const colors: Record<string, string> = {
  // Submission status
  draft: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  submitted: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  // Task status
  todo: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
  // Priority
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  // Film status
  active: "bg-emerald-100 text-emerald-800",
  archived: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  // Finance
  expense: "bg-red-100 text-red-800",
  income: "bg-emerald-100 text-emerald-800",
  // Results
  official_selection: "bg-purple-100 text-purple-800",
  competition: "bg-blue-100 text-blue-800",
  special_mention: "bg-amber-100 text-amber-800",
  // Plan entry / waiver request status
  pending: "bg-amber-100 text-amber-800",
  sent: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  expired: "bg-gray-100 text-gray-600",
  subscribed: "bg-purple-100 text-purple-800",
  // Premiere levels
  world: "bg-indigo-100 text-indigo-800",
  international: "bg-blue-100 text-blue-800",
  european: "bg-teal-100 text-teal-800",
  national: "bg-slate-100 text-slate-700",
  // Verification status
  unverified: "bg-gray-100 text-gray-600",
  verified: "bg-emerald-100 text-emerald-800",
  needs_review: "bg-amber-100 text-amber-800",
  // Plan entry roles
  premiere: "bg-amber-100 text-amber-800",
  queue: "bg-[var(--muted)] text-[var(--muted-foreground)]",
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
  // Plan entry / waiver request status
  pending: "Da valutare",
  sent: "Inviata",
  approved: "Approvato",
  expired: "Scaduta",
  subscribed: "Iscritto",
  // Verification
  unverified: "Non verificato",
  verified: "Verificato",
  needs_review: "Da rivedere",
  // Premiere levels
  world: "World Premiere",
  international: "Int'l Premiere",
  european: "European Premiere",
  national: "National Premiere",
  // Roles
  premiere: "Premiere",
  queue: "Coda",
  // Plan status
  completed: "Completata",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colors[value] || "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}
    >
      {labels[value] || value}
    </span>
  );
}
