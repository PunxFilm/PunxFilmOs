---
name: punxfilm-qa-inspector
description: "Controlla qualita' dati e integrita' di PunxFilm OS: verifica dati festival, controlla materiali film, trova duplicati e inconsistenze, valida link screener, audit database, gestisci task QA. Usa questa skill quando l'utente chiede di controllare la qualita' dei dati, verificare materiali, trovare problemi nel database, fare audit, controllare integrita', o risolvere inconsistenze nei dati di PunxFilm."
---

# PunxFilm QA Inspector

Skill per il controllo qualita' dati e integrita' del database PunxFilm OS.

## Contesto App

PunxFilm OS e' un'app Next.js 14 con Prisma + SQLite per la distribuzione di cortometraggi nei festival. Il database e' in `prisma/dev.db` alla root del progetto.

## CHECKLIST AUDIT COMPLETA

### 1. Integrita' Database

```python
import sqlite3, json
from datetime import datetime

db_path = 'prisma/dev.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# --- FESTIVAL ---

# Festival senza edizioni
c.execute("""SELECT fm.id, fm.name FROM FestivalMaster fm
  LEFT JOIN FestivalEdition fe ON fe.festivalMasterId = fm.id
  WHERE fe.id IS NULL""")

# Edizioni senza festival master
c.execute("""SELECT fe.id, fe.year FROM FestivalEdition fe
  LEFT JOIN FestivalMaster fm ON fm.id = fe.festivalMasterId
  WHERE fm.id IS NULL""")

# Festival duplicati (nome simile)
c.execute("""SELECT a.id, a.name, b.id, b.name 
  FROM FestivalMaster a, FestivalMaster b
  WHERE a.id < b.id AND LOWER(a.canonicalName) = LOWER(b.canonicalName)""")

# Festival senza website
c.execute("""SELECT id, name FROM FestivalMaster WHERE website IS NULL OR website = ''""")

# Festival con needsAiRefresh
c.execute("""SELECT id, name FROM FestivalMaster WHERE needsAiRefresh = 1""")

# Festival non verificati
c.execute("""SELECT id, name, verificationStatus FROM FestivalMaster 
  WHERE verificationStatus IS NULL OR verificationStatus != 'verified'""")

# --- FILM ---

# Film senza campi obbligatori
c.execute("""SELECT id, titleOriginal FROM Film 
  WHERE titleOriginal IS NULL OR director IS NULL OR year IS NULL 
  OR duration IS NULL OR genre IS NULL""")

# Film senza piano distribuzione (attivi)
c.execute("""SELECT f.id, f.titleOriginal FROM Film f
  LEFT JOIN DistributionPlan dp ON dp.filmId = f.id
  WHERE dp.id IS NULL AND f.status IN ('active','in_distribuzione')""")

# --- MATERIALI ---

# Materiali obbligatori mancanti
c.execute("""SELECT fm.filmId, f.titleOriginal, fm.type, fm.status
  FROM FilmMaterial fm JOIN Film f ON f.id = fm.filmId
  WHERE fm.isRequired = 1 AND fm.status = 'missing'""")

# Film senza alcun materiale registrato
c.execute("""SELECT f.id, f.titleOriginal FROM Film f
  LEFT JOIN FilmMaterial fm ON fm.filmId = f.id
  WHERE fm.id IS NULL AND f.status IN ('active','in_distribuzione')""")

# --- SUBMISSION ---

# Submission orfane (senza piano collegato)
c.execute("""SELECT s.id, f.titleOriginal, fm.name
  FROM Submission s
  JOIN Film f ON f.id = s.filmId
  JOIN FestivalEdition fe ON fe.id = s.festivalEditionId
  JOIN FestivalMaster fm ON fm.id = fe.festivalMasterId
  LEFT JOIN PlanEntry pe ON pe.submissionId = s.id
  WHERE pe.id IS NULL""")

# PlanEntry 'subscribed' senza submission
c.execute("""SELECT pe.id, pe.planId, fm.name
  FROM PlanEntry pe
  JOIN FestivalMaster fm ON fm.id = pe.festivalMasterId
  WHERE pe.status = 'subscribed' AND pe.submissionId IS NULL""")

# Submission duplicate (stesso film + stessa edizione)
c.execute("""SELECT filmId, festivalEditionId, COUNT(*) as n
  FROM Submission GROUP BY filmId, festivalEditionId HAVING n > 1""")

# --- FINANCE ---

# Spese senza film/festival collegato
c.execute("""SELECT id, description, amount FROM FinanceEntry
  WHERE (filmTitle IS NULL OR filmTitle = '') AND category != 'other'""")

# --- TASK ---

# Task scadute non completate
c.execute("""SELECT id, title, dueDate, priority FROM Task
  WHERE status != 'done' AND dueDate < datetime('now')
  ORDER BY dueDate""")

conn.close()
```

### 2. Verifica Screener Link

Per ogni film attivo, controlla che il screener link funzioni:
```python
# Lista screener da verificare
c.execute("""SELECT f.id, f.titleOriginal, f.screenerLink, f.screenerPassword
  FROM Film f WHERE f.status IN ('active','in_distribuzione') 
  AND f.screenerLink IS NOT NULL AND f.screenerLink != ''""")
```
Se hai accesso web, fai un HEAD request per verificare che il link risponda 200.

### 3. Cross-Check Dati Festival

Per festival con `lastVerifiedAt` piu' vecchio di 30 giorni:
1. Visita il sito ufficiale del festival
2. Verifica date, deadline, fee correnti
3. Aggiorna `lastVerifiedAt` e `verificationStatus`
4. Se dati cambiano, segnala al Reparto Scouting

### 4. Qualita' Dati FestivalMaster

```python
# Campi importanti mancanti
c.execute("""SELECT id, name,
  CASE WHEN country IS NULL OR country = '' THEN 'country' ELSE '' END ||
  CASE WHEN city IS NULL OR city = '' THEN ',city' ELSE '' END ||
  CASE WHEN website IS NULL OR website = '' THEN ',website' ELSE '' END ||
  CASE WHEN classification IS NULL OR classification = '' THEN ',classification' ELSE '' END ||
  CASE WHEN type IS NULL OR type = '' THEN ',type' ELSE '' END as campi_mancanti
  FROM FestivalMaster
  WHERE country IS NULL OR country = '' 
  OR city IS NULL OR city = '' 
  OR website IS NULL OR website = ''
  OR classification IS NULL OR classification = ''""")

# dataConfidenceScore basso
c.execute("""SELECT id, name, dataConfidenceScore FROM FestivalMaster
  WHERE dataConfidenceScore IS NOT NULL AND dataConfidenceScore < 50""")
```

## Come Creare Task QA

Quando trovi un problema, crea una Task per tracciarlo:
```python
task_id = uuid.uuid4().hex[:25]
c.execute("""INSERT INTO Task (id, title, description, status, priority, filmId, createdAt, updatedAt)
  VALUES (?, ?, ?, 'todo', ?, ?, ?, ?)""",
  (task_id, f"[QA] {titolo_problema}", descrizione_dettagliata, priority, film_id, now, now))
```

## Decisioni Autonome vs. Approvazione

**AUTONOME:**
- Creare Task per segnalare problemi
- Marcare `needsAiRefresh = true` su festival con dati obsoleti
- Aggiornare `verificationStatus` dopo verifica
- Segnalare screener link non funzionanti

**RICHIEDONO APPROVAZIONE (delegata al reparto competente):**
- Correzione dati in qualsiasi tabella
- Merge festival duplicati
- Eliminazione record

## Principi
- Mai modificare dati direttamente — segnala al reparto competente
- Documentare ogni problema trovato con Task
- Prioritizzare: materiali mancanti obbligatori > dati festival > task scadute
- Eseguire audit completo almeno una volta alla settimana
