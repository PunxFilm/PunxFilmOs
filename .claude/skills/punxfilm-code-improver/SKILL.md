---
name: punxfilm-code-improver
description: "Analizza e migliora il codice di PunxFilm OS: code review, refactoring, bug fix, performance, nuove feature. Usa questa skill quando l'utente chiede di migliorare l'app, fare review del codice, fixare bug, aggiungere feature, fare refactoring, migliorare performance, o qualsiasi modifica al codice sorgente di PunxFilm OS."
---

# PunxFilm Code Improver

Skill per analizzare e migliorare il codice dell'applicazione PunxFilm OS.

## Stack Tecnologico

- **Framework**: Next.js 14 (App Router) con TypeScript 6.0.2
- **Database**: SQLite via Prisma 5.22.0
- **Styling**: Tailwind CSS 4.2.2
- **AI**: Anthropic SDK (Claude) per matching film-festival
- **Validation**: Zod 4.3.6
- **UI**: React 18.3.1 con componenti custom

## Struttura Progetto

```
punxfilm-os/
├── src/
│   ├── app/
│   │   ├── (backoffice)/     # Admin: dashboard, festivals, films, strategies, ecc.
│   │   ├── api/              # REST API routes
│   │   ├── portal/           # Portale cliente
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css
│   ├── components/           # React components (page-header, form-field, status-badge, ecc.)
│   ├── lib/                  # Business logic (prisma, ai-prompts, constants, validations, utils)
│   ├── generated/prisma/     # Tipi Prisma auto-generati
│   └── styles/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── dev.db
```

## Aree di Miglioramento

### 1. Code Review

Quando l'utente chiede una review, esamina questi aspetti:

**Sicurezza:**
- Input validation nelle API routes (uso corretto di Zod)
- SQL injection (Prisma protegge, ma controllare raw queries)
- Gestione errori (try/catch coerenti, messaggi utili)
- Esposizione dati sensibili nelle response

**Performance:**
- Query N+1 (uso di `include` e `select` in Prisma)
- Componenti client vs server (minimize "use client")
- Mancanza di pagination o pagination inefficiente
- Bundle size (import inutili)

**Qualità Codice:**
- Consistenza naming (italiano vs inglese, camelCase)
- Duplicazione codice tra route handlers
- Type safety (any types, missing types)
- Error boundaries mancanti

**Pattern Next.js:**
- Uso corretto di Server/Client Components
- Data fetching patterns (server components per dati statici)
- Route grouping e layout nesting
- Metadata e SEO

### 2. Refactoring Comuni

**API Routes** - Molte route hanno pattern simili. Opportunità di:
- Creare middleware condivisi per validazione e error handling
- Estrarre pattern CRUD in utility functions
- Standardizzare le response (formato, status codes, error messages)

**Componenti** - Possibili miglioramenti:
- Componenti form generici per ridurre duplicazione
- Composizione vs. props drilling
- Suspense boundaries per loading states
- Error boundaries per fallback UI

**Tipi** - Migliorare type safety:
- Derivare tipi da Prisma schema piuttosto che ridefinirli
- Usare discriminated unions per status
- Zod schemas condivisi tra client e server

### 3. Nuove Feature

Quando l'utente chiede una nuova feature:

1. **Analisi**: Leggi i file correlati per capire pattern esistenti
2. **Piano**: Proponi l'architettura (quali file creare/modificare)
3. **Implementazione**: Segui i pattern del progetto:
   - API: `src/app/api/<resource>/route.ts` (GET, POST)
   - API con ID: `src/app/api/<resource>/[id]/route.ts` (GET, PUT, DELETE)
   - Pagine: `src/app/(backoffice)/<section>/page.tsx`
   - Componenti: `src/components/<name>.tsx`
4. **Schema**: Se serve modificare il DB, aggiorna `prisma/schema.prisma` e genera migration
5. **Test**: Verifica che l'app compili con `npm run build`

### 4. Bug Fix

Processo per debugging:

1. Riproduci il problema leggendo codice e log
2. Identifica la root cause
3. Proponi fix con spiegazione
4. Implementa e verifica con build

## Comandi Utili

```bash
# Sviluppo
cd /sessions/loving-nifty-hamilton/mnt/punxfilm-os
npm run dev          # Start dev server
npm run build        # Production build (verifica errori)
npm run lint         # Linting

# Database
npx prisma db push   # Applica schema changes
npx prisma generate  # Rigenera client
npx prisma studio    # GUI database

# Migrazioni
npx prisma migrate dev --name <nome>
```

## Principi di Sviluppo

- **Lingua UI**: Italiano per label e testo utente, inglese per codice e variabili
- **Consistenza**: Segui sempre i pattern già presenti nel codebase
- **Incrementale**: Modifiche piccole e verificabili, una alla volta
- **Backward compatible**: Non rompere API o strutture dati esistenti senza migrazione
