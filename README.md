# Hood Stories Customs — WebDisplays UI

Statyczny frontend przygotowany pod WebDisplays/MCEF i GitHub Pages.

## Tryby
- `#client` — konfigurator klienta
- `#staff` — panel warsztatu
- `#status` — lokalny podgląd zlecenia

## Logika warsztatu
- stanowisko 1: przyjęcie auta
- stanowiska 2–8: uniwersalne stanowiska robocze
- lakiernia: osobna strefa
- silnik: zawsze fabryczny; bez swapów
- GT Craft: strona pokazuje kompatybilne części i dodatki wyciągnięte z paczki (bodykit, interior, koła/felgi, performance, osprzęt silnika itd.)
- New Cars / BRCC: bez wymyślonych części; pokazywane są wykryte warianty lakieru i usługi

## Dane zleceń
Obecna wersja zapisuje zlecenia w `localStorage`, więc dane są lokalne dla danej przeglądarki/WebDisplays. Jest kod eksportu/importu HSC1 do przenoszenia zleceń pomiędzy urządzeniami. Do automatycznej synchronizacji klient ↔ pracownik trzeba podpiąć backend/bazę danych (kolejny etap).

## GitHub Pages
Ustaw w repozytorium: Settings → Pages → Deploy from a branch → `main` / `(root)`.
