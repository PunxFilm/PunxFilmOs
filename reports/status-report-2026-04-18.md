# PunxFilm OS — Status Report
**Data:** 2026-04-18 · **DG:** Remote Control

## KPI Dashboard

| Metrica | Valore |
|---|---|
| Film in catalogo | 7 |
| Festival (Master) | 1.814 |
| Edizioni attive | 551 |
| Submission totali | 1 |
| Piani distribuzione | 1 |
| Materiali film tracciati | 70 |
| Task aperte | 0 |
| Persone in rubrica | 0 |
| Entries finanza | 0 |

## Reparto SCOUTING & FESTIVAL

- Deadline prossimi 7 giorni: **0**
- Deadline 8-14 giorni: **0**
- Festival da rinfrescare (AI): **1.053** (58%)
- Festival non verificati: **1.693** (93%)

**Alert:** nessuna deadline attiva nei prossimi 14 giorni. Da verificare se e' un problema di dati (activeDeadlineDate mancante su molte edizioni) o un vero vuoto di calendario.

## Reparto DISTRIBUZIONE & SUBMISSION

- 1 sola submission esistente (status: submitted)
- Tasso accettazione: n/d (nessuna decisione)
- **Film senza piano distribuzione: 6 / 7**
  - La casa di Barbi
  - Hold on
  - ALLA SVIZZERA
  - LA BUONA CONDOTTA
  - L'Incredibile Storia di Paolo Riva
  - LA TRUFFA

## Reparto FINANCE

- Nessuna entry registrata
- Budget e ROI non tracciabili

## Reparto QA & DATA

- **42 materiali obbligatori mancanti** su 6 film
  - Ogni film manca: screener_link, poster, trailer, tech_sheet, subtitles_en, bio_director
- Solo "FEDELI ALLA LINEA" e' tracciato ma senza piano

## Reparto DEV OPS

- Branch `main`, commit recenti: Team Agents dashboard, Festival Management
- Prisma migrations cancellate nel working tree (D status) → rischio disallineamento DB/schema
- `dev.db` presente sia in root che in `prisma/` → ambiguita'
- Molti file `*.tsx` modificati non committati

## Priorita'

### CRITICO
1. **Verificare stato DB vs schema Prisma** — migrations cancellate, 2 copie di dev.db
2. **Importare materiali film** — 42 assenze su 6 film blocca qualsiasi submission

### URGENTE
3. **Creare piani distribuzione** per i 6 film scoperti
4. **Popolare `activeDeadlineDate`** sulle 551 edizioni — senza queste il sistema scadenze e' cieco

### IMPORTANTE
5. Ridurre i 1.693 festival non verificati (pipeline AI refresh)
6. Avviare tracking finanziario (0 entries)

### NORMALE
7. Committare lavoro in corso su `main` (molti file M non committati)

## Decisioni in attesa di Simone

| Decisione | Contesto | Raccomandazione | Urgenza |
|---|---|---|---|
| Rigenerare migrations Prisma? | Migrations cancellate dal working tree | `prisma migrate reset` + nuova baseline | ALTA |
| Priorita' film per piano distribuzione | 6/7 senza piano | Partire da "LA TRUFFA" e "LA BUONA CONDOTTA" (titoli piu' recenti) | MEDIA |
| Campagna upload materiali | 42 asset mancanti | Session dedicata con Simone per caricare screener + poster | ALTA |

## Prossime azioni suggerite

- `/punxfilm-qa-inspector` — audit dati completo
- `/punxfilm-distribution-manager` — creare piani per i 6 film
- `/punxfilm-festival-manager` — aggiornare deadline su edizioni 2026
