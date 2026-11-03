# Zakładka „Historia Japonii”

- `historia-japonii.md`: kanoniczny tekst przewodnika. Strona renderuje go bez zmian (`md.js`: bezpieczny renderer, cały tekst jest escapowany, HTML ze źródła nie trafia na stronę). Poprawki treści robi się tylko w tym pliku.
- `historia-powiazania.json`: warstwa prezentacji, osobna od tekstu. Nie zawiera fragmentów artykułu poza krótkimi początkami akapitów, po których strona je odnajduje.

## Adresy

- `#historia`: początek zakładki (powrót z innej zakładki przywraca miejsce czytania)
- `#historia-<id>`: nagłówek albo akapit z kotwicą, np. `#historia-nara`, `#historia-nikko-tosho-gu`
- `#historia-spis` (spis treści), `#historia-epoki` (oś epok)
- `#d-2026-11-14/d07-03`: dzień planu przewinięty do punktu (`items[].id`); punkt jest widoczny nawet przy wyłączonym filtrze WANT/BONUS

Identyfikator nagłówka powstaje z jego tekstu: bez numeru rozdziału, do pierwszej kropki, myślnika lub nawiasu, bez polskich znaków (`## 2. Nara. Buddyzm…` → `nara`). Zmiana nagłówka w Markdownie zmienia identyfikator, więc trzeba wtedy poprawić odwołania w `historia-powiazania.json`.

## Format `historia-powiazania.json`

- `anchors`: `{klucz: "początek akapitu"}`. Akapit, którego tekst (z gwiazdkami Markdown albo bez) zaczyna się tak samo, dostaje id `historia-<klucz>`. Niedopasowana kotwica jest pomijana i zgłaszana w konsoli.
- `hero`: `{photo, caption}`: zdjęcie otwierające.
- `chapters`: `{idNagłówka: {kanji?, photo?, caption?}}`: znak nad tytułem rozdziału i zdjęcie otwierające rozdział.
- `figures`: `[{after: klucz, photos: [ref, ref?], caption}]`: zdjęcia po akapicie z kotwicą (dwa obok siebie na szerszym ekranie).
- `tripLinks`: `[{after: klucz, places?: [placeId], items?: [itemId]}]`: ramka „Zobaczymy podczas podróży”. Dni, daty, nazwy i odznaki MUST/WANT/BONUS strona bierze z aktualnego `data/trip.json`; miejsce usunięte z planu znika z ramki, a pusta ramka się nie pokazuje.
- `backlinks`: `{placeId: klucz lub idNagłówka}`: link „Poznaj historię tego miejsca” przy punkcie planu i w karcie miejsca.
- `eras`: `[{name, kanji, dates, target}]`: oś epok; nazwy i daty wzięte z nagłówków i tabeli w Markdownie, `target` to id nagłówka albo klucz kotwicy.

Odwołanie do zdjęcia (`ref`): `{place, n}` bierze `places[place].photo` (n = 0) albo `gallery[n-1]` z `trip.json` razem z autorem i licencją; `{src, alt, credit, license, sourceUrl, kind}` to plik spoza planu (np. `img/history/`). `kind`: `photo` (fotografia współczesna, domyślnie), `artwork` (dawne przedstawienie: drzeworyt, zwój, parawan, portret), `artefact` (zabytek w muzeum).
