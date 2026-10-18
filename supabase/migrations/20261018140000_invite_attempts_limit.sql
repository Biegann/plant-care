-- Limit prób dołączania kodem: najwyżej 10 nieudanych prób na godzinę na konto
-- (ochrona przed zgadywaniem kodów zaproszeń)

-- Nieudane próby; aplikacja nie ma do tabeli żadnego dostępu, pisze tylko join_garden
create table public.invite_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index invite_attempts_user_time on public.invite_attempts (user_id, attempted_at);

alter table public.invite_attempts enable row level security;
revoke all on public.invite_attempts from public, anon, authenticated;

-- Błędny kod nie zgłasza już wyjątku, tylko zwraca null: wyjątek cofnąłby
-- całe wywołanie razem z zapisem nieudanej próby, więc licznik by nie rósł
create or replace function public.join_garden(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_invite public.garden_invites%rowtype;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  -- równoległe próby tego samego konta czekają na siebie, żeby nie obejść limitu
  perform pg_advisory_xact_lock(hashtext('join_garden:' || v_user::text));

  -- porządki: próby starsze niż godzina nie są już potrzebne
  delete from public.invite_attempts where attempted_at < now() - interval '1 hour';

  if (select count(*) from public.invite_attempts where user_id = v_user) >= 10 then
    raise exception 'too_many_attempts';
  end if;

  select * into v_invite
  from public.garden_invites
  where code = upper(trim(p_code)) and used_by is null and expires_at > now()
  for update;

  if not found then
    insert into public.invite_attempts (user_id) values (v_user);
    return null;
  end if;

  if exists (
    select 1 from public.garden_members
    where garden_id = v_invite.garden_id and user_id = v_user
  ) then
    raise exception 'already_member';
  end if;

  insert into public.garden_members (garden_id, user_id, role)
  values (v_invite.garden_id, v_user, 'member');

  update public.garden_invites
  set used_by = v_user, used_at = now()
  where id = v_invite.id;

  return v_invite.garden_id;
end;
$$;
