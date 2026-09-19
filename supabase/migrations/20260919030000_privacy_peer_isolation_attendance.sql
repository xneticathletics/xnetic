-- Gizlilik: sporcu hesapları grup arkadaşlarının users satırını (telefon, e-posta,
-- adres, doğum tarihi, acil durum kişisi) okuyabiliyordu. Veli/sporcu birbirinin
-- hiçbir bilgisini görmemeli. Sporcu→sporcu mesajlaşma da (isim gerektirdiği için)
-- kaldırılıyor; zaten arayüzde çalışmıyordu (0 mesaj).
drop policy if exists users_select_groupmate_athletes on public.users;

do $$
declare v text;
begin
  v := pg_get_functiondef('public.can_message_recipient(uuid)'::regprocedure);
  v := regexp_replace(
    v,
    E'    -- Sporcu, kendi grubundaki diğer sporculara yazabilir.*?    end if;\\n\\n    return false;',
    E'    return false;',
    's'
  );
  if v like '%my_role = ''athlete'' and receiver_role = ''athlete''%' then
    raise exception 'can_message_recipient athlete->athlete dalı temizlenemedi';
  end if;
  execute v;
end $$;

-- Yoklama: antrenör sadece KENDİ grubunun oturumuna, o grubun sporcusu için
-- yoklama yazabilsin. Admin de başka kulübün sporcusuna yazamasın.
create or replace function public.can_write_attendance(p_session_id uuid, p_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from training_sessions s
    join athletes a on a.id = p_athlete_id and a.club_id = s.club_id
    where s.id = p_session_id
      and s.club_id = current_club_id()
      and (
        public.is_admin_tier()
        or (
          public.is_my_coached_group(s.group_id)
          and (
            a.group_id = s.group_id
            or exists (select 1 from athlete_groups ag where ag.athlete_id = a.id and ag.group_id = s.group_id)
          )
        )
      )
  );
$$;
revoke execute on function public.can_write_attendance(uuid, uuid) from public, anon;
grant execute on function public.can_write_attendance(uuid, uuid) to authenticated, service_role;

drop policy if exists attendance_admin_all on public.attendance;
create policy attendance_admin_all on public.attendance
  for all
  using (is_admin_tier() and exists (select 1 from training_sessions s where s.id = attendance.session_id and s.club_id = current_club_id()))
  with check (public.can_write_attendance(session_id, athlete_id));

drop policy if exists attendance_coach_insert on public.attendance;
create policy attendance_coach_insert on public.attendance
  for insert
  with check (is_athletes_coach(athlete_id) and public.can_write_attendance(session_id, athlete_id));

drop policy if exists attendance_coach_update on public.attendance;
create policy attendance_coach_update on public.attendance
  for update
  using (is_athletes_coach(athlete_id))
  with check (is_athletes_coach(athlete_id) and public.can_write_attendance(session_id, athlete_id));
