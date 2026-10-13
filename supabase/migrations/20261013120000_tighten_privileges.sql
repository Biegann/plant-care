-- Uszczelnienie uprawnień: do tej pory niezalogowanych (anon) blokował tylko RLS,
-- a TRUNCATE w ogóle nie podlega RLS

-- 1. Niezalogowany nie ma żadnych uprawnień do tabel aplikacji
revoke all on all tables in schema public from anon;

-- 2. Zalogowany nie potrzebuje czyszczenia tabel, kluczy obcych ani triggerów
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- 3. Funkcję triggera woła tylko baza przy zakładaniu konta, nikt przez API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4. To samo dla tabel, które powstaną w kolejnych migracjach
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from authenticated;
