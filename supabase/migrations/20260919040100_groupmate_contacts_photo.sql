-- Mesajlaşma listesinde küçük profil fotoğrafı da görünsün: ad soyad + fotoğraf
-- (başka hiçbir alan dönmez).
create or replace function public.list_groupmate_athlete_contacts()
returns table (id uuid, name text, photo_url text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct u.id, u.name, u.photo_url, u.role::text
  from athletes me
  join athletes o on o.group_id = me.group_id
  join users u on u.id = o.athlete_user_id
  where me.athlete_user_id = my_user_id()
    and me.group_id is not null
    and o.status = 'active'
    and u.is_active
    and u.id <> my_user_id()
    and u.club_id = current_club_id()
    and current_user_role() = 'athlete';
$$;
