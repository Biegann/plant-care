-- ===== Tabela roślin =====
create table public.plants (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  species_name text check (species_name is null or char_length(species_name) <= 80),
  location_note text check (location_note is null or char_length(location_note) <= 80),
  purchase_date date,
  notes text check (notes is null or char_length(notes) <= 1000),
  photo_path text,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index plants_garden_id_idx on public.plants(garden_id);

-- ===== Reguły dostępu (RLS): członkowie ogrodu mają pełny dostęp do jego roślin =====
alter table public.plants enable row level security;

create policy "members read plants" on public.plants
  for select using (public.is_garden_member(garden_id));
create policy "members add plants" on public.plants
  for insert with check (public.is_garden_member(garden_id));
create policy "members update plants" on public.plants
  for update using (public.is_garden_member(garden_id))
  with check (public.is_garden_member(garden_id));
create policy "members delete plants" on public.plants
  for delete using (public.is_garden_member(garden_id));

-- ===== Uprawnienia na poziomie kolumn =====
-- dodawanie: bez id, autora i daty (ustawia je baza)
revoke insert on public.plants from authenticated;
grant insert (garden_id, name, species_name, location_note, purchase_date, notes, photo_path)
  on public.plants to authenticated;

-- zmiana: nie można przenieść rośliny do innego ogrodu ani zmienić autora
revoke update on public.plants from authenticated;
grant update (name, species_name, location_note, purchase_date, notes, photo_path, archived_at)
  on public.plants to authenticated;

-- ===== Prywatny magazyn zdjęć =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('plant-photos', 'plant-photos', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

-- ścieżka pliku: <id ogrodu>/<nazwa>.jpg, dostęp mają członkowie tego ogrodu
create policy "members read plant photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'plant-photos'
    and public.is_garden_member(((storage.foldername(name))[1])::uuid)
  );
create policy "members upload plant photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'plant-photos'
    and public.is_garden_member(((storage.foldername(name))[1])::uuid)
  );
create policy "members update plant photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'plant-photos'
    and public.is_garden_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'plant-photos'
    and public.is_garden_member(((storage.foldername(name))[1])::uuid)
  );
create policy "members delete plant photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'plant-photos'
    and public.is_garden_member(((storage.foldername(name))[1])::uuid)
  );