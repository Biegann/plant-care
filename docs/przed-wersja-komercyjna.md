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
do $$
declare
  r text[] := array[]::text[];
  v_plant uuid := '0a5a4b13-d193-43f1-bfd6-f767671f9dec';
  v_owner text := 'a1eb5031-4a80-4a68-8104-14da41766368';
  v_member text := '4cd2f03e-0197-4a42-90f4-3b0f95bf0b42';
  v_outsider text := '11111111-2222-3333-4444-555555555555';
  v_id uuid;
  v_n int;
begin
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  insert into public.plant_journal (plant_id, entry_on, note) values (v_plant, current_date, 'A') returning id into v_id;

  perform set_config('request.jwt.claims', json_build_object('sub', v_outsider, 'role', 'authenticated')::text, true);
  delete from public.plant_journal where id = v_id;
  get diagnostics v_n = row_count;
  r := array_append(r, '1 outsider delete: ' || v_n);

  perform set_config('request.jwt.claims', json_build_object('sub', v_member, 'role', 'authenticated')::text, true);
  delete from public.plant_journal where id = v_id;
  get diagnostics v_n = row_count;
  r := array_append(r, '2 member delete: ' || v_n);

  insert into public.plant_journal (plant_id, entry_on, note) values (v_plant, current_date, 'B') returning id into v_id;
  delete from public.plants where id = v_plant;
  select count(*) into v_n from public.plant_journal where id = v_id;
  r := array_append(r, '3 wpis po usunięciu rośliny: ' || v_n);

  raise exception E'WYNIKI:\n%', array_to_string(r, E'\n');
end $$;