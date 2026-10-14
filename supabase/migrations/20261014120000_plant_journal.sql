-- ===== Tabela dziennika roślin =====
-- Ręczne wpisy z notatką i/lub jednym zdjęciem. Usunięcie rośliny kasuje jej wpisy
-- (pliki zdjęć usuwa aplikacja). Zdjęcia leżą w buckecie plant-photos pod
-- <id ogrodu>/journal/<nazwa>.jpg, więc obejmują je istniejące reguły bucketu
create table public.plant_journal (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  entry_on date not null check (entry_on >= date '2000-01-01'),
  note text check (note is null or char_length(trim(note)) between 1 and 500),
  photo_path text check (photo_path is null or char_length(photo_path) <= 200),
  -- odwołanie do profilu (nie auth.users), żeby aplikacja mogła dołączyć nazwę osoby
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint plant_journal_not_empty check (note is not null or photo_path is not null)
);
create index plant_journal_plant_id_entry_on_idx
  on public.plant_journal(plant_id, entry_on desc, created_at desc);

-- ===== Reguły dostępu (RLS): członkowie ogrodu mają pełny dostęp do dziennika jego roślin =====
alter table public.plant_journal enable row level security;

create policy "members read journal" on public.plant_journal
  for select using (
    exists (
      select 1 from public.plants p
      where p.id = plant_journal.plant_id and public.is_garden_member(p.garden_id)
    )
  );
create policy "members add journal" on public.plant_journal
  for insert with check (
    exists (
      select 1 from public.plants p
      where p.id = plant_journal.plant_id and public.is_garden_member(p.garden_id)
    )
  );
create policy "members update journal" on public.plant_journal
  for update using (
    exists (
      select 1 from public.plants p
      where p.id = plant_journal.plant_id and public.is_garden_member(p.garden_id)
    )
  );
create policy "members delete journal" on public.plant_journal
  for delete using (
    exists (
      select 1 from public.plants p
      where p.id = plant_journal.plant_id and public.is_garden_member(p.garden_id)
    )
  );

-- ===== Uprawnienia na poziomie kolumn =====
-- dodawanie: bez id, autora i daty utworzenia (ustawia je baza)
revoke insert on public.plant_journal from authenticated;
grant insert (plant_id, entry_on, note, photo_path) on public.plant_journal to authenticated;

-- zmiana: nie można przenieść wpisu do innej rośliny ani zmienić autora
revoke update on public.plant_journal from authenticated;
grant update (entry_on, note, photo_path) on public.plant_journal to authenticated;
