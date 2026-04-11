interface FilmData {
  title: string;
  director: string;
  year: number;
  duration: number;
  genre: string;
  country: string;
  language: string;
  synopsis: string | null;
}

interface FestivalData {
  id: string;
  name: string;
  country: string;
  city: string;
  category: string;
  deadlineGeneral: string | null;
  feesAmount: number | null;
  specialization: string | null;
  acceptedFormats: string | null;
  durationMin: number | null;
  durationMax: number | null;
  themes: string | null;
  premiereRequirement: string | null;
  festivalStartDate: string | null;
  festivalEndDate: string | null;
  selectionHistory: string | null;
  acceptedLanguages: string | null;
}

export function buildFilmAnalysisPrompt(film: FilmData) {
  const system = `Sei un esperto strategist di distribuzione cinematografica per festival. Analizza il film fornito e raccomanda il livello di premiere ideale.

I livelli di premiere dalla più prestigiosa:
- "world": World Premiere — per film con potenziale internazionale eccezionale, adatti a festival A-list
- "international": International Premiere — per film forti ma non candidati a Cannes/Venezia/Berlino
- "european": European Premiere — per film con appeal europeo
- "national": National Premiere — per film con appeal principalmente nazionale o di nicchia

Considera: qualità stimata dalla sinossi, genere, durata (corti vs lungometraggi), paese di produzione, lingua, regista.

DEVI rispondere SOLO con JSON valido, senza markdown né testo aggiuntivo.`;

  const user = `Analizza questo film e suggerisci il livello di premiere ideale:

${JSON.stringify(film, null, 2)}

Rispondi in questo formato JSON esatto:
{
  "premiereLevel": "world" | "international" | "european" | "national",
  "reasoning": "spiegazione dettagliata in italiano della scelta",
  "keyStrengths": ["punto di forza 1", "punto di forza 2"],
  "targetAudience": "descrizione del pubblico target"
}`;

  return { system, user };
}

export function buildFestivalRankingPrompt(
  film: FilmData,
  festivals: FestivalData[],
  premiereLevel: string
) {
  const system = `Sei un esperto di matching film-festival. Rankea i festival forniti per compatibilità con il film, considerando che stiamo cercando un festival per una ${premiereLevel} premiere.

Criteri di valutazione (in ordine di importanza):
1. Specializzazione del festival vs genere del film
2. Durata del film nel range accettato dal festival
3. Categoria del festival adeguata al livello di premiere
4. Compatibilità geografica e linguistica
5. Requisiti di premiere del festival (es. se richiede World Premiere)
6. Fattibilità deadline (deadline non scaduta)
7. Temi del festival vs contenuto del film
8. Storico selezioni del festival

Score da 0 a 100. Aggiungi warnings per conflitti.

IMPORTANTE: Il reasoning deve essere BREVE (max 1 frase). I warnings devono essere stringhe brevi.
DEVI rispondere SOLO con JSON valido, senza markdown.`;

  const user = `Film:
${JSON.stringify(film)}

Livello premiere: ${premiereLevel}

Festival:
${JSON.stringify(festivals)}

JSON esatto:
{"rankings":[{"festivalId":"id","score":85,"reasoning":"1 frase breve","warnings":[]}]}

Ordina per compatibilità. Includi TUTTI. Reasoning max 1 frase.`;

  return { system, user };
}

export function buildQueueSuggestionsPrompt(
  film: FilmData,
  premiereFestival: FestivalData,
  availableFestivals: FestivalData[]
) {
  const system = `Sei un esperto di circuiti festivalieri. Costruisci la coda ottimale di festival post-premiere per questo film.

REGOLA FONDAMENTALE: I festival suggeriti devono avere date SUCCESSIVE alla premiere. Non suggerire festival che si svolgono prima o durante la premiere, perché brucerebbero l'anteprima.

Criteri per ordinare la coda:
1. Valore strategico (visibilità, networking, premi)
2. Compatibilità con il film (genere, durata, temi)
3. Diversificazione geografica (non troppi festival dello stesso paese consecutivi)
4. Fattibilità logistica (distanza temporale tra festival)
5. Costo/beneficio (fee vs valore del festival)

IMPORTANTE: Il reasoning deve essere BREVE (max 1 frase).
DEVI rispondere SOLO con JSON valido, senza markdown.`;

  const user = `Film:
${JSON.stringify(film)}

Premiere:
${JSON.stringify(premiereFestival)}

Festival disponibili (post-premiere):
${JSON.stringify(availableFestivals)}

JSON esatto:
{"queue":[{"festivalId":"id","score":75,"reasoning":"1 frase breve","warnings":[]}]}

Ordina per importanza strategica. Includi TUTTI. Reasoning max 1 frase.`;

  return { system, user };
}
