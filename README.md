# PunxFilm OS

Piattaforma AI-native per la gestione della distribuzione di cortometraggi a festival cinematografici.

**Stato**: v2.0.0-alpha — pronto per deploy MVP su Railway.

## Cosa c'è dentro

- **Database festival**: 1.815 festival master, 553 edizioni annuali (43 al 100% per 2025, 80 al 100% per 2026)
- **Qualifying tracking**: Oscar (76), BAFTA (17), EFA (38), Goya (7)
- **Workflow**: film → materiali → piano distribuzione AI-assisted → submission → risultati
- **AI**: Claude per ranking festival, suggerimento queue, analisi film

## Stack

- Next.js 14 App Router + React 18 + TypeScript
- Prisma 5 (SQLite in dev, PostgreSQL in prod)
- NextAuth v5 (Credentials provider)
- Tailwind CSS v4 custom
- Anthropic SDK (Claude Sonnet 4)

## Quickstart dev

```bash
# 1. Clone + installa
git clone <repo> && cd punxfilm-os
npm install

# 2. Configura env
cp .env.example .env
# Modifica .env:
#   DATABASE_URL="file:./dev.db"
#   ANTHROPIC_API_KEY="sk-ant-..."
#   NEXTAUTH_SECRET="$(openssl rand -base64 32)"
#   NEXTAUTH_URL="http://localhost:3000"

# 3. Setup DB
npx prisma db push
npx tsx prisma/seed.ts    # popola festival + admin user

# 4. Run
npm run dev
# Apre http://localhost:3000
```

Primo login: usa le credenziali di `ADMIN_EMAIL` / `ADMIN_PASSWORD` dal `.env` (default `admin@punxfilm.it`).
Se registri un utente quando il DB è vuoto, il primo user diventa automaticamente admin.

## Deploy su Railway

Vedi [DEPLOY.md](./DEPLOY.md) per istruzioni complete. In sintesi:

```bash
npm run db:postgres         # switch schema a Postgres
railway login && railway init
railway add --database postgres
railway variables --set "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
railway variables --set "ANTHROPIC_API_KEY=..."
railway variables --set "ADMIN_EMAIL=simone@punxfilm.it"
railway variables --set "ADMIN_PASSWORD=..."
railway up
railway run npm run seed    # popola il DB in prod
```

## Comandi principali

```bash
npm run dev            # dev server
npm run build:local    # build Next.js (senza db push)
npm run build          # build produzione (include prisma db push)
npm run start          # start produzione
npm run lint           # eslint
npm run seed           # seed DB (idempotente)
npm run export-db      # esporta DB corrente in prisma/data/*.json
npm run db:postgres    # switch schema.prisma a postgresql
npm run db:sqlite      # switch back a sqlite

npx tsx scripts/fill-active-deadlines.ts   # ricalcola activeDeadlineDate
npx tsx scripts/seed-onboarding.ts         # popola materiali placeholder + piano demo
```

## Struttura

```
prisma/
  schema.prisma           — 18 modelli (14 business + 4 NextAuth)
  data/*.json             — export per seed Railway
  seed.ts                 — reimport idempotente da JSON
src/
  app/
    (auth)/               — login, register (public)
    (backoffice)/         — dashboard, film, festival, strategie, submissions... (auth required)
    api/
      auth/               — NextAuth handlers + register
      festival-masters/   — CRUD master
      festival-editions/  — CRUD edizioni
      films/, submissions/, tasks/, finance/
      ai/                 — rank-festivals, suggest-queue, analyze-film
      profile/, settings/
    page.tsx              — landing pubblica
    privacy/, terms/      — legal
  auth.ts                 — NextAuth config
  middleware.ts           — protezione rotte
  lib/
    prisma.ts             — singleton client
    ai.ts                 — wrapper Anthropic SDK
    completeness.ts       — scoring completezza record
    deadline-helpers.ts   — calcolo activeDeadline
    festival-matcher.ts   — fuzzy matching festival
  components/             — UI riutilizzabili (PageHeader, FormField, Sidebar, PlanCard...)
```

## Modelli Prisma chiave

- `FestivalMaster` — record master del festival (41+ campi)
- `FestivalEdition` — edizione annuale (47+ campi, deadline, fee, premi)
- `Film` — catalogo, con `materials`, `submissions`, `distributionPlans`
- `FilmMaterial` — tracking screener, poster, trailer, subtitles (status: missing/uploaded/approved)
- `DistributionPlan` + `PlanEntry` — piano distribuzione (premiere + queue)
- `Submission` — iscrizione film → edizione festival
- `User` + `Account` + `Session` — auth multi-tenant

## Sicurezza & Auth

- Credentials provider: email + password (hash bcrypt cost 10)
- JWT session (no DB lookup a ogni richiesta)
- Middleware protegge tutte le rotte tranne `/`, `/login`, `/register`, `/privacy`, `/terms`, `/api/auth/*`
- Primo utente registrato → ruolo `admin` automatico
- Role-based: `admin | user` (field `role` su User)

## Features AI

- **Ranking festival** (`/api/ai/rank-festivals`): dato un film, ordina i festival compatibili per rilevanza
- **Suggest queue** (`/api/ai/suggest-queue`): suggerisce ordine submission basato sulle deadline e priorità
- **Analyze film** (`/api/ai/analyze-film`): estrae metadata da descrizione

Tutti gli endpoint usano Anthropic SDK con prompt caching.

## Roadmap

- [x] MVP auth + dashboard + database festival popolato
- [ ] Deploy Railway (manuale, in attesa)
- [ ] Cron deadline alert via email (Resend)
- [ ] Sentry error monitoring
- [ ] Portal clienti (sub-route `/portal`)
- [ ] Integrazione Stripe per SaaS

---

© PunxFilm OS · AI-native short film distribution
