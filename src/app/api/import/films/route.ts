import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE44_URL = "https://base44.app/api/apps/69b9e6cb2f507ecb5daf9a4f/entities/Film";
const BASE44_KEY = "b08e351b80aa415186fa279285fc0f3a";

export async function POST() {
  try {
    const res = await fetch(BASE44_URL, {
      headers: { api_key: BASE44_KEY, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Errore nel fetch da Base44" }, { status: 502 });
    }

    const films: Record<string, unknown>[] = await res.json();
    let imported = 0;
    let errors = 0;

    for (const f of films) {
      try {
        await prisma.film.upsert({
          where: { base44Id: f.id as string },
          update: mapFilm(f),
          create: { base44Id: f.id as string, ...mapFilm(f) },
        });
        imported++;
      } catch (e) {
        errors++;
        console.error(`Film import error (${f.title_original}):`, e);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Import completato: ${imported} film importati, ${errors} errori`,
      total: films.length,
      imported,
      errors,
    });
  } catch (e) {
    console.error("Import films error:", e);
    return NextResponse.json({ error: `Errore nell'import: ${e}` }, { status: 500 });
  }
}

function mapFilm(f: Record<string, unknown>) {
  return {
    titleOriginal: (f.title_original as string) || "Senza titolo",
    titleInternational: f.title_international as string | null,
    director: extractDirectorName(f.directors),
    directors: f.directors ? JSON.stringify(f.directors) : null,
    producers: f.producers ? JSON.stringify(f.producers) : null,
    crew: f.crew as string | null,
    cast: f.cast as string | null,
    year: Math.round((f.year as number) || new Date().getFullYear()),
    duration: (f.duration_minutes as number) || 0,
    genre: (f.genre as string) || "Non specificato",
    subgenre: f.subgenre as string | null,
    country: (f.country as string) || "Italia",
    spokenLanguages: Array.isArray(f.spoken_languages) ? (f.spoken_languages as string[]).join(",") : null,
    subtitleLanguages: Array.isArray(f.subtitle_languages) ? (f.subtitle_languages as string[]).join(",") : null,
    synopsisShortIt: f.synopsis_short_it as string | null,
    synopsisShortEn: f.synopsis_short_en as string | null,
    synopsisLongIt: f.synopsis_long_it as string | null,
    synopsisLongEn: f.synopsis_long_en as string | null,
    premiereStatus: f.premiere_status as string | null,
    status: (f.status as string) || "onboarding",
    shootingFormat: f.shooting_format as string | null,
    soundFormat: f.sound_format as string | null,
    aspectRatio: f.aspect_ratio as string | null,
    musicRights: f.music_rights as string | null,
    screenerLink: f.screener_link as string | null,
    screenerPassword: f.screener_password as string | null,
    screenerPrivate: (f.screener_private as boolean) || false,
    posterUrl: f.poster_url as string | null,
    officialWebsite: f.official_website as string | null,
    socialMediaLinks: Array.isArray(f.social_media_links) ? JSON.stringify(f.social_media_links) : null,
    ownerEmail: f.owner_email as string | null,
    internalNotes: f.internal_notes as string | null,
    clientNotes: f.client_notes as string | null,
    tags: Array.isArray(f.tags) ? (f.tags as string[]).join(",") : null,
  };
}

function extractDirectorName(directors: unknown): string {
  if (Array.isArray(directors) && directors.length > 0) {
    return (directors[0] as { name?: string }).name || "Sconosciuto";
  }
  return "Sconosciuto";
}
