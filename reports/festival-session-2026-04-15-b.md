# Report Sessione Festival — 15 Aprile 2026 (Sessione B)

## Operazioni Completate

### Step 2: Arricchimento Edizioni 2026
- **33 edizioni 2026 completamente arricchite** (date + deadline) su 78 totali
- **39 edizioni con date evento** (50%), **35 con deadline** (44%), **25 con fee** (32%), **17 con premi** (21%)
- Festival arricchiti con dati reali da web search:
  - **A-list**: Berlinale (76a, feb), Sundance (42a, gen), TIFF (51a, set), Cannes, Venice, Locarno
  - **Oscar+EFA**: Tampere (56a, mar, 5000 EUR), Oberhausen (72a), Drama DISFF (49a, set), INTERFILM (42a, nov), Sarajevo (32a, ago), Uppsala (45a, ott), Curtas (34a, lug), Huesca (54a, giu)
  - **Oscar**: Ann Arbor (64a, mar, 38000 USD premi), Aspen (35a, apr), Annecy (50a, giu), Atlanta (50a, apr), Austin (33a, ott), Palm Springs ShortFest (32a, giu, 70000 USD premi), SF IFF (69a, apr), Tribeca (25a, giu)
  - **EFA**: Leuven (32a, nov-dic), DokuFest (25a, ago), Go Short (18a, apr)
  - **BAFTA**: Aesthetica (16a, nov), BFI London, Leeds, Raindance (34a, giu), Flickerfest (35a, gen)
  - **Italiani**: Cortinametraggio, Concorto, Ferrara, Inventa un Film, Torino FF
- **Scoperta**: Go Short e' anche **BAFTA qualifying** (BAFTA totali: da 16 a 17)
- Bug trovato: campo `venue` non esiste nello schema FestivalEdition (Prisma rigetta silenziosamente)

### Step 3: Import Festival Italiani Mancanti
- **6 nuovi festival italiani** importati e verificati:
  - **Cortinametraggio** — Cortina d'Ampezzo (VE), 21a ed. marzo 2026, corti italiani/internazionali
  - **Lago Film Fest** — Revine Lago (TV), festival indipendente estivo open-air
  - **Ferrara Film Corto Festival** — Ferrara, 9a ed. ottobre 2026, tema "Ambiente e Musica"
  - **Inventa un Film** — Lenola (LT), 28a ed. luglio-agosto 2026, corti/lungometraggi
  - **Figari International Short Film Fest** — Golfo Aranci (SS), short film market
  - **Torino Film Festival** — Torino, 44a ed. novembre 2026, secondo festival italiano per importanza
- **Concorto Film Festival** corretto: citta' da "Orzinuovi" a "Pontenure (PC)", arricchito con dati 25a edizione
- **Arcipelago Film Festival** — NON importato, chiuso nel 2017 dopo la 24a edizione
- Edizioni 2026 create per tutti i nuovi festival con date reali

### Step 1 (parziale): Verifica Batch Festival ai_enriched
- **15 festival europei verificati** con dati reali da web search:
  - BFI London Film Festival (A-list, BAFTA qualifying)
  - ALPINALE Kurzfilmfestival, Alcine (Oscar qualifying!), Belfast FF (BAFTA)
  - CINECITY Brighton, AZYL SHORTS, Animocje, Berlin Independent
  - Bruges International, TAURON American FF, Bamberger Kurzfilmtage
  - Brussels CINEVERSE, Anishort Festival, Berlin Indie Shorts
- **Champs-Elysees Film Festival** — DISATTIVATO (chiuso luglio 2025)
- **Correzioni**: AZYL SHORTS citta' da Zvolen a Banska Bystrica, Animocje da Warsaw a Bydgoszcz
- Secondo batch di 15 festival europei in corso di verifica (background)

### Step 4: Contatti Email
- **22 nuovi contatti email** aggiunti per festival target:
  - Oscar qualifying: Ann Arbor, Aspen Shortsfest, Atlanta FF, Austin FF, Bogoshorts, Cairo IFF, Durban IFF
  - EFA qualifying: DokuFest
  - BAFTA qualifying: BFI London, Belfast FF
  - Italiani: Cortinametraggio, Figari, Torino FF
  - Europei: ALPINALE, Alcine, CINECITY, Animocje, Berlin Independent, Bamberger, Brussels CINEVERSE, Anishort

### Step 5: Edizioni 2027
- **63 edizioni 2027** create per tutti i festival qualifying e A/B-list con edizione 2026
- Status: `scouting` (date stimate basate su 2026, da verificare)
- Include: Sundance, Berlinale, Cannes, TIFF, Clermont-Ferrand, Venice, Locarno, e tutti i principali

## Stato Finale Database

| Metrica | Prima | Dopo | Delta |
|---------|-------|------|-------|
| Festival attivi | 829 | 831 | +2 (6 nuovi - 4 disattivati) |
| Verified (web) | 81 | 114 | **+33** |
| AI enriched | 568 | 537 | -31 (verificati) |
| AI verified | 136 | 136 | = |
| Unverified | 4 | 4 | = |
| Oscar qualifying | 74 | 76 | +2 (Alcine, Cork) |
| BAFTA qualifying | 13 | 17 | **+4** (BFI London, Belfast, BUFF, Go Short) |
| EFA qualifying | 37 | 38 | +1 (Cork) |
| Goya qualifying | 7 | 7 | = |
| Con email contatto | 169 | 196 | **+27** |
| Festival italiani | 21 | 27 | **+6** |
| Edizioni 2026 arricchite | ~10 | 33 | **+23** (date+deadline) |
| Edizioni 2027 | 0 | 63 | **+63** |
| Paesi | 78 | 78 | = |

## Festival Italiani nel Database (27)

| Festival | Citta' | Status | Note |
|----------|--------|--------|------|
| Venice International Film Festival | Venezia | verified | Oscar, EFA |
| Torino Film Festival | Torino | verified | A-list, 44a ed. nov 2026 |
| Sedicicorto International Film Festival | Forli' | verified | - |
| Concorto Film Festival | Pontenure | verified | B-list, 25a ed. ago 2026 |
| Cortinametraggio | Cortina d'Ampezzo | verified | B-list, 21a ed. mar 2026 |
| Lago Film Fest | Revine Lago | verified | B-list, indipendente |
| Figari International Short Film Fest | Golfo Aranci | verified | B-list, short film market |
| Ferrara Film Corto Festival | Ferrara | verified | ott 2026 |
| Inventa un Film | Lenola | verified | 28a ed. lug-ago 2026 |
| ShorTS International Film Festival | Trieste | ai_enriched | - |
| Visioni Italiane | Bologna | ai_enriched | - |
| Pop Corn Festival del Corto | Porto Santo Stefano | ai_enriched | - |
| + 15 altri | varie | vari | - |

## Prossimi Step

1. **Completare verifica batch ai_enriched** — 537 rimanenti, procedere per batch di 15-20
2. **Continuare arricchimento edizioni 2026** — 45 edizioni ancora senza date/deadline
3. **Deduplicare Cannes** — ci sono 2 record per "Festival de Cannes - Court Metrage"
4. **Verificare edizioni 2027** — date stimate, da confermare con web search quando disponibili
5. **Aggiungere contatti** per ~50 festival verificati ancora senza email
6. **Aggiungere campo `venue`** allo schema FestivalEdition (manca nel Prisma schema)
