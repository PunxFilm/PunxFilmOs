---
name: punxfilm-ai-enhancer
description: "Migliora e potenzia le funzionalità AI di PunxFilm OS: ottimizza prompt esistenti, crea nuovi endpoint di analisi, migliora il matching film-festival, aggiungi intelligence. Usa questa skill quando l'utente vuole migliorare i prompt AI, aggiungere nuove funzionalità di intelligenza artificiale, ottimizzare il ranking dei festival, migliorare le analisi film, o creare nuovi endpoint AI per PunxFilm."
---

# PunxFilm AI Enhancer

Skill per migliorare e potenziare le funzionalità AI di PunxFilm OS.

## Stato Attuale AI

L'app usa Claude (Anthropic SDK) con 3 endpoint:

### 1. Analisi Film (`/api/ai/analyze-film`)
- **Input**: Dati film (titolo, regista, anno, durata, genere, paese, lingua, sinossi)
- **Output**: `premiereLevel`, `reasoning`, `keyStrengths`, `targetAudience`
- **Scopo**: Raccomandare il livello di premiere ideale

### 2. Ranking Festival (`/api/ai/rank-festivals`)
- **Input**: Film + lista festival + premiere level target
- **Output**: Rankings con score 0-100, reasoning, warnings per ogni festival
- **Scopo**: Ordinare festival per compatibilità col film

### 3. Suggerimento Coda (`/api/ai/suggest-queue`)
- **Input**: Film + festival premiere + festival disponibili
- **Output**: Coda ordinata con score e reasoning
- **Scopo**: Costruire circuito post-premiere ottimale

I prompt sono in `src/lib/ai-prompts.ts`. L'interfaccia TypeScript:

```typescript
interface FilmData {
  title, director, year, duration, genre, country, language, synopsis
}
interface FestivalData {
  id, name, country, city, category, deadlineGeneral, feesAmount,
  specialization, acceptedFormats, durationMin, durationMax, themes,
  premiereRequirement, festivalStartDate, festivalEndDate,
  selectionHistory, acceptedLanguages
}
```

## Aree di Miglioramento Prompt

### Ottimizzazione Prompt Esistenti

**Film Analysis** - Miglioramenti possibili:
- Aggiungere peso alla filmografia del regista (se disponibile nel DB)
- Considerare budget di produzione come indicatore di ambizione
- Aggiungere campo `riskFactors` per segnalare potenziali problemi
- Considerare lo stato dei materiali (screener, DCP) come fattore di readiness
- Aggiungere `suggestedTimeline` con mesi ideali per iniziare la distribuzione

**Festival Ranking** - Miglioramenti possibili:
- Usare lo storico di PunxFilm (`punxHistory`) per personalizzare il ranking
- Considerare waiver disponibili (riduce costi → aumenta score)
- Aggiungere peso ai festival academy/bafta/efa qualifying
- Distinguere tra "buon match" e "raggiungibile" (fee troppo alte penalizzano)
- Incorporare il `qualityScore` del festival nel ranking

**Queue Suggestions** - Miglioramenti possibili:
- Considerare festival con scadenze realistiche dal punto di vista temporale
- Calcolare il budget totale della coda suggerita
- Suggerire raggruppamenti geografici per ridurre costi di viaggio
- Dare priorità a festival con premi in denaro se il budget è limitato

### Nuovi Endpoint AI Suggeriti

#### 4. Analisi Competitiva (`/api/ai/competitive-analysis`)
```typescript
// Analizza la competizione prevista per un film in un dato festival
Input: Film + FestivalEdition (con info su genere accettato, numero submission tipiche)
Output: {
  competitionLevel: "low" | "medium" | "high",
  reasoning: string,
  suggestedSections: string[], // sezioni del festival più adatte
  strengthsVsCompetition: string[]
}
```

#### 5. Material Readiness Check (`/api/ai/material-check`)
```typescript
// Verifica se i materiali del film sono pronti per un festival specifico
Input: Film (con materiali) + FestivalMaterialRequirement[]
Output: {
  readinessScore: number, // 0-100
  missingCritical: string[], // materiali mancanti obbligatori
  missingOptional: string[],
  suggestions: string[] // azioni consigliate
}
```

#### 6. Budget Optimizer (`/api/ai/budget-optimizer`)
```typescript
// Ottimizza il piano di distribuzione dato un budget
Input: Film + DistributionPlan + budgetMax
Output: {
  optimizedQueue: PlanEntry[], // riarrangiato per ROI
  totalEstimatedCost: number,
  expectedROI: string,
  cutSuggestions: string[] // festival da eliminare per risparmiare
}
```

#### 7. Timeline Planner (`/api/ai/timeline-planner`)
```typescript
// Genera timeline completa della distribuzione
Input: Film + DistributionPlan con entries
Output: {
  months: [{
    month: string,
    actions: string[], // cosa fare questo mese
    deadlines: string[], // scadenze imminenti
    festivals: string[] // festival in corso
  }]
}
```

## Come Implementare Miglioramenti

### Modifica Prompt Esistenti

1. Leggi `src/lib/ai-prompts.ts`
2. Modifica il system prompt e/o user prompt
3. Testa con diversi film dal database per verificare la qualità
4. Aggiorna i tipi TypeScript se cambia la struttura di output

### Nuovo Endpoint AI

1. Crea il prompt builder in `src/lib/ai-prompts.ts`
2. Crea la route in `src/app/api/ai/<nome>/route.ts`
3. Segui il pattern degli endpoint esistenti:
   ```typescript
   import Anthropic from "@anthropic-ai/sdk";
   import { buildXxxPrompt } from "@/lib/ai-prompts";
   
   const anthropic = new Anthropic();
   
   export async function POST(request: Request) {
     const body = await request.json();
     // Validate input
     const { system, user } = buildXxxPrompt(body);
     const message = await anthropic.messages.create({
       model: "claude-sonnet-4-20250514",
       max_tokens: 1024,
       system,
       messages: [{ role: "user", content: user }],
     });
     // Parse and return JSON
   }
   ```
4. Aggiorna la UI per utilizzare il nuovo endpoint

### Testing Prompt

Per testare i prompt, query il database per dati reali:

```bash
sqlite3 /sessions/loving-nifty-hamilton/mnt/punxfilm-os/dev.db \
  "SELECT titleOriginal, director, year, duration, genre, country FROM Film LIMIT 5;"
```

Poi simula la chiamata API o testa il prompt direttamente.

## Principi per Prompt Engineering in PunxFilm

- **Lingua**: I prompt system sono in italiano (target audience italiana)
- **Output**: Sempre JSON valido, senza markdown
- **Brevità**: Reasoning max 1-2 frasi per entry
- **Praticità**: I suggerimenti devono essere actionable, non teorici
- **Contesto**: Includere sempre dati reali dal database, non inventare
