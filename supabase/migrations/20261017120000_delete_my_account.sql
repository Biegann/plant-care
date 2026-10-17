-- Usunięcie własnego konta.
-- Aplikacja nie ma dostępu do auth.users, więc konto kasuje ta funkcja (tylko konto wywołującego).
-- Kaskady w bazie usuwają profil, członkostwa i ogrody, których użytkownik jest właścicielem;
-- w pozostałych ogrodach jego rośliny, zadania, historia i dziennik zostają (autor = null).
-- Pliki zdjęć aplikacja kasuje wcześniej (Storage nie da się czyścić z SQL).
create function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  -- nie kasujemy cudzych roślin: ogród z innymi członkami trzeba najpierw przekazać lub usunąć
  if exists (
    select 1 from public.gardens g
    join public.garden_members m on m.garden_id = g.id and m.user_id <> v_user
    where g.owner_id = v_user
  ) then
    raise exception 'owns_shared_garden';
  end if;

  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
