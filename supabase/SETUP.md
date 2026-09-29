# HSC — prawdziwe połączenie klient ↔ pracownik

Frontend jest już rozdzielony:
- publiczny klient: `/client/`
- prywatny staff: `/staff/`

Aktualnie oba widoki mają tryb lokalny. Aby projekty klientów pojawiały się na innym urządzeniu pracownika i aby logowanie było naprawdę bezpieczne, podłączamy wspólną bazę + Auth.

## Plan
1. Załóż darmowy projekt Supabase.
2. W SQL Editor uruchom `schema.sql`.
3. W Authentication utwórz konto właściciela/pracownika.
4. Skopiuj UUID użytkownika i dodaj go do `staff_profiles`:
   `insert into public.staff_profiles(user_id,display_name,role) values ('UUID','Gabriel','owner');`
5. Do frontendu podaj Project URL + anon public key.
6. Klient dostaje wyłącznie prawo INSERT do `projects`.
7. Tylko zalogowany staff ma SELECT/UPDATE projektów i dostęp do zleceń.

Dzięki RLS sam adres `/staff/` nie daje dostępu do danych — potrzebne jest prawdziwe konto pracownika.

## Rejestracje chińskie
Nie wymagamy chińskiej klawiatury. Klient wybiera region z listy (np. 北京 → 京), a wpisuje tylko literę i cyfry/litery. System przechowuje równolegle:
- widok: `京A·12345`
- klucz łaciński: `CN-BJ-A12345`

Jeżeli na serwerze zdecydujemy się całkiem zrezygnować z chińskich tablic, można zostawić wyłącznie tryb zwykłej rejestracji bez zmiany bazy.
