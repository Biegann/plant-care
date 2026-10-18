-- ===== Limit diagnoz AI: 5 dziennie na konto =====
-- Jeden wiersz = liczba diagnoz danego konta w danym dniu (UTC).
-- Licznik zmienia tylko Edge Function diagnose-plant (klucz service_role po stronie
-- serwera), więc użytkownik nie może go sam wyzerować
create table public.diagnosis_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  used_on date not null,
  count int not null default 0 check (count between 0 and 5),
  primary key (user_id, used_on)
);

-- ===== RLS: użytkownik widzi tylko swoje liczniki, zmian nie robi nikt przez API =====
alter table public.diagnosis_usage enable row level security;

create policy "own usage read" on public.diagnosis_usage
  for select using (user_id = auth.uid());

revoke all on public.diagnosis_usage from authenticated;
grant select on public.diagnosis_usage to authenticated;

-- ===== Pobranie jednej diagnozy z limitu =====
-- Zwraca liczbę diagnoz pozostałych na dziś po pobraniu albo -1, gdy limit wyczerpany.
-- Jedno polecenie insert ... on conflict jest atomowe: dwa równoczesne wywołania nie
-- przekroczą limitu
create function public.consume_diagnosis_quota(p_user uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  insert into public.diagnosis_usage as u (user_id, used_on, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, used_on) do update
    set count = u.count + 1
    where u.count < 5
  returning u.count into v_count;

  if v_count is null then
    return -1;
  end if;
  return 5 - v_count;
end;
$$;

-- ===== Zwrot diagnozy, gdy Gemini zawiodło (błąd po naszej stronie, nie wina użytkownika) =====
create function public.refund_diagnosis_quota(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.diagnosis_usage
  set count = greatest(count - 1, 0)
  where user_id = p_user and used_on = (now() at time zone 'utc')::date;
$$;

revoke execute on function public.consume_diagnosis_quota(uuid) from public, anon, authenticated;
revoke execute on function public.refund_diagnosis_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_diagnosis_quota(uuid) to service_role;
grant execute on function public.refund_diagnosis_quota(uuid) to service_role;
