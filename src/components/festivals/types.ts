import type { FilmContext } from "@/lib/film-festival-match";

export type { FilmContext };

export interface EditionListItem {
  id: string;
  year: number;
  editionNumber: number | null;
  activeDeadlineDate: string | null;
  activeDeadlineType: string | null;
  daysToDeadline: number | null;
  feeAmount: number | null;
  feeCurrency: string;
  feeLateFee: number | null;
  prizeCash: number | null;
  prizeDescription: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  verificationStatus: string;
  festivalMaster: {
    id: string;
    name: string;
    city: string;
    country: string;
    classification: string | null;
    type: string | null;
    academyQualifying: boolean;
    baftaQualifying: boolean;
    efaQualifying: boolean;
    goyaQualifying: boolean;
    website: string | null;
    submissionPlatform: string | null;
    submissionUrlBase: string | null;
    contactEmailInfo: string | null;
    punxRating: number | null;
    qualityScore: number | null;
  };
  userContext: {
    hasActivePlan: boolean;
    hasSubmission: boolean;
    submissionStatus: string | null;
  };
  filmContext: FilmContext | null;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}
