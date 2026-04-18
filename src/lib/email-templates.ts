/**
 * Generatore mailto: URL per contattare festival.
 * Supporta bilingue IT/EN in base al paese del festival.
 */

export interface EmailFestival {
  name: string;
  country: string;
  contactEmailInfo: string | null;
}

export interface EmailEdition {
  year: number;
}

export interface EmailFilm {
  titleOriginal: string;
  director: string;
  year: number;
  duration: number;
  genre: string | null;
}

const ITALIAN_COUNTRIES = ["italia", "italy"];

function isItalianFestival(country: string): boolean {
  return ITALIAN_COUNTRIES.includes(country.trim().toLowerCase());
}

function buildBodyIT(
  festival: EmailFestival,
  edition: EmailEdition,
  film: EmailFilm | null
): string {
  const filmBlock = film
    ? `\n\nVorremmo sottoporre alla Vostra attenzione il cortometraggio "${film.titleOriginal}" di ${film.director} (${film.year}, ${Math.round(film.duration)} minuti${film.genre ? `, ${film.genre}` : ""}).\n\nVi prego di farmi sapere tempistiche e requisiti specifici per la submission.`
    : "\n\nVorrei informazioni sulle modalità di submission per l'edizione in corso.";

  return `Gentile team di ${festival.name},

mi chiamo Simone Rossi, fondatore di PunxFilm, distribuzione di cortometraggi.
Scrivo per avere informazioni sulla submission per l'edizione ${edition.year} del vostro festival.${filmBlock}

Cordiali saluti,
Simone Rossi
PunxFilm — simone.rossi121@gmail.com`;
}

function buildBodyEN(
  festival: EmailFestival,
  edition: EmailEdition,
  film: EmailFilm | null
): string {
  const filmBlock = film
    ? `\n\nWe would like to submit "${film.titleOriginal}" by ${film.director} (${film.year}, ${Math.round(film.duration)} min${film.genre ? `, ${film.genre}` : ""}) for your consideration.\n\nPlease let me know the timing and any specific submission requirements.`
    : "\n\nI would like information about submission opportunities for the upcoming edition.";

  return `Dear ${festival.name} team,

My name is Simone Rossi, founder of PunxFilm short film distribution.
I'm writing to inquire about submission for your ${edition.year} edition.${filmBlock}

Best regards,
Simone Rossi
PunxFilm — simone.rossi121@gmail.com`;
}

export function buildFestivalContactMailto(
  festival: EmailFestival,
  edition: EmailEdition,
  film: EmailFilm | null = null
): string | null {
  if (!festival.contactEmailInfo) return null;

  const useItalian = isItalianFestival(festival.country);
  const subject = useItalian
    ? `Submission ${festival.name} ${edition.year} - PunxFilm`
    : `Submission inquiry: ${festival.name} ${edition.year} - PunxFilm`;
  const body = useItalian
    ? buildBodyIT(festival, edition, film)
    : buildBodyEN(festival, edition, film);

  const params = new URLSearchParams({
    subject,
    body,
  });

  // Email multipli separati da "; " o "," — passo tutto al client mail
  const to = festival.contactEmailInfo
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter(Boolean)
    .join(",");

  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

/**
 * Estrae la prima email valida da un campo comma/semicolon separated.
 */
export function primaryEmail(contact: string | null | undefined): string | null {
  if (!contact) return null;
  const first = contact.split(/[;,]/)[0]?.trim();
  return first && first.includes("@") ? first : null;
}
