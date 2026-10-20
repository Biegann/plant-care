# Formularz "Bezpieczeństwo danych" w Google Play

Odpowiedzi przygotowane 20.10.2026 na podstawie kodu (paczki w `package.json`, tabele w `supabase/migrations`, funkcje `diagnose-plant` i `delete-account`) i definicji Google Play. Przy każdej zmianie zbieranych danych (nowa paczka, tabela, dostawca) zaktualizuj ten plik, formularz w Play Console i politykę prywatności na plantcareapp.pl.

## Sekcja ogólna

| Pytanie | Odpowiedź |
|---|---|
| Czy aplikacja zbiera lub udostępnia wymagane typy danych? | Tak |
| Czy wszystkie dane są szyfrowane podczas przesyłania? | Tak (HTTPS do Supabase i funkcji serwerowych) |
| Metody tworzenia konta | Nazwa użytkownika (e-mail) i hasło |
| Link do usuwania konta | https://plantcareapp.pl/delete-account/ |
| Czy można usunąć część danych bez usuwania konta? | Tak (rośliny, zdjęcia, wpisy dziennika, ogrody) |

## Typy danych

Wszystkie: zbierane tak, udostępniane nie.

| Kategoria → typ | Co to u nas | Tymczasowe? | Wymagane? | Cele |
|---|---|---|---|---|
| Dane osobowe → Adres e-mail | logowanie, kody z e-maila | nie | wymagane | Działanie aplikacji, Zarządzanie kontem |
| Dane osobowe → Identyfikatory użytkownika | id konta Supabase, nazwa wyświetlana z części e-maila | nie | wymagane | Działanie aplikacji, Zarządzanie kontem, Zapobieganie oszustwom i bezpieczeństwo (limit prób kodu, limit diagnoz) |
| Zdjęcia i filmy → Zdjęcia | zdjęcia roślin, dziennika i diagnozy AI | nie (zdjęcia roślin są przechowywane) | opcjonalne | Działanie aplikacji |
| Aktywność w aplikacji → Inne treści użytkownika | nazwy ogrodów i roślin, notatki, dziennik, harmonogram i historia opieki, opis do diagnozy | nie | wymagane | Działanie aplikacji |

Nie zaznaczamy: lokalizacja, finanse, zdrowie, wiadomości, dźwięk, pliki, kalendarz, kontakty, historia przeglądania, logi awarii i diagnostyka, identyfikatory urządzenia.

## Założenia

- Brak analityki, raportów błędów, reklam i tokenów push (powiadomienia są lokalne).
- Ustawienia zapisane tylko na telefonie (motyw, język, powiadomienia) nie są deklarowane, bo nie opuszczają urządzenia.
- "Imię i nazwisko" niezaznaczone: nazwa wyświetlana to część adresu e-mail przed "@", aplikacja nie ma pola na imię.
- Adres IP nie jest deklarowany osobno: Supabase zapisuje go w logach serwera, ale nie ustalamy z niego lokalizacji.
- Supabase, Gemini API (płatny poziom), Brevo i ImprovMX to dostawcy działający w naszym imieniu (service providers), więc przekazanie im danych nie jest "udostępnianiem".
