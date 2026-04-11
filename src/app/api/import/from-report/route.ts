import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL, parseAIResponse } from "@/lib/ai";
import { readFile } from "fs/promises";
import { join } from "path";

const PROMPT = `Sei un assistente che estrae dati strutturati da report markdown di festival cinematografici.

Estrai TUTTI i festival dal testo fornito. Per ogni festival genera un oggetto JSON con questi campi:
- name: nome completo del festival
- city: città
- country: paese
- classification: "international" | "national" | "regional" | "local"
- category: "A-list" | "B-list" | "Niche" | "Regional" (usa la categoria indicata nel report)
- type: "short" | "mixed" | "feature" | "documentary" | "animation"
- website: URL sito web
- maxMinutes: durata massima accettata
- academyQualifying: true/false (se è Oscar qualifying)
- baftaQualifying: true/false
- efaQualifying: true/false
- contactEmail: email di contatto se presente
- submissionPlatform: "filmfreeway" | "festhome" | "shortfilmdepot" | "direct" | null
- notes: note aggiuntive brevi
- edition: oggetto con i dati dell'edizione corrente:
  - year: anno edizione
  - deadlineEarly: data deadline early (YYYY-MM-DD o null)
  - deadlineGeneral: data deadline regolare (YYYY-MM-DD o null)
  - eventStartDate: data inizio evento (YYYY-MM-DD o null)
  - eventEndDate: data fine evento (YYYY-MM-DD o null)
  - feeAmount: fee in EUR (numero o null)
  - feeCurrency: "EUR" | "GBP" | "USD"
  - premiereRules: regole premiere (testo o null)
  - prizeCash: importo premio principale in EUR (numero o null)
  - prizeDescription: descrizione premi

Rispondi ESCLUSIVAMENTE con JSON valido:
{"festivals": [...]}`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    let text = "";

    if (body?.filePath) {
      // Read from file path
      const fullPath = join(process.cwd(), body.filePath);
      text = await readFile(fullPath, "utf-8");
    } else if (body?.text) {
      text = body.text;
    } else {
      return NextResponse.json({ error: "Fornisci filePath o text" }, { status: 400 });
    }

    if (!text || text.length < 50) {
      return NextResponse.json({ error: "Testo troppo corto" }, { status: 400 });
    }

    // AI parsing
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 8192,
      system: PROMPT,
      messages: [{ role: "user", content: text.slice(0, 20000) }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Risposta AI non valida" }, { status: 500 });
    }

    const parsed = parseAIResponse<{
      festivals: Array<{
        name: string;
        city: string;
        country: string;
        classification?: string;
        category?: string;
        type?: string;
        website?: string;
        maxMinutes?: number;
        academyQualifying?: boolean;
        baftaQualifying?: boolean;
        efaQualifying?: boolean;
        contactEmail?: string;
        submissionPlatform?: string;
        notes?: string;
        edition?: {
          year: number;
          deadlineEarly?: string;
          deadlineGeneral?: string;
          eventStartDate?: string;
          eventEndDate?: string;
          feeAmount?: number;
          feeCurrency?: string;
          premiereRules?: string;
          prizeCash?: number;
          prizeDescription?: string;
        };
      }>;
    }>(content.text);

    // Insert into DB
    let created = 0;
    let updated = 0;
    let editionsCreated = 0;

    for (const f of parsed.festivals) {
      // Check if exists by exact name only
      const existing = await prisma.festivalMaster.findFirst({
        where: { name: { equals: f.name } },
      });

      let masterId: string;

      if (existing) {
        // Update
        await prisma.festivalMaster.update({
          where: { id: existing.id },
          data: {
            website: f.website || existing.website,
            maxMinutes: f.maxMinutes || existing.maxMinutes,
            academyQualifying: f.academyQualifying ?? existing.academyQualifying,
            baftaQualifying: f.baftaQualifying ?? existing.baftaQualifying,
            efaQualifying: f.efaQualifying ?? existing.efaQualifying,
            contactEmailInfo: f.contactEmail || existing.contactEmailInfo,
            submissionPlatform: f.submissionPlatform || existing.submissionPlatform,
            internalNotes: f.notes || existing.internalNotes,
          },
        });
        masterId = existing.id;
        updated++;
      } else {
        // Create
        const master = await prisma.festivalMaster.create({
          data: {
            name: f.name,
            city: f.city || "Sconosciuto",
            country: f.country || "Sconosciuto",
            classification: f.classification || "international",
            type: f.type || "short",
            website: f.website,
            maxMinutes: f.maxMinutes,
            academyQualifying: f.academyQualifying || false,
            baftaQualifying: f.baftaQualifying || false,
            efaQualifying: f.efaQualifying || false,
            contactEmailInfo: f.contactEmail,
            submissionPlatform: f.submissionPlatform,
            internalNotes: f.notes,
            isActive: true,
            verificationStatus: "verified",
          },
        });
        masterId = master.id;
        created++;
      }

      // Create edition if provided
      if (f.edition?.year) {
        const existingEdition = await prisma.festivalEdition.findFirst({
          where: { festivalMasterId: masterId, year: f.edition.year },
        });
        if (!existingEdition) {
          await prisma.festivalEdition.create({
            data: {
              festivalMasterId: masterId,
              festivalName: f.name,
              year: f.edition.year,
              deadlineEarly: f.edition.deadlineEarly ? new Date(f.edition.deadlineEarly) : null,
              deadlineGeneral: f.edition.deadlineGeneral ? new Date(f.edition.deadlineGeneral) : null,
              eventStartDate: f.edition.eventStartDate ? new Date(f.edition.eventStartDate) : null,
              eventEndDate: f.edition.eventEndDate ? new Date(f.edition.eventEndDate) : null,
              feeAmount: f.edition.feeAmount,
              feeCurrency: f.edition.feeCurrency || "EUR",
              premiereRules: f.edition.premiereRules,
              prizeCash: f.edition.prizeCash,
              prizeDescription: f.edition.prizeDescription,
              verificationStatus: "verified",
            },
          });
          editionsCreated++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Import completato: ${created} creati, ${updated} aggiornati, ${editionsCreated} edizioni create`,
      festivalsInReport: parsed.festivals.length,
      created,
      updated,
      editionsCreated,
    });
  } catch (e) {
    console.error("Import from report error:", e);
    return NextResponse.json({ error: `Errore: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
