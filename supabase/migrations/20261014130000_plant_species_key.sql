-- ===== Gatunek rośliny z wbudowanej listy =====
-- Klucz gatunku z listy w aplikacji (np. "monstera-deliciosa"). Lista żyje w kodzie
-- aplikacji, więc baza pilnuje tylko formatu klucza. species_name zostaje wolnym
-- tekstem: roślina spoza listy ma nazwę gatunku, ale nie ma klucza
alter table public.plants
  add column species_key text
  check (species_key is null or species_key ~ '^[a-z0-9-]{1,60}$');

-- Uprawnienia na poziomie kolumn: nową kolumnę można ustawić przy dodawaniu i zmieniać
grant insert (species_key) on public.plants to authenticated;
grant update (species_key) on public.plants to authenticated;
