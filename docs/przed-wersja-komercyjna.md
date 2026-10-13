# Do zrobienia przed wersją komercyjną

- [ ] Włączyć "Confirm email" w Supabase (Authentication → Providers → Email)
- [ ] Własna domena dla e-maili + rekordy SPF/DKIM/DMARC w Brevo (zamiast nadawcy z Gmaila)
- [ ] Sprawdzić limity wysyłki e-maili i plan Brevo
- [ ] Polityka prywatności i zgodność z RODO
- [ ] Rozważyć logowanie przez Google/Apple (na iOS Apple wymaga wtedy "Zaloguj się przez Apple")
- [ ] Test scenariuszy end-to-end w Maestro na wersji instalacyjnej
- [ ] Sprawdzić licencje API zewnętrznych (rozpoznawanie roślin, pogoda) pod użytek komercyjny
- [ ] Przełącznik języka PL/EN w ustawieniach aplikacji
- [ ] Ograniczyć liczbę prób wpisywania kodu zaproszenia (ochrona przed zgadywaniem) i rozważyć dłuższe kody
- [ ] Dodać przekazywanie własności ogrodu (funkcja transfer_garden: zmiana ról właściciel/członek)
- [ ] Ekran powitalny przy pierwszym uruchomieniu (zamiast pustej zakładki Ogrody)
- [ ] Skonfigurować uprawnienia aparatu i zdjęć w app.json (plugin expo-image-picker) przed pierwszą wersją instalacyjną
- [ ] Dodać adres i klucz Supabase jako zmienne środowiskowe w EAS: plik `.env` nie trafia do kompilacji w chmurze, więc wersja instalacyjna (inna niż deweloperska) nie połączy się bez nich z bazą
- [ ] Ustalić ostateczny identyfikator aplikacji na Androida (`android.package` w app.json, teraz roboczo `com.plantcare.app`); po publikacji w sklepie nie da się go zmienić
- [ ] Własna ikona powiadomień na Androidzie (biała, przezroczyste tło, 96x96) w ustawieniach pluginu expo-notifications
- [ ] Przejść z powiadomień lokalnych na serwerowe (push), żeby przypomnienie nie przychodziło, gdy inny członek ogrodu wykonał już zadanie. Wymaga: Firebase dla Androida, tabeli z adresami urządzeń, godziny i strefy czasowej na koncie, funkcji serwerowej uruchamianej cyklicznie w Supabase
- [ ] KONIECZNIE przed publikacją w Google Play: zastąpić uprawnienie `USE_EXACT_ALARM` (w app.json, daje punktualne powiadomienia) rozwiązaniem zgodnym z zasadami sklepu. Google dopuszcza je tylko dla wąskiej grupy aplikacji (głównie budziki i kalendarze) i może odrzucić aplikację. Możliwości: powiadomienia serwerowe (push, punkt wyżej; wtedy uprawnienie znika całkiem) albo `SCHEDULE_EXACT_ALARM` z podpowiedzią w Profilu, żeby użytkownik włączył "Alarmy i przypomnienia" w ustawieniach telefonu (expo-notifications nie udostępnia informacji, czy pozwolenie jest, więc potrzebny będzie dodatkowy moduł natywny). Bez żadnego z tych uprawnień Android odkłada powiadomienie nawet o godzinę, gdy aplikacja jest w tle (zmierzone 13.10.2026)
