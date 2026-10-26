# Japonia 2026: przewodnik

Interaktywny przewodnik po podróży do Japonii (8–27 listopada 2026), działający na telefonie, iPadzie i komputerze.

- `index.html`, `app.css`, `app.js`: wygląd i logika strony
- `data/trip.json`: cała treść (plan dni, miejsca, opisy, rezerwacje); strona czyta tylko ten plik
- `img/`: zdjęcia miejsc z Wikimedia Commons; autor i licencja każdego zdjęcia są w `trip.json` i wyświetlają się pod zdjęciem
- Adresy: `#plan`, `#today`, `#d-2026-11-13` (dzień), `#bookings`, `#food` (Jedzenie); `bookings[]` z `kind: "experience"` trafiają do sekcji „Doświadczenia” w Rezerwacjach; `days[].todos` to sekcja „Ważne TODO” dnia, `food` to treść zakładki Jedzenie, `days[].videos` (`[{title, url}]`) to linki do filmów dnia, zdjęcia potraw w `img/food/`; `days[].tips` i `days[].items[].tips` (`[{kind, text, link?}]`, `kind`: `tip`, `important`, `booking`, `experience`, `highlight`, `general`) to krótkie wskazówki przy dniu i przy punkcie planu

Publikacja: GitHub Pages z gałęzi `main`, folder `/`.
Lokalnie: `python3 -m http.server` w tym folderze, potem http://localhost:8000/.
