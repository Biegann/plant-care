# Plant Care: zasady pracy

Zasady dotyczące Expo i poleceń są w pliku AGENTS.md: @AGENTS.md

## 1. Jak współpracujemy

- Jestem początkującym programistą-hobbystą. Pracuję na Windows 11 (PowerShell, VS Code). Odpowiadaj po polsku.
- Chcę rozumieć, co robimy. Przed każdym krokiem napisz krótko "po co to robimy" (1-3 zdania) i tłumacz nieoczywiste rzeczy. Idziemy małymi krokami, po jednym punkcie naraz.
- Decyzje produktowe i wizualne należą do mnie. Zanim zbudujesz nową funkcję lub ekran, przedstaw projekt (krótkie szkice ASCII, lista ekranów), podaj 1-2 pytania decyzyjne z opcjami i swoją rekomendacją, i poczekaj na moją odpowiedź. Drobne decyzje implementacyjne podejmuj sam, ale wypisz je jako "Założenia", żebym mógł je zmienić.
- Rytm każdego etapu: projekt -> moja decyzja -> implementacja w małych częściach -> testy automatyczne zielone + `npx tsc --noEmit` czysty -> scenariusz ręczny na telefonie (opisz mi go krok po kroku) -> dopiero po moim potwierdzeniu commit i push.
- Nie rób commita ani pusha bez mojego potwierdzenia. Komunikaty commitów po polsku.
- Uruchamiaj testy i tsc sam i podawaj prawdziwe wyniki. Nie zgaduj liczby testów.
- Oszczędzam tokeny: bądź zwięzły, nie wypisuj dużych plików bez potrzeby, ale nie rezygnuj z wyjaśnień "po co".
- Zawsze najpierw sprawdź, co już istnieje, żeby nie tworzyć duplikatów plików ani niespójnego modelu danych.
- Bądź szczery: jeśli widzisz niespójność, błąd lub lepsze rozwiązanie, powiedz to wprost.
- Środowisko: nie mamy podpiętego Supabase CLI, ale jest connector Supabase (projekt `plant-care`). Migracje SQL zapisujesz w `supabase/migrations`. Odczyty i testy dostępu, które niczego nie zmieniają, uruchamiasz sam i podajesz mi wynik. Każdą migrację zmieniającą bazę najpierw mi pokazujesz i uruchamiasz dopiero po moim "ok".
- Plik `.env` (EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY) jest lokalny i ignorowany przez Git: nigdy go nie wypisuj ani nie commituj. Nigdy nie używaj klucza service_role w aplikacji.

## 2. Zatwierdzone decyzje

- Funkcje MVP: logowanie, wspólny ogród, lista roślin, harmonogram opieki (podlewanie, nawożenie, przesadzanie, własne interwały), powiadomienia (też o nawożeniu), historia opieki. Później: baza gatunków, dziennik ze zdjęciami, rozpoznawanie rośliny ze zdjęcia, pogoda, diagnoza AI, statystyki/eksport/motywy/widgety.
- Model: użytkownik -> wiele ogrodów -> rośliny należą do ogrodu. Role: owner/member. Kod zaproszenia jednorazowy, ważny 14 dni. Zapraszać, usuwać członków i usuwać ogród może tylko właściciel; członek ma pełny dostęp do roślin i może opuścić ogród; właściciel nie może opuścić ogrodu (tylko go usunąć). W przyszłości dojdzie przekazywanie własności ogrodu.
- Powiadomienia (M5): jedno zbiorcze dziennie o ustawianej godzinie, lokalne (expo-notifications), działają offline, zbierają zadania ze wszystkich ogrodów.
- Logowanie w v1 tylko e-mail + hasło. Reset hasła kodem z e-maila (bez linków). "Confirm email" w Supabase jest wyłączone na czas budowy.
- Języki PL + EN, przełącznik w ustawieniach dojdzie później.
- Rośliny: tylko trwałe usuwanie z potwierdzeniem (archiwizacja później, kolumna archived_at już jest). Zdjęcia zmniejszane do 800 px dłuższego boku, JPEG jakość 60%, prywatny bucket + podpisane linki. Data zakupu wybierana systemowym kalendarzem (@react-native-community/datetimepicker, z możliwością wyczyszczenia). Na liście roślin jest wyszukiwarka. Lista ma być zwarta (jak najwięcej roślin na ekranie, ale czytelnie).
- Zakładki: Rośliny (trasa index, startowa), Ogrody (gardens), Profil (profile). Później dojdzie "Dziś". Ekran powitalny przy pierwszym uruchomieniu też dojdzie później.
- Logika sesji przy resecie hasła: flaga `recovering` w useSession, żeby strażnik tras nie przerzucił użytkownika do aplikacji między weryfikacją kodu a zmianą hasła.

## 3. Konwencje w kodzie

- Struktura: `src/app` zawiera tylko cienkie ekrany (bez testów w środku, bo pliki tam są trasami); logika w `src/modules/<moduł>/{api,hooks,ui,store}` + `validation.ts` + `__tests__`; wspólne rzeczy w `src/shared/{api,ui,i18n}`.
- Funkcje API zwracają `{ ok: true, data } | { ok: false, error: KodBłędu }` i nie rzucają wyjątków; błędy bazy mapują funkcje `mapAuthError`, `mapGardenError`, `mapPlantError`. Hooki TanStack Query rzucają `new Error(kod)`.
- Walidacja zwraca kody błędów, nie teksty. UI tłumaczy je przez `t('<moduł>.errors.<kod>')`. Żadnych tekstów na sztywno: wszystko w `src/shared/i18n/locales/pl.json` i `en.json`.
- Wzorzec "...AndRefresh": funkcja wywołuje API, a po sukcesie unieważnia klucze zapytań (`['gardens']`, `['garden-members', id]`, `['plants', gardenId]`, `['plant-photo', path]`). Wspólny `queryClient` jest w `shared/api/queryClient.ts` i jest czyszczony po wylogowaniu.
- UI: komponent `Screen` (SafeAreaView), wspólne style `ui` w `shared/ui/styles.ts`, kolor główny #2e7d32, formularze z lokalnym stanem, testID na elementach interaktywnych, blokada przycisku podczas ładowania.
- Baza: migracje o nazwach z datą (np. 20261011120000_plants.sql). RLS na każdej tabeli; funkcje pomocnicze `is_garden_member`, `is_garden_owner`, `shares_garden_with` (security definer, execute tylko dla authenticated); uprawnienia na poziomie kolumn; wrażliwe operacje przez funkcje RPC (`create_garden`, `create_invite`, `join_garden`). Zdjęcia: bucket `plant-photos`, ścieżka `<id ogrodu>/<nazwa>.jpg`, reguły oparte na członkostwie w ogrodzie.
- Test bazy po każdej migracji: blok `do $$ ... $$`, który podszywa się pod użytkowników (`set local role authenticated` + `set_config('request.jwt.claims', ...)`), zbiera wyniki do tablicy tekstów w `array_append` (nie `||` z gołym literałem) i wypisuje je przez `raise exception` (baza zostaje nietknięta). Podaj oczekiwany i rzeczywisty wynik.
- Testy Jest: moduł `shared/api/supabase` zawsze mockujemy (prawdziwy rzuca błąd bez .env); `react-i18next` mockujemy tak, by `t` zwracało klucz; `expo-router` i `@expo/vector-icons` mockujemy; AsyncStorage przez `@react-native-async-storage/async-storage/jest/async-storage-mock`; w testach używamy `await render(...)` i `await fireEvent...`; `afterEach(() => jest.resetAllMocks())`; klient TanStack w testach z `gcTime: Infinity`; w tsconfig jest `"types": ["jest"]`.
- Typowane trasy: po dodaniu nowych plików tras trzeba raz uruchomić `npx expo start`, zatrzymać, zrestartować TS Server w VS Code, i dopiero wtedy `npx tsc --noEmit`.
- Definicja ukończenia kroku: testy zielone, tsc czysty, scenariusz na telefonie zaliczony, commit + push po moim "ok".
