-- Sporcu→sporcu mesajlaşma (aynı grup) geri açılıyor; ama karşı tarafın users
-- satırı (telefon, adres, vb.) yine GÖRÜNMEZ. Sadece ad soyad, aşağıdaki
-- fonksiyon üzerinden dönüyor.

-- 1) can_message_recipient: sporcu → aynı gruptaki aktif sporcu dalını geri ekle.
do $$
declare v text; v2 text;
begin
  v := pg_get_functiondef('public.can_message_recipient(uuid)'::regprocedure);
  v2 := replace(
    v,
    E'    end if;\n\n    return false;\n  end if;\n\n  return false;',
    E'    end if;\n\n    -- Sporcu, kendi grubundaki diğer sporculara yazabilir (sadece\n    -- athlete->athlete, aynı grup).\n    if my_role = ''athlete'' and receiver_role = ''athlete'' then\n      return exists (\n        select 1 from athletes a1\n        join athletes a2 on a2.group_id = a1.group_id\n        where a1.athlete_user_id = my_id\n          and a1.group_id is not null\n          and a2.athlete_user_id = receiver_uid\n          and a2.status = ''active''\n      );\n    end if;\n\n    return false;\n  end if;\n\n  return false;'
  );
  if v2 = v then raise exception 'can_message_recipient athlete dalı eklenemedi'; end if;
  execute v2;
end $$;

-- 2) Grup arkadaşı sporcuların SADECE adı (foto/telefon/vb. yok).
create or replace function public.list_groupmate_athlete_contacts()
returns table (id uuid, name text, photo_url text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct u.id, u.name, null::text as photo_url, u.role::text
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
revoke execute on function public.list_groupmate_athlete_contacts() from public, anon;
grant execute on function public.list_groupmate_athlete_contacts() to authenticated, service_role;
