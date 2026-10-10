-- ===== Tabele =====
create table public.gardens (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.garden_members (
  garden_id uuid not null references public.gardens(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (garden_id, user_id)
);
create index garden_members_user_id_idx on public.garden_members(user_id);

create table public.garden_invites (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== Funkcje pomocnicze (omijają RLS, dzięki temu nie ma pętli) =====
create function public.is_garden_member(p_garden_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.garden_members
    where garden_id = p_garden_id and user_id = auth.uid()
  );
$$;

create function public.is_garden_owner(p_garden_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.garden_members
    where garden_id = p_garden_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create function public.shares_garden_with(p_user uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.garden_members me
    join public.garden_members other on other.garden_id = me.garden_id
    where me.user_id = auth.uid() and other.user_id = p_user
  );
$$;

-- ===== Funkcje wywoływane z aplikacji =====
create function public.create_garden(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  insert into public.gardens (name, owner_id)
  values (trim(p_name), v_user)
  returning id into v_id;

  insert into public.garden_members (garden_id, user_id, role)
  values (v_id, v_user, 'owner');

  return v_id;
end;
$$;

create function public.create_invite(p_garden_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  if not public.is_garden_owner(p_garden_id) then raise exception 'not_owner'; end if;

  -- nowy kod unieważnia poprzednie niewykorzystane
  delete from public.garden_invites where garden_id = p_garden_id and used_by is null;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (select 1 from public.garden_invites where code = v_code);
  end loop;

  insert into public.garden_invites (garden_id, code, created_by, expires_at)
  values (p_garden_id, v_code, auth.uid(), now() + interval '14 days');

  return v_code;
end;
$$;

create function public.join_garden(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_invite public.garden_invites%rowtype;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  select * into v_invite
  from public.garden_invites
  where code = upper(trim(p_code)) and used_by is null and expires_at > now()
  for update;

  if not found then raise exception 'invalid_code'; end if;

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

-- ===== Uprawnienia do funkcji: tylko zalogowani =====
revoke execute on function
  public.is_garden_member(uuid), public.is_garden_owner(uuid), public.shares_garden_with(uuid),
  public.create_garden(text), public.create_invite(uuid), public.join_garden(text)
from public, anon;

grant execute on function
  public.is_garden_member(uuid), public.is_garden_owner(uuid), public.shares_garden_with(uuid),
  public.create_garden(text), public.create_invite(uuid), public.join_garden(text)
to authenticated;

-- ===== Reguły dostępu (RLS) =====
alter table public.gardens enable row level security;
alter table public.garden_members enable row level security;
alter table public.garden_invites enable row level security;

-- ogrody: widzą członkowie, zmienia nazwę i usuwa tylko właściciel, zakładanie przez create_garden
create policy "members read gardens" on public.gardens
  for select using (public.is_garden_member(id));
create policy "owner updates garden" on public.gardens
  for update using (public.is_garden_owner(id)) with check (public.is_garden_owner(id));
create policy "owner deletes garden" on public.gardens
  for delete using (public.is_garden_owner(id));

-- z ogrodu można zmienić tylko nazwę
revoke update on public.gardens from authenticated;
grant update (name) on public.gardens to authenticated;

-- członkowie: widzą ich wszyscy członkowie ogrodu; usunąć można tylko zwykłego członka
-- (samego siebie albo jako właściciel), właściciela nie można; dodawanie przez join_garden
create policy "members read members" on public.garden_members
  for select using (public.is_garden_member(garden_id));
create policy "leave or remove member" on public.garden_members
  for delete using (
    role = 'member' and (user_id = auth.uid() or public.is_garden_owner(garden_id))
  );

-- zaproszenia: widzi i cofa tylko właściciel, tworzenie przez create_invite
create policy "owner reads invites" on public.garden_invites
  for select using (public.is_garden_owner(garden_id));
create policy "owner deletes invites" on public.garden_invites
  for delete using (public.is_garden_owner(garden_id));

-- profile: członkowie tego samego ogrodu widzą swoje nazwy
create policy "garden mates read profiles" on public.profiles
  for select using (public.shares_garden_with(id));