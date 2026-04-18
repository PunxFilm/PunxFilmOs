# PunxFilm OS — Report Mattutino
**Data:** 14 Aprile 2026 | **Giorno:** Martedi
**Generato da:** Direttore Generale AI

---

## DASHBOARD RAPIDO

| Metrica | Valore | Note |
|---------|--------|------|
| Film in database | 0 | DB vuoto — schema migrato ma dati non presenti |
| Festival Master | 0 | Tabella FestivalMaster NON ESISTE nel DB |
| Edizioni Festival | 0 | Tabella FestivalEdition NON ESISTE nel DB |
| Submission totali | 0 | Tabella presente ma vuota |
| Piani distribuzione | 0 | Tabella DistributionPlan NON ESISTE nel DB |
| Task aperte | 0 | Nessuna task registrata |
| Spese totali | €0 | Nessuna voce finanziaria |
| Entrate totali | €0 | Nessuna voce finanziaria |

---

> **ALLARME CRITICO DEL DG:** Il database di produzione (`dev.db`) presenta un **disallineamento grave tra schema Prisma e struttura SQLite**. Il file `schema.prisma` definisce 13 modelli, ma il database contiene solo 7 tabelle dalla migrazione iniziale (`20260409144145_init`). Mancano 9 tabelle fondamentali. Tutti i dati dei 1.772 festival e 7 film riportati nel report dell'11/04 risultano assenti. Questo potrebbe indicare un reset accidentale del database o una migrazione non applicata.

---

## 1. REPARTO SCOUTING & FESTIVAL

### Situazione
**CRITICO:** Le tabelle `FestivalMaster` e `FestivalEdition` non esistono nel database SQLite corrente. Il database contiene solo una tabella `Festival` (vecchio schema semplificato) con 0 record. Il report dell'11 aprile riportava 1.772 festival master e 368 edizioni: questi dati sono andati persi o il database e stato resettato.

### Deadline Imminenti (0-7 giorni)
Nessuna deadline — il database festival e vuoto.

### Prossime Scadenze (8-14 giorni)
Nessuna scadenza.

### Azioni Pianificate
- **URGENTE:** Verificare cosa e successo al database tra l'11 e il 14 aprile
- Controllare se esiste un backup del `dev.db` precedente
- Eseguire `npx prisma migrate deploy` per allineare lo schema SQLite al Prisma schema
- Ri-importare i dati festival se disponibili in backup o export

---

## 2. REPARTO DISTRIBUZIONE & SUBMISSION

### Situazione
La tabella `Submission` esiste nel database ma e vuota (0 record). Le tabelle `DistributionPlan` e `PlanEntry` non esistono — fanno parte del nuovo schema non ancora migrato. Nessuna submission attiva, nessun piano di distribuzione creabile.

### Film Senza Piano
Nessun film presente nel database. La tabella `Film` (vecchio schema) esiste ma ha 0 record.

### Risultati Recenti
Nessun risultato da segnalare.

### Azioni Pianificate
- Attendere il ripristino del database prima di qualsiasi operazione distribuzione
- Preparare la ri-creazione dei piani distribuzione dopo il ripristino
- Verificare se i 7 film precedenti (incluso "Fedeli alla Linea") sono recuperabili

---

## 3. REPARTO DEV OPS

### Situazione
La salute tecnica del codebase e **critica**. Si rilevano problemi su piu fronti:

**Errori TypeScript:** 48 errori di compilazione trovati con `tsc --noEmit`.

**Problemi principali identificati:**
- Le API routes (`src/app/api/festivals/`, `src/app/api/seed/`) referenziano `prisma.festival` (minuscolo, vecchio modello) che non corrisponde ne al vecchio schema DB ne al nuovo schema Prisma (`FestivalMaster`)
- Il file `seed/route.ts` usa campi obsoleti: `title` invece di `titleOriginal` per Film, `festivalId` invece di `festivalEditionId` per Submission e PlanEntry
- Il tipo `waiverApplied` ha un conflitto nullable (`boolean | null` vs `boolean`)
- Errore CSS: `globals.css` non trovato come modulo tipizzato

**Dipendenze:** Impossibile verificare `npm outdated` — accesso al registry npm bloccato (403 Forbidden su `@anthropic-ai/sdk`).

### Problemi Trovati

| Categoria | File | Errore |
|-----------|------|--------|
| Schema mismatch | `api/festivals/[id]/route.ts` | `prisma.festival` non esiste |
| Schema mismatch | `api/festivals/route.ts` | `prisma.festival` non esiste |
| Schema mismatch | `api/seed/route.ts` | `prisma.festival` non esiste + campi obsoleti |
| Type error | Submission | `waiverApplied` tipo incompatibile |
| CSS module | `app/layout.tsx` | `globals.css` non trovato |

### Azioni Pianificate
- **PRIORITA 1:** Allineare il database allo schema Prisma con `npx prisma migrate dev`
- **PRIORITA 2:** Aggiornare tutte le API routes per usare i nuovi nomi modello (`festivalMaster`, `festivalEdition` invece di `festival`)
- **PRIORITA 3:** Aggiornare `seed/route.ts` con i campi corretti del nuovo schema
- Risolvere il conflitto di tipo su `waiverApplied` (rendere non-nullable nello schema o gestire null nelle API)
- Verificare e risolvere l'import CSS in `layout.tsx`

---

## 4. REPARTO AI & STRATEGY

### Situazione
Le funzionalita AI non sono operative per mancanza di dati nel database. Le tabelle `Strategy` (vecchio schema) e `DistributionPlan` (nuovo schema, non creata) sono entrambe vuote/assenti. Non e possibile valutare la qualita degli output AI senza dati su cui operare.

### Miglioramenti Suggeriti
- Prioritizzare il ripristino dati prima di qualsiasi lavoro AI
- Una volta ripristinato il DB, verificare che il campo `aiAnalysis` in `DistributionPlan` sia correttamente popolabile
- Valutare l'aggiunta di logging per tracciare i costi API

### Azioni Pianificate
- In standby fino al ripristino del database e allineamento schema

---

## 5. REPARTO FINANCE

### Situazione
La tabella `FinanceEntry` esiste ma e vuota (0 record). Nessuna spesa o entrata registrata. Bilancio a zero.

### Dettaglio per Categoria
Nessun dato finanziario presente.

### Azioni Pianificate
- Dopo il ripristino del database, verificare se esistevano voci finanziarie nel backup
- Impostare il tracking delle fee di submission come prima voce di spesa

---

## 6. REPARTO QA & DATA QUALITY

### Situazione
**CRITICO — Disallineamento Schema/Database.**

Il problema piu grave emerso da questo audit e il disallineamento totale tra:
- **Schema Prisma** (`schema.prisma`): 13 modelli definiti, schema ricco e dettagliato
- **Database SQLite** (`dev.db`): solo 7 tabelle dal vecchio schema iniziale, tutte vuote

**Tabelle presenti nel DB ma assenti dallo schema attuale:** `Festival`, `Strategy` (vecchi modelli)

**Tabelle definite nello schema Prisma ma ASSENTI dal DB:**
1. `Person`
2. `DistributionContract`
3. `FilmMaterial`
4. `FestivalMaster`
5. `FestivalEdition`
6. `FestivalMaterialRequirement`
7. `DistributionPlan`
8. `PlanEntry`
9. `WaiverRequest`

**Migrazioni applicate:** Solo 1 (`20260409144145_init`). La seconda migrazione (`20260409150919_add_indexes`) presente nella cartella migrations non risulta applicata nel DB.

### Problemi Trovati
1. Il database e stato probabilmente resettato o ricreato senza applicare la migrazione completa
2. I 1.772 festival master e i 7 film del report 11/04 sono scomparsi
3. Le API non possono funzionare perche referenziano modelli inesistenti nel DB
4. Il Prisma Client generato potrebbe non corrispondere allo stato reale del database

### Task QA Aperte
Nessuna task formale registrata (tabella Task vuota).

### Azioni Pianificate
- Verificare l'esistenza di backup del `dev.db` precedente (data 11/04 o anteriore)
- Eseguire `npx prisma migrate deploy` o `npx prisma db push` per creare le tabelle mancanti
- Rigenerare il Prisma Client con `npx prisma generate`
- Dopo l'allineamento schema, eseguire un seed o re-import dei dati festival

---

## DECISIONI IN ATTESA DI APPROVAZIONE

1. **Ripristino database:** Il `dev.db` attuale sembra essere stato resettato. Simone, vuoi che: (a) cerchi un backup del DB precedente, (b) ri-esegua le migrazioni Prisma per creare le tabelle mancanti e poi ri-importi i dati, oppure (c) entrambe le cose? **Raccomandazione DG:** Cercare prima un backup, poi comunque riallineare lo schema.

2. **Refactoring API routes:** Le routes `api/festivals/` e `api/seed/` usano il vecchio modello `festival` (minuscolo). Autorizzo il refactoring per allinearle ai nuovi modelli `FestivalMaster`/`FestivalEdition`? **Raccomandazione DG:** Si, e urgente per rendere l'app funzionante.

3. **Strategia di recupero dati:** Se il backup non esiste, autorizzo una nuova importazione batch dei festival da Base44 (se la fonte originale e ancora disponibile)? **Raccomandazione DG:** Si, ma con priorita al recupero backup.

---

## PRIORITA' DEL GIORNO

1. **[DEV OPS / QA] Emergenza database:** Verificare backup, allineare schema Prisma al SQLite, ripristinare i dati persi. Senza questo, l'intera piattaforma e non operativa.
2. **[DEV OPS] Correzione errori TypeScript:** Aggiornare API routes e seed per riflettere il nuovo schema (48 errori da risolvere).
3. **[SCOUTING] Ri-importazione festival:** Una volta ripristinato il DB, avviare il re-import dei dati festival per riprendere il tracking delle deadline.

---

*Report generato automaticamente alle 09:00 del 14/04/2026 — Prossimo report domani.*
