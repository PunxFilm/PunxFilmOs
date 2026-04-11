# 📋 PunxFilm OS — Report Scadenze
**Data:** 10 aprile 2026  
**Generato da:** Agente di monitoraggio automatico  
**Database:** `punxfilm-os/dev.db`

---

## ⚠️ NOTA SULLO SCHEMA DEL DATABASE

Il database rilevato ha uno schema **diverso** da quello atteso dall'agente di monitoraggio.

| Tabella attesa | Tabella trovata | Stato |
|---|---|---|
| `FestivalMaster` | `Festival` | Schema semplificato |
| `FestivalEdition` | *(non presente)* | Mancante |
| `Film` | `Film` | ✅ Presente |
| `Submission` | `Submission` | ✅ Presente |

Lo schema attuale corrisponde a una versione precedente o semplificata di PunxFilm OS (senza la distinzione FestivalMaster/FestivalEdition). Le query del monitor sono state adattate allo schema effettivo.

---

## 🚨 URGENTE — Deadline nei prossimi 3 giorni

**Nessuna scadenza urgente trovata.**

> Database Festival: 0 record · Database Submission (draft): 0 record

---

## 📅 QUESTA SETTIMANA — Deadline nei prossimi 7 giorni

**Nessuna scadenza nella settimana in corso.**

> Tutte le tabelle risultano vuote. Nessun festival con deadline imminente registrato.

---

## 🔄 DA AGGIORNARE — Status non aggiornati

**Nessun record da aggiornare.**

> Nessuna edizione festival con lifecycle da correggere (tabella Festival vuota).

---

## 🎬 EVENTI IN ARRIVO — Prossimi 30 giorni

**Nessun evento imminente.**

> Nessun festival con data di inizio entro il 10 maggio 2026.

---

## 📊 STATISTICHE SUBMISSION

| Status | Conteggio |
|---|---|
| Totale submission | **0** |
| Draft | 0 |
| Submitted | 0 |
| Accepted | 0 |
| Rejected | 0 |

---

## 🗂️ STATO GENERALE DATABASE

| Tabella | Record | Stato |
|---|---|---|
| Festival | 0 | ⬜ Vuota |
| Film | 0 | ⬜ Vuota |
| Submission | 0 | ⬜ Vuota |
| Task | 0 | ⬜ Vuota |
| FinanceEntry | 0 | ⬜ Vuota |
| Strategy | 0 | ⬜ Vuota |

---

## ✅ CONCLUSIONE

Il database è **attivo e raggiungibile**, ma tutte le tabelle sono attualmente vuote. Non ci sono azioni urgenti da intraprendere.

**Prossimi passi consigliati:**
1. Inserire i film in lavorazione nella tabella `Film`
2. Aggiungere i festival di interesse nella tabella `Festival`
3. Creare le submission per collegare film e festival

---
*Report generato automaticamente dal monitor scadenze PunxFilm OS — 10/04/2026 (agente schedulato)*
