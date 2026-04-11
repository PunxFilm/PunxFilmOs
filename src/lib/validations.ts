import { z } from "zod";

// Film
export const filmCreateSchema = z.object({
  titleOriginal: z.string().min(1, "Titolo obbligatorio"),
  titleInternational: z.string().optional(),
  director: z.string().min(1, "Regista obbligatorio"),
  directors: z.string().optional(),
  producers: z.string().optional(),
  crew: z.string().optional(),
  cast: z.string().optional(),
  year: z.number().int().min(1900).max(2100),
  duration: z.number().min(0.01, "Durata obbligatoria"),
  genre: z.string().min(1, "Genere obbligatorio"),
  subgenre: z.string().optional(),
  country: z.string().min(1, "Paese obbligatorio"),
  spokenLanguages: z.string().optional(),
  subtitleLanguages: z.string().optional(),
  synopsisShortIt: z.string().optional(),
  synopsisShortEn: z.string().optional(),
  synopsisLongIt: z.string().optional(),
  synopsisLongEn: z.string().optional(),
  premiereStatus: z.string().optional(),
  status: z.enum(["onboarding", "in_distribuzione", "active", "archived", "completed"]).default("onboarding"),
  shootingFormat: z.string().optional(),
  soundFormat: z.string().optional(),
  aspectRatio: z.string().optional(),
  musicRights: z.string().optional(),
  screenerLink: z.string().optional(),
  screenerPassword: z.string().optional(),
  screenerPrivate: z.boolean().optional(),
  posterUrl: z.string().optional(),
  officialWebsite: z.string().optional(),
  socialMediaLinks: z.string().optional(),
  ownerEmail: z.string().optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
  tags: z.string().optional(),
});
export const filmUpdateSchema = filmCreateSchema.partial();

// Festival
export const festivalCreateSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  country: z.string().min(1, "Paese obbligatorio"),
  city: z.string().min(1, "Città obbligatoria"),
  category: z.enum(["A-list", "B-list", "Niche", "Regional"]),
  deadlineGeneral: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  deadlineEarly: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  feesAmount: z.number().optional(),
  feesCurrency: z.string().default("EUR"),
  website: z.string().optional(),
  notes: z.string().optional(),
  // Campi per matching AI
  specialization: z.string().optional(),
  acceptedFormats: z.string().optional(),
  durationMin: z.number().int().optional(),
  durationMax: z.number().int().optional(),
  themes: z.string().optional(),
  premiereRequirement: z.enum(["world_premiere", "international_premiere", "national_premiere", "none"]).optional(),
  festivalStartDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  festivalEndDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  selectionHistory: z.string().optional(),
  acceptedLanguages: z.string().optional(),
});
export const festivalUpdateSchema = festivalCreateSchema.partial();

// Submission
export const submissionCreateSchema = z.object({
  filmId: z.string().min(1),
  festivalEditionId: z.string().min(1),
  status: z.enum(["draft", "submitted", "accepted", "rejected", "withdrawn"]).default("draft"),
  platform: z.string().optional(),
  submittedAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  feesPaid: z.number().optional(),
  result: z.string().optional(),
  notes: z.string().optional(),
});
export const submissionUpdateSchema = submissionCreateSchema.partial();

// Distribution Plan
export const distributionPlanCreateSchema = z.object({
  filmId: z.string().min(1),
  premiereLevel: z.enum(["world", "international", "european", "national"]),
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  aiAnalysis: z.string().optional(),
});
export const distributionPlanUpdateSchema = distributionPlanCreateSchema.partial();

// Plan Entry
export const planEntryCreateSchema = z.object({
  festivalMasterId: z.string().min(1),
  festivalEditionId: z.string().nullish(),
  role: z.enum(["premiere", "queue"]),
  position: z.number().int().min(0),
  status: z.enum(["pending", "approved", "rejected", "subscribed"]).default("pending"),
  priority: z.enum(["A", "B", "C"]).nullish(),
  matchScore: z.number().min(0).max(100).nullish(),
  matchReasoning: z.string().nullish(),
  waiverApplied: z.boolean().nullish(),
  waiverCode: z.string().nullish(),
  estimatedFee: z.number().nullish(),
});

export const planEntryUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "approved", "rejected", "subscribed"]).optional(),
  position: z.number().int().min(0).optional(),
});

// Task
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Titolo obbligatorio"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  filmId: z.string().optional(),
  submissionId: z.string().optional(),
});
export const taskUpdateSchema = taskCreateSchema.partial();

// Finance
export const financeCreateSchema = z.object({
  type: z.enum(["expense", "income"]),
  category: z.enum(["submission_fee", "travel", "award", "screening_fee", "other"]),
  amount: z.number().min(0),
  currency: z.string().default("EUR"),
  description: z.string().optional(),
  date: z.string().transform((v) => new Date(v)),
  filmTitle: z.string().optional(),
  festivalName: z.string().optional(),
});
export const financeUpdateSchema = financeCreateSchema.partial();
