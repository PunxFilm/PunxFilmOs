# PunxFilm OS — Report Mattutino
**Data:** 11 Aprile 2026 | **Giorno:** Sabato
**Generato da:** Direttore Generale AI

---

## DASHBOARD RAPIDO

| Metrica | Valore | Note |
|---------|--------|------|
| Film in database | 7 | 1 in distribuzione, 6 in onboarding |
| Festival Master | 1.772 | 1.762 non verificati |
| Edizioni Festival | 368 | |
| Submission totali | 0 | Nessuna submission avviata |
| Piani distribuzione | 0 | Nessun piano attivo |
| Task aperte | 0 | |
| Spese totali | €0 | Nessuna voce finanziaria |
| Entrate totali | €0 | Nessuna voce finanziaria |

---

## 1. REPARTO SCOUTING & FESTIVAL

### Situazione
Il database festival è ampiamente popolato con **1.772 festival master** e **368 edizioni**. Tuttavia, la situazione della verifica è critica: **1.762 festival su 1.772 (99,4%)** risultano non verificati o in attesa di aggiornamento AI (`verificationStatus != 'verified'` oppure `needsAiRefresh = 1`). Questo rappresenta un backlog di verifica molto consistente che limita l'affidabilità dei dati.

### Deadline Imminenti (0–7 giorni)
Nessuna deadline imminente nei prossimi 7 giorni. Il campo `activeDeadlineDate` non risulta valorizzato per le edizioni correnti, o le edizioni non hanno deadline attive in questo periodo.

### Prossime Scadenze (8–14 giorni)
Nessuna scadenza segnalata nella finestra 8–14 giorni.

> ⚠️ **Nota DG:** L'assenza totale di deadline attive suggerisce che le edizioni festival potrebbero non essere state aggiornate con le date 2026. È prioritario verificare se le `FestivalEdition` esistenti nel DB rispecchiano l'anno corrente o sono dati storici.

### Azioni Pianificate
- Verificare la data delle edizioni festival esistenti (anno di riferimento)
- Avviare un batch di refresh AI sui 1.762 festival non verificati (a partire dai più rilevanti per `qualityScore` o `punxRating`)
- Popolare `activeDeadlineDate` per le edizioni 2025/2026 dove mancante

---

## 2. REPARTO DISTRIBUZIONE & SUBMISSION

### Situazione
La situazione distribuzione è al punto zero operativo: **0 submission, 0 piani di distribuzione attivi**. L'unico film in stato `in_distribuzione` è **FEDELI ALLA LINEA**, ma non ha ancora un piano di distribuzione associato. Gli altri 6 film sono in fase di onboarding e non sono ancora pronti per la distribuzione.

### Film Senza Piano di Distribuzione

| Film | Status |
|------|--------|
| FEDELI ALLA LINEA | `in_distribuzione` — **PRIORITÀ ALTA: nessun piano** |

### Film in Onboarding (non ancora in distribuzione)

| Film | Status |
|------|--------|
| La casa di Barbi | onboarding |
| Hold on | onboarding |
| ALLA SVIZZERA | onboarding |
| LA BUONA CONDOTTA | onboarding |
| L'Incredibile Storia di Paolo Riva | onboarding |
| LA TRUFFA | onboarding |

### Risultati Recenti (ultimi 7 giorni)
Nessuna submission accettata o rifiutata negli ultimi 7 giorni.

### Azioni Pianificate
- **Urgente:** Creare un piano di distribuzione per FEDELI ALLA LINEA
- Completare l'onboarding dei 6 film restanti e identificare quelli pronti per la distribuzione
- Avviare le prime submission non appena i piani saranno definiti

---

## 3. REPARTO DEV & OPS

### Situazione
Il controllo TypeScript ha rilevato **errori di compilazione** che impedirebbero una build pulita. NPM Outdated non è stato verificabile a causa di un errore 403 sul registry (accesso bloccato in ambiente sandbox).

### Problemi Trovati

**Errori TypeScript critici (25 errori):**

I file principali con errori sono:

- **`src/app/api/festivals/route.ts`** e **`src/app/api/festivals/[id]/route.ts`**: usano `prisma.festival` che non esiste — il modello nel Prisma schema si chiama `FestivalMaster`, non `festival`. Vanno aggiornati i riferimenti al client Prisma.
- **`src/app/api/seed/route.ts`**: stesso problema su `prisma.festival`. Inoltre usa campi obsoleti:
  - `title` invece di `titleOriginal` per il modello Film
  - `festivalId` invece di `festivalEditionId` o la relazione corretta per `PlanEntry` e `Submission`
- **`src/app/layout.tsx`**: impossibile trovare il modulo `./globals.css` (side-effect import). Il file CSS potrebbe mancare o il percorso è errato.

**Classificazione impatto:**
- `festivals/route.ts` e `festivals/[id]/route.ts`: endpoint API festival non funzionanti in produzione
- `seed/route.ts`: script di seed non eseguibile, probabilmente già deprecato
- `layout.tsx`: potrebbe causare problemi visivi ma non blocca necessariamente il runtime

### Azioni Pianificate
- **Fix urgente:** Aggiornare `prisma.festival` → `prisma.festivalMaster` in tutti i file API
- Verificare la presenza di `globals.css` e correggere il path in `layout.tsx`
- Revisionare `seed/route.ts` per allinearlo allo schema Prisma attuale (o deprecarlo definitivamente)
- Rieseguire `npx tsc --noEmit` dopo i fix per confermare build pulita

---

## 4. REPARTO AI & STRATEGY

### Situazione
Non ci sono dati diretti sulle performance degli endpoint AI (nessun log di utilizzo, nessuna metrica di costo nel database). Il sistema è comunque strutturato per supportare refresh AI dei festival (`needsAiRefresh`, `dataConfidenceScore`, `verificationNotes`), indicando un'infrastruttura AI predisposta ma con backlog enorme.

### Miglioramenti Suggeriti
- Implementare un **batch job prioritizzato** per il refresh AI: partire dai festival con `punxRating` più alto o con `dataConfidenceScore` più basso per massimizzare l'impatto
- Considerare un sistema di logging delle chiamate AI per monitorare costi e qualità degli output
- Il campo `verificationNotes` potrebbe essere sfruttato per tracciare la qualità degli output AI per singolo festival

### Azioni Pianificate
- Definire una strategia di prioritizzazione per i 1.762 festival da aggiornare
- Verificare che gli endpoint AI esistenti siano funzionanti (una volta risolti i bug TypeScript)

---

## 5. REPARTO FINANCE

### Situazione
Il modulo finanziario non ha ancora dati: **0 voci in FinanceEntry**. Non è possibile calcolare budget speso, entrate o ROI per film.

### Dettaglio per Categoria
Nessun dato disponibile.

### Azioni Pianificate
- Inserire le prime voci di spesa (fee di iscrizione ai festival, costi di produzione materiali, ecc.)
- Definire la struttura delle categorie finanziarie da utilizzare (`type` in FinanceEntry)
- Collegare le spese ai film e ai piani di distribuzione per abilitare il tracking ROI

---

## 6. REPARTO QA & DATA QUALITY

### Situazione
Stato complessivamente misto: i dati di base (film, festival) sono presenti, ma la qualità e completezza restano critiche in diversi punti. Nessun materiale obbligatorio mancante risulta nel database, ma questo potrebbe riflettere semplicemente l'assenza di dati piuttosto che una situazione realmente completa.

### Problemi Trovati

- **1.762 festival non verificati** (99,4% del database) — qualità dati non garantita
- **FEDELI ALLA LINEA** è in stato `in_distribuzione` senza piano di distribuzione associato — inconsistenza operativa
- **Nessuna submission** creata nonostante almeno un film sia in distribuzione attiva
- **0 Task registrate** nel sistema — assenza di tracciamento attività
- **0 voci Finance** — impossibile valutare la salute finanziaria
- Gli **errori TypeScript** sugli endpoint API indicano che la verifica dati lato applicazione potrebbe non funzionare correttamente

### Task QA Aperte
Nessuna task aperta nel sistema (database Task vuoto).

### Azioni Pianificate
- Inserire le prime task operative nel sistema per tracciare il lavoro in corso
- Eseguire un audit manuale di almeno un campione rappresentativo di festival (es. top 50 per `punxRating`) per stimare la qualità reale del database
- Verificare che i materiali dei film in onboarding siano correttamente registrati in `FilmMaterial`

---

## DECISIONI IN ATTESA DI APPROVAZIONE

1. **Piano di distribuzione per FEDELI ALLA LINEA** — L'unico film in stato `in_distribuzione` non ha alcun piano. Serve una decisione su: quanti festival targettare, con quale budget, e su quale piattaforma di submission (FilmFreeway, Festhome, ecc.). **Raccomandazione DG:** Avviare immediatamente la creazione del piano concentrandosi su festival europei di qualità con `academyQualifying` o `efaQualifying`.

2. **Strategia di verifica festival** — Con 1.762 festival non verificati, serve decidere se: (a) lanciare un batch AI massiccio con i costi associati, (b) procedere per priorità basata su `punxRating`/`qualityScore`, o (c) verificare manualmente solo i festival più rilevanti. **Raccomandazione DG:** Opzione (b) — batch AI prioritizzato per i top 200 festival.

3. **Fix bug TypeScript** — Gli errori in `festivals/route.ts` bloccano le API festival. Serve decisione su chi gestisce il fix e quando. **Raccomandazione DG:** Fix urgente da completare entro 48 ore per non bloccare il workflow di scouting.

---

## PRIORITÀ DEL GIORNO

1. **[DEV OPS]** Fix TypeScript — correggere `prisma.festival` → `prisma.festivalMaster` negli endpoint API e verificare `globals.css` per ripristinare la build pulita

2. **[DISTRIBUZIONE]** Creare piano di distribuzione per FEDELI ALLA LINEA — è il film più avanzato nel ciclo e non ha ancora nessuna submission né piano

3. **[SCOUTING]** Verificare che le FestivalEdition nel DB siano aggiornate al 2026 e che `activeDeadlineDate` sia valorizzato correttamente per le edizioni attive

---

*Report generato automaticamente alle 09:00 del 11/04/2026 — Prossimo report domani.*
