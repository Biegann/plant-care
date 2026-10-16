-- Przekazanie własności ogrodu innemu członkowi.
-- Właściciel jest zapisany w dwóch miejscach (gardens.owner_id i garden_members.role),
-- więc obie zmiany robi jedna funkcja w jednej transakcji.
create function public.transfer_garden_ownership(p_garden_id uuid, p_new_owner_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  -- blokada wiersza ogrodu: dwa równoczesne przekazania nie mogą się przepleść
  perform 1 from public.gardens where id = p_garden_id for update;

  if not public.is_garden_owner(p_garden_id) then raise exception 'not_owner'; end if;

  if not exists (
    select 1 from public.garden_members
    where garden_id = p_garden_id and user_id = p_new_owner_id and role = 'member'
  ) then
    raise exception 'not_member';
  end if;

  update public.garden_members set role = 'owner'
  where garden_id = p_garden_id and user_id = p_new_owner_id;

  update public.garden_members set role = 'member'
  where garden_id = p_garden_id and user_id = v_user;

  update public.gardens set owner_id = p_new_owner_id where id = p_garden_id;

  -- nowy właściciel sam decyduje, kogo zaprasza
  delete from public.garden_invites where garden_id = p_garden_id and used_by is null;
end;
$$;

revoke execute on function public.transfer_garden_ownership(uuid, uuid) from public, anon;
grant execute on function public.transfer_garden_ownership(uuid, uuid) to authenticated;
