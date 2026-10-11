-- ===== Tabela zadań opieki =====
create table public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  type text not null check (type in ('water', 'fertilize', 'repot', 'other')),
  custom_label text check (custom_label is null or char_length(trim(custom_label)) between 1 and 40),
  interval_days integer not null check (interval_days between 1 and 730),
  next_due_on date not null,
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  -- własną nazwę ma tylko zadanie typu "inne" i musi ją mieć
  constraint care_tasks_label_only_for_other check ((type = 'other') = (custom_label is not null))
);
create index care_tasks_plant_id_idx on public.care_tasks(plant_id);

-- jedna roślina ma najwyżej jedno podlewanie, nawożenie i przesadzanie; zadań "inne" może być kilka
create unique index care_tasks_one_per_type_idx
  on public.care_tasks(plant_id, type) where type <> 'other';

-- ===== Reguły dostępu (RLS): członkowie ogrodu mają pełny dostęp do zadań jego roślin =====
alter table public.care_tasks enable row level security;

create policy "members read care tasks" on public.care_tasks
  for select using (
    exists (
      select 1 from public.plants p
      where p.id = care_tasks.plant_id and public.is_garden_member(p.garden_id)
    )
  );
create policy "members add care tasks" on public.care_tasks
  for insert with check (
    exists (
      select 1 from public.plants p
      where p.id = care_tasks.plant_id and public.is_garden_member(p.garden_id)
    )
  );
create policy "members update care tasks" on public.care_tasks
  for update using (
    exists (
      select 1 from public.plants p
      where p.id = care_tasks.plant_id and public.is_garden_member(p.garden_id)
    )
  )
  with check (
    exists (
      select 1 from public.plants p
      where p.id = care_tasks.plant_id and public.is_garden_member(p.garden_id)
    )
  );
create policy "members delete care tasks" on public.care_tasks
  for delete using (
    exists (
      select 1 from public.plants p
      where p.id = care_tasks.plant_id and public.is_garden_member(p.garden_id)
    )
  );

-- ===== Uprawnienia na poziomie kolumn =====
-- dodawanie: bez id, autora i daty (ustawia je baza)
revoke insert on public.care_tasks from authenticated;
grant insert (plant_id, type, custom_label, interval_days, next_due_on, enabled)
  on public.care_tasks to authenticated;

-- zmiana: nie można przenieść zadania do innej rośliny, zmienić jego typu ani autora
revoke update on public.care_tasks from authenticated;
grant update (custom_label, interval_days, next_due_on, enabled)
  on public.care_tasks to authenticated;
