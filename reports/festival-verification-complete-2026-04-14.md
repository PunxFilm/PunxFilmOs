# Report Verifica Completa Festival — 14 Aprile 2026

## Riepilogo Operazioni

| Operazione | Conteggio |
|------------|-----------|
| Festival verificati manualmente (web search) | 38 |
| Festival arricchiti AI (tipo, screening, score) | 578 |
| Duplicati eliminati (dedup massiva) | 154 |
| Festival Oscar qualifying importati | 33 |
| Festival Oscar qualifying marcati nel DB | 19 |

## Stato Database Finale

| Metrica | Prima | Dopo |
|---------|-------|------|
| Festival attivi | 946 | 825 |
| Verificati (web) | 6 | 38 |
| AI enriched | 0 | 578 |
| Non verificati | 742 | 33 |
| Completeness medio | ~52% | 65% |
| Paesi rappresentati | ~85 | 92 |

## Festival Qualifying nel Database

### Oscar Qualifying: 73 festival

Tra i principali:
- Sundance Film Festival (USA)
- Toronto International Film Festival (Canada)
- Berlinale (Germania)
- Festival de Cannes (Francia)
- Clermont-Ferrand (Francia)
- Venice International Film Festival (Italia)
- Locarno Film Festival (Svizzera)
- AFI FEST (USA)
- Tribeca Film Festival (USA)
- Palm Springs ShortFest (USA)
- Annecy International Animation Film Festival (Francia)
- Tampere Film Festival (Finlandia)
- Oberhausen (Germania)
- Vienna Shorts (Austria)
- Sarajevo Film Festival (Bosnia)
- SITGES (Spagna)
- Busan International Short Film Festival (Corea)
- Melbourne International Film Festival (Australia)
- Flickerfest (Australia)
- Drama International Short Film Festival (Grecia)

### BAFTA Qualifying: 7 festival
### EFA Qualifying: 19 festival
### Goya Qualifying: 2 festival

## Distribuzione per Tipo

| Tipo | Conteggio | % |
|------|-----------|---|
| Short film | 471 | 57% |
| Mixed (feature+short) | 307 | 37% |
| Documentary | 25 | 3% |
| Feature only | 11 | 1.3% |
| Animation | 6 | 0.7% |
| Genre (horror/fantasy) | 3 | 0.4% |

## Distribuzione Geografica (Top 15)

| Paese | Festival |
|-------|----------|
| Stati Uniti | 75 |
| Spagna | 49 |
| Australia | 46 |
| Germania | 41 |
| Regno Unito | 36 |
| India | 32 |
| Polonia | 31 |
| Francia | 27 |
| Belgio | 26 |
| Portogallo | 25 |
| Grecia | 21 |
| Messico | 21 |
| Paesi Bassi | 20 |
| Italia | 20 |
| Austria | 19 |

92 paesi totali rappresentati.

## Dati Arricchiti

Per ogni festival nel DB ora abbiamo:
- **Tipo** (short/mixed/documentary/animation/genre): 100% compilato
- **Screening type** (in_person/hybrid/online): 95% compilato
- **Quality score** (1-100): ~70% compilato
- **Oscar qualifying**: 73 festival marcati
- **Classificazione**: 97% compilato
- **Max durata**: compilato per tutti i festival short

## Prossimi Step Raccomandati

1. **Verificare online i 33 festival ancora "unverified"** — piccolo batch residuo
2. **Aggiornare i 578 "ai_enriched" con dati reali** — priorita per festival europei rilevanti per PunxFilm
3. **Creare edizioni 2026** per tutti i festival verificati che non ne hanno ancora
4. **Aggiungere contatti** (email programmatori) per i festival target di PunxFilm
5. **Verificare dati EFA/BAFTA/Goya qualifying** — molti potrebbero mancare
6. **Normalizzare nomi paesi** (es. "Sudafrica" vs "Sud Africa", "Cechia" vs "Repubblica Ceca")
