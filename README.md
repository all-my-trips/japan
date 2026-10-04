# Japonia 2026: przewodnik

Interaktywny przewodnik po podróży do Japonii (8–27 listopada 2026), działający na telefonie, iPadzie i komputerze.

- `index.html`, `app.css`, `app.js`: wygląd i logika strony
- `data/trip.json`: cała treść (plan dni, miejsca, opisy, rezerwacje); strona czyta tylko ten plik
- `img/`: zdjęcia miejsc z Wikimedia Commons; autor i licencja każdego zdjęcia są w `trip.json` i wyświetlają się pod zdjęciem

Publikacja: GitHub Pages z gałęzi `main`, folder `/`.
Lokalnie: `python3 -m http.server` w tym folderze, potem http://localhost:8000/.
