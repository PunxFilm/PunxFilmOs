// ──────────────────────────────────────────
// Festival Master & Edition Completeness Score
// ──────────────────────────────────────────

interface FieldGroup {
  name: string;
  weight: number;
  fields: { key: string; label: string }[];
  mode: "all" | "any"; // "all" = each field counted, "any" = at least one in group counts
}

interface CompletenessResult {
  score: number; // 0-100
  filledCount: number;
  totalCount: number;
  groups: {
    name: string;
    score: number; // 0-100 for this group
    filledFields: string[];
    missingFields: string[];
  }[];
}

// ──────────────────────────────────────────
// FESTIVAL MASTER
// ──────────────────────────────────────────

const MASTER_GROUPS: FieldGroup[] = [
  {
    name: "Identità",
    weight: 3,
    mode: "all",
    fields: [
      { key: "name", label: "Nome" },
      { key: "country", label: "Paese" },
      { key: "city", label: "Città" },
    ],
  },
  {
    name: "Classificazione",
    weight: 2,
    mode: "all",
    fields: [
      { key: "classification", label: "Classificazione" },
      { key: "type", label: "Tipo" },
    ],
  },
  {
    name: "Web & Piattaforma",
    weight: 2,
    mode: "any",
    fields: [
      { key: "website", label: "Sito web" },
      { key: "submissionUrlBase", label: "URL iscrizione" },
      { key: "submissionPlatform", label: "Piattaforma" },
    ],
  },
  {
    name: "Contatti",
    weight: 2,
    mode: "any",
    fields: [
      { key: "contactEmailInfo", label: "Email info" },
      { key: "contactEmailDirector", label: "Email direttore" },
      { key: "contactEmailTechnical", label: "Email tecnica" },
      { key: "contactName", label: "Nome contatto" },
    ],
  },
  {
    name: "Requisiti Film",
    weight: 1.5,
    mode: "all",
    fields: [
      { key: "maxMinutes", label: "Durata massima" },
      { key: "acceptedGenres", label: "Generi accettati" },
      { key: "acceptedThemes", label: "Temi" },
      { key: "focus", label: "Focus tematico" },
    ],
  },
  {
    name: "Qualificazioni",
    weight: 1,
    mode: "all",
    fields: [
      { key: "qualityScore", label: "Quality score" },
      { key: "punxRating", label: "PunxFilm rating" },
    ],
  },
  {
    name: "Proiezione",
    weight: 1,
    mode: "all",
    fields: [
      { key: "screeningType", label: "Tipo proiezione" },
      { key: "dcp", label: "DCP" },
    ],
  },
  {
    name: "Supporto",
    weight: 0.5,
    mode: "all",
    fields: [
      { key: "travelSupport", label: "Supporto viaggio" },
      { key: "hospitalitySupport", label: "Ospitalità" },
    ],
  },
  {
    name: "Verifica",
    weight: 1,
    mode: "all",
    fields: [
      { key: "verificationStatus_verified", label: "Stato verifica" },
    ],
  },
];

export function computeMasterCompleteness(master: Record<string, unknown>): CompletenessResult {
  let totalWeight = 0;
  let earnedWeight = 0;
  let filled = 0;
  let total = 0;
  const groups: CompletenessResult["groups"] = [];

  for (const group of MASTER_GROUPS) {
    const filledFields: string[] = [];
    const missingFields: string[] = [];

    if (group.mode === "any") {
      totalWeight += group.weight;
      total++;
      const anyFilled = group.fields.some((f) => isFilled(master, f.key));
      if (anyFilled) {
        earnedWeight += group.weight;
        filled++;
        group.fields.forEach((f) =>
          isFilled(master, f.key) ? filledFields.push(f.label) : missingFields.push(f.label)
        );
      } else {
        group.fields.forEach((f) => missingFields.push(f.label));
      }
      groups.push({
        name: group.name,
        score: anyFilled ? 100 : 0,
        filledFields,
        missingFields,
      });
    } else {
      let groupFilled = 0;
      for (const f of group.fields) {
        totalWeight += group.weight;
        total++;
        if (isFilled(master, f.key)) {
          earnedWeight += group.weight;
          filled++;
          groupFilled++;
          filledFields.push(f.label);
        } else {
          missingFields.push(f.label);
        }
      }
      groups.push({
        name: group.name,
        score: group.fields.length > 0 ? Math.round((groupFilled / group.fields.length) * 100) : 100,
        filledFields,
        missingFields,
      });
    }
  }

  return {
    score: totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0,
    filledCount: filled,
    totalCount: total,
    groups,
  };
}

// ──────────────────────────────────────────
// FESTIVAL EDITION
// ──────────────────────────────────────────

const EDITION_GROUPS: FieldGroup[] = [
  {
    name: "Identificazione",
    weight: 3,
    mode: "all",
    fields: [{ key: "year", label: "Anno" }],
  },
  {
    name: "Deadline",
    weight: 2.5,
    mode: "any",
    fields: [
      { key: "deadlineEarly", label: "Deadline early" },
      { key: "deadlineGeneral", label: "Deadline generale" },
      { key: "deadlineLate", label: "Deadline late" },
      { key: "deadlineFinal", label: "Deadline finale" },
    ],
  },
  {
    name: "Fee",
    weight: 2,
    mode: "all",
    fields: [{ key: "feeAmount", label: "Importo fee" }],
  },
  {
    name: "Date Evento",
    weight: 1.5,
    mode: "all",
    fields: [
      { key: "eventStartDate", label: "Inizio evento" },
      { key: "eventEndDate", label: "Fine evento" },
    ],
  },
  {
    name: "Notifica",
    weight: 1,
    mode: "all",
    fields: [{ key: "notificationDate", label: "Data notifica" }],
  },
  {
    name: "Regole",
    weight: 1,
    mode: "all",
    fields: [
      { key: "premiereRules", label: "Regole premiere" },
      { key: "durationRules", label: "Regole durata" },
    ],
  },
  {
    name: "Premi",
    weight: 0.5,
    mode: "any",
    fields: [
      { key: "prizeCash", label: "Premio in denaro" },
      { key: "prizeDescription", label: "Descrizione premi" },
    ],
  },
];

export function computeEditionCompleteness(edition: Record<string, unknown>): CompletenessResult {
  let totalWeight = 0;
  let earnedWeight = 0;
  let filled = 0;
  let total = 0;
  const groups: CompletenessResult["groups"] = [];

  for (const group of EDITION_GROUPS) {
    const filledFields: string[] = [];
    const missingFields: string[] = [];

    if (group.mode === "any") {
      totalWeight += group.weight;
      total++;
      const anyFilled = group.fields.some((f) => isFilled(edition, f.key));
      if (anyFilled) {
        earnedWeight += group.weight;
        filled++;
        group.fields.forEach((f) =>
          isFilled(edition, f.key) ? filledFields.push(f.label) : missingFields.push(f.label)
        );
      } else {
        group.fields.forEach((f) => missingFields.push(f.label));
      }
      groups.push({ name: group.name, score: anyFilled ? 100 : 0, filledFields, missingFields });
    } else {
      let groupFilled = 0;
      for (const f of group.fields) {
        totalWeight += group.weight;
        total++;
        if (isFilled(edition, f.key)) {
          earnedWeight += group.weight;
          filled++;
          groupFilled++;
          filledFields.push(f.label);
        } else {
          missingFields.push(f.label);
        }
      }
      groups.push({
        name: group.name,
        score: group.fields.length > 0 ? Math.round((groupFilled / group.fields.length) * 100) : 100,
        filledFields,
        missingFields,
      });
    }
  }

  return {
    score: totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0,
    filledCount: filled,
    totalCount: total,
    groups,
  };
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

function isFilled(obj: Record<string, unknown>, key: string): boolean {
  // Special case: verificationStatus_verified checks if status is not "unverified"
  if (key === "verificationStatus_verified") {
    return obj.verificationStatus !== undefined && obj.verificationStatus !== "unverified";
  }
  // Special case: boolean fields — consider explicitly set "true" as filled
  if (key === "dcp" || key === "industry" || key === "acceptsFirstWork") {
    return obj[key] === true;
  }
  const val = obj[key];
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "number") return val > 0;
  if (typeof val === "boolean") return true; // boolean is always "filled" if present
  return true;
}

export function getCompletenessColor(score: number): string {
  if (score >= 70) return "emerald";
  if (score >= 40) return "amber";
  return "red";
}

export type { CompletenessResult };
