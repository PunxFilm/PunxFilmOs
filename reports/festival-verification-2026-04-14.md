# Report Verifica Festival — 14 Aprile 2026

## Riepilogo Sessione

| Metrica | Valore |
|---------|--------|
| Festival verificati | 7 |
| Edizioni 2026 create | 4 |
| Duplicati mergiati | 14 |
| Festival con dati corretti | 1 (Preview) |
| Festival disattivati | 14 (duplicati) |

## Stato Database Post-Verifica

| Stato | Conteggio |
|-------|-----------|
| Totale attivi | 933 |
| Verificati | 12 (1.3%) |
| Non verificati | 724 |
| Needs review | 1 (Preview) |

## Festival Verificati in Questa Sessione

### Qualifying (Oscar/BAFTA/EFA)

| Festival | Citta' | Qualifying | Edizione 2026 |
|----------|--------|------------|----------------|
| International Short Film Festival Oberhausen | Oberhausen, DE | Oscar, EFA | 72a ed. 28 apr - 3 mag |
| Locarno Film Festival | Locarno, CH | Oscar, BAFTA, EFA | 79a ed. 5-15 ago |
| Vienna Shorts International Short Film Festival | Vienna, AT | Oscar, BAFTA, EFA | 23a ed. 26-31 mag |
| AFI FEST | Los Angeles, US | Oscar | 40a ed. 21-25 ott |
| Aesthetica Short Film Festival | York, UK | BAFTA, BIFA | 16a ed. 4-8 nov |

### Internazionali

| Festival | Citta' | Note |
|----------|--------|------|
| Istanbul Film Festival | Istanbul, TR | Corti solo per produzioni turche |

### Needs Review

| Festival | Problema |
|----------|----------|
| Preview International Short Film Festival | Citta' errata (era Cordoba, corretto in Barcelona). Website errato (puntava a Oberhausen). Qualifying status non confermato. |

## Duplicati Mergiati (14)

| Duplicato | Mergiato in |
|-----------|-------------|
| Internationale Kurzfilmtage Oberhausen | International Short Film Festival Oberhausen |
| Vienna Shorts (3 record) | Vienna Shorts International Short Film Festival |
| 2ANNAS IFFS | 2ANNAS IFFS (record primario) |
| AAIFF Africa All African Independent Film Festival | AAIFF Africa (record primario) |
| AFRIFF - Africa International Film Festival | AFRIFF (record primario) |
| Africa International Film Festival | AFRIFF (record primario) |
| Africa International Film Festival (AFRIFF) | AFRIFF (record primario) |
| AFSAD International Short Film Festival | AFSAD 9th International Short Film Festival |
| ALPINALE Short Film Festival | ALPINALE Kurzfilmfestival |
| Adelaide Film Festival (dup) | Adelaide Film Festival (record primario) |
| Aaretaler Kurzfilmtage 2026 | Aaretaler Kurzfilmtage |

## Osservazioni

1. **Il database ha MOLTI duplicati** — stimati almeno 100-200 sul totale di 933 festival attivi. Servono sessioni dedicate alla dedup.
2. **Nessun festival nel DB aveva qualifying = true** eccetto Clermont-Ferrand, Cannes e i 4 appena verificati. Molti festival qualifying mancano dal DB (Tampere, Palm Springs ShortFest, etc.).
3. **Completeness score** medio e' basso (~52%) — la maggior parte dei festival ha solo nome, citta', paese e classificazione.
4. **Dati importati da Base44** contengono errori sistematici: website errati, citta' sbagliate, nomi duplicati con varianti.

## Prossimi Step

1. Continuare verifica batch per batch (priorita': festival noti europei)
2. Sessione dedicata alla dedup massiva
3. Aggiungere festival qualifying mancanti (Tampere, Palm Springs, Drama, Winterthur, etc.)
4. Arricchire dati contatti e deadline per festival verificati
