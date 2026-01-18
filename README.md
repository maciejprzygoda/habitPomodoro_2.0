habitPomodoro_2.0

Opis
habitPomodoro_2.0 to prosta aplikacja webowa typu PWA do zarządzania nawykami oraz pracy metodą Pomodoro. Aplikacja działa w przeglądarce i może być zainstalowana na urządzeniu jak aplikacja mobilna. Projekt został wykonany w czystym HTML, CSS i JavaScript.

Technologie
-HTML
-CSS
-JavaScript (vanilla JS)
-Progressive Web App (PWA)
-Service Worker
-Cache API
-Web Notifications API

Funkcjonalności
– dodawanie i usuwanie nawyków
– oznaczanie wykonanych celów
– timer Pomodoro (praca i przerwa)
– zapisywanie danych lokalnie
– powiadomienia
– działanie w trybie offline
– instalacja aplikacji na urządzeniu

Widoki aplikacji
Aplikacja posiada trzy główne widoki:
   Cele
   Pomodoro
   Statystyki

Nawigacja pomiędzy widokami odbywa się bez przeładowania strony.

PWA i tryb offline
Aplikacja wykorzystuje Service Workera oraz Cache API do buforowania zasobów. Dzięki temu działa również bez połączenia z internetem i może być zainstalowana jako PWA.

Natywne funkcje urządzenia
– powiadomienia (Web Notifications API)
– lokalny zapis danych (offline storage)

Uruchomienie projektu
Projekt należy uruchomić przez lokalny serwer HTTP (nie przez file://), np.:
npx serve .
lub
python -m http.server

Struktura projektu
/
index.html
manifest.webmanifest
sw.js
css/
js/
assets/

