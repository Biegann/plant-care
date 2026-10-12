-- ===== Tabela historii opieki =====
-- Wpis należy do rośliny (nie do zadania) i ma własną kopię rodzaju i nazwy,
-- więc zostaje po usunięciu zadania; usunięcie rośliny kasuje jej historię
create table public.care_log (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  type text not null check (type in ('water', 'fertilize', 'repot', 'other')),
  custom_label text check (custom_label is null or char_length(trim(custom_label)) between 1 and 40),
  done_on date not null,
  -- odwołanie do profilu (nie auth.users), żeby aplikacja mogła dołączyć nazwę osoby
  done_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint care_log_label_only_for_other check ((type = 'other') = (custom_label is not null))
);
create index care_log_plant_id_done_on_idx on public.care_log(plant_id, done_on desc);

-- ===== Reguły dostępu (RLS): członkowie ogrodu czytają i usuwają wpisy jego roślin =====
alter table public.care_log enable row level security;

create policy "members read care log" on public.care_log
  for select using (
    exists (
      select 1 from public.plants p
      where p.id = care_log.plant_id and public.is_garden_member(p.garden_id)
    )
  );
create policy "members delete care log" on public.care_log
  for delete using (
    exists (
      select 1 from public.plants p
      where p.id = care_log.plant_id and public.is_garden_member(p.garden_id)
    )
  );

-- wpisy powstają tylko przez funkcję complete_care_task i nie da się ich zmieniać
revoke insert, update on public.care_log from authenticated;

-- ===== "Zrobione": w jednym kroku zapisuje wpis w historii i przesuwa termin zadania =====
-- Zwraca nowy termin. p_done_on to "dziś" z telefonu; baza dopuszcza różnicę 1 dnia (strefy czasowe)
create function public.complete_care_task(p_task_id uuid, p_done_on date) returns date
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_task public.care_tasks%rowtype;
  v_next date;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_done_on is null or p_done_on not between current_date - 1 and current_date + 1 then
    raise exception 'invalid_done_on' using errcode = '23514';
  end if;

  select t.* into v_task
  from public.care_tasks t
  join public.plants p on p.id = t.plant_id
  where t.id = p_task_id and public.is_garden_member(p.garden_id)
  for update of t;

  if not found then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  insert into public.care_log (plant_id, type, custom_label, done_on, done_by)
  values (v_task.plant_id, v_task.type, v_task.custom_label, p_done_on, v_user);

  v_next := p_done_on + v_task.interval_days;
  update public.care_tasks set next_due_on = v_next where id = v_task.id;

  return v_next;
end;
$$;

revoke execute on function public.complete_care_task(uuid, date) from public, anon;
grant execute on function public.complete_care_task(uuid, date) to authenticated;
