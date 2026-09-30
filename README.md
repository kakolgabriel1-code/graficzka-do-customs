# Cent's Detailing&Customs — WebDisplays

System został rozdzielony na dwie osobne strony.

## Publiczna strona klienta
`/client/`

Klient:
- wybiera auto,
- wybiera lakier,
- wybiera tablicę (BRCC / New Cars),
- wybiera kompatybilne części / modyfikacje,
- wpisuje rejestrację,
- zapisuje **projekt klienta**.

Klient nie tworzy oficjalnego zlecenia.

## Cent's Staff OS
`/staff/`

Pracownik:
- przechodzi weryfikację,
- widzi projekty klientów,
- poprawia projekt po rozmowie i oględzinach auta,
- dopiero potem tworzy oficjalne zlecenie,
- przydziela stanowisko,
- zmienia status,
- ustala płatność.

Układ warsztatu:
- stanowisko 1 = przyjęcie auta,
- stanowiska 2–8 = uniwersalne stanowiska robocze,
- lakiernia = osobna strefa,
- silnik = zawsze fabryczny; bez swapów.

## Rejestracje
Zwykłe rejestracje są zapisywane alfabetem łacińskim.

Dla chińskiej rejestracji klient nie wpisuje chińskiego znaku ręcznie:
- wybiera region z listy,
- wpisuje literę i końcówkę,
- strona generuje np. `京A·12345`,
- równolegle przechowuje klucz `CN-BJ-A12345`.

## Połączenie stron
Tryb lokalny już działa na tym samym originie/przeglądarce oraz przez kod projektu `HSCP1`.

Do prawdziwego połączenia między różnymi urządzeniami przygotowany jest backend w katalogu `/supabase/`. Po podpięciu bazy:
- klient wysyła projekt do wspólnej bazy,
- pracownik widzi go po zalogowaniu,
- klient nie ma dostępu do zleceń pracownika,
- RLS blokuje dostęp do danych staffu bez prawdziwego konta.

## GitHub Pages
Po włączeniu Pages z gałęzi `main` / root:
- klient: `https://kakolgabriel1-code.github.io/graficzka-do-customs/client/`
- staff: `https://kakolgabriel1-code.github.io/graficzka-do-customs/staff/`

Główny adres repo przekierowuje na stronę klienta.
