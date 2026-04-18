# Report Deduplicazione Massiva Festival — 14 Aprile 2026

## Riepilogo

| Operazione | Conteggio |
|------------|-----------|
| Duplicati mergiati (website match) | 119 |
| Duplicati mergiati (nome normalizzato) | 18 |
| Record di test rimossi | 3 |
| Duplicati mergiati precedentemente | 14 |
| **Totale duplicati eliminati** | **154** |

## Stato Database Post-Dedup

| Metrica | Prima | Dopo | Delta |
|---------|-------|------|-------|
| Festival attivi | 946 | 793 | -153 |
| Verificati | 6 | 12 | +6 |
| Non verificati | 742 | 595 | -147 |
| Needs review | 0 | 1 | +1 |

## Metodo di Deduplicazione

### Passo 1: Match per website (119 merge)
Criterio piu' affidabile. Festival con lo stesso URL di sito web sono sicuramente duplicati.
Record mantenuto: quello con piu' campi compilati o con `verificationStatus: verified`.

### Passo 2: Match per nome normalizzato (18 merge)
Nomi normalizzati rimuovendo: numeri di edizione, anni, parole comuni (international, film, festival, short), punteggiatura.
Merge solo se anche il paese e la citta' corrispondono.

### Passo 3: Record di test (3 rimossi)
Festival con nomi tipo "Test Festival" e citta' "Test City" — non festival reali.

## Esempi di Duplicati Trovati

| Duplicato | Mantenuto come |
|-----------|----------------|
| Internationale Kurzfilmtage Oberhausen | International Short Film Festival Oberhausen |
| Vienna Shorts / Vienna Shorts Festival / Vienna Shorts Film Festival (3 record) | Vienna Shorts International Short Film Festival |
| IFFR / International Film Festival Rotterdam / International Film Festival Rotterdam (IFFR) | International Film Festival Rotterdam |
| Helsinki International Film Festival / Helsinki International Film Festival - Love & Anarchy / Love & Anarchy | Helsinki International Film Festival |
| NUFF (5 record con varianti) | Nordisk Ungdom Filmfestival |
| LuxFilmFest / Lux Film Fest / Lux Film Festival | Lux Film Festival |
| INTERFILM (3 record) | INTERFILM - International Short Film Festival Berlin |
| Festival du Court Metrage de Clermont-Ferrand | Festival International du Court Metrage de Clermont-Ferrand |

## Problemi Rilevati

1. **Import Base44 ha generato molti duplicati** — lo stesso festival importato con nomi leggermente diversi (nome ufficiale vs nome su FilmFreeway vs traduzione)
2. **Website FilmFreeway come fonte primaria** — molti festival hanno solo l'URL FilmFreeway come website, non il sito ufficiale
3. **Dati geografici incoerenti** — stesso festival con paese scritto diversamente (es. "Sudafrica" vs "Sud Africa", "Repubblica Ceca" vs "Cechia")
4. **Nomi con anno incluso** — es. "Holland Film Festival 2026" come record separato da "Holland Film Festival"

## Raccomandazioni

1. Normalizzare i nomi dei paesi (mapping unico)
2. Aggiornare i website da FilmFreeway URL al sito ufficiale del festival
3. Evitare import futuri senza dedup preventiva
4. Aggiungere `canonicalName` normalizzato a tutti i festival per dedup automatica
