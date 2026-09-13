-- Branş koordinatörü, kendi branşındaki HİÇBİR antrenörle mesajlaşamıyordu:
-- can_message_recipient() coach->coach mesajlaşmasını hiç tanımıyordu,
-- sadece coach->club_admin ve coach->(koçluk yaptığı grubun veli/sporcusu)
-- izinliydi. Uygulama tarafında (NewMessageScreen) "Antrenörler" filtresi
-- bu yüzden koordinatör için hep boş görünüyordu — burada kök nedeni
-- (DB seviyesindeki izin) düzeltiyoruz, aksi halde liste dolu gösterilse
-- bile gerçek gönderim bu RLS fonksiyonu yüzünden reddedilirdi.
create or replace function public.can_message_recipient(receiver_uid uuid)
returns boolean
language plpgsql
security definer cost 10000
set search_path to 'public'
as $function$
declare
  my_id uuid;
  my_role text;
  my_club_id uuid;
  receiver_role text;
  receiver_club_id uuid;
  receiver_active boolean;
begin
  select role, club_id, is_active into receiver_role, receiver_club_id, receiver_active from users where id = receiver_uid;
  if receiver_role is null or not receiver_active then
    return false;
  end if;

  select id, role, club_id into my_id, my_role, my_club_id from users where auth_user_id = auth.uid();

  if my_role = 'club_admin' then
    if receiver_role = 'super_admin' then
      return true;
    end if;
    return receiver_club_id = my_club_id;
  end if;

  if my_role = 'super_admin' then
    return receiver_role = 'club_admin';
  end if;

  if my_role = 'coach' then
    if receiver_role = 'club_admin' then
      return receiver_club_id = my_club_id;
    end if;

    if receiver_role = 'coach' then
      -- Sadece branş koordinatörleri, kendi branşlarındaki TÜM
      -- antrenörlerle mesajlaşabilir (branşlarını yönetebilmeleri için) —
      -- sıradan bir antrenör hâlâ başka antrenörlere mesaj atamaz.
      return exists (
        select 1
        from branches b
        join coach_branches cb on cb.branch_id = b.id
        where b.coordinator_user_id = my_id
          and cb.coach_id = receiver_uid
      );
    end if;

    return exists (
      select 1 from athletes a
      where (a.parent_user_id = receiver_uid or a.athlete_user_id = receiver_uid)
        and a.group_id is not null
        and is_my_coached_group(a.group_id)
    );
  end if;

  if my_role in ('parent', 'athlete') then
    if exists (
      select 1 from athletes a
      join users u on u.id = a.parent_user_id or u.id = a.athlete_user_id
      join groups g on g.id = a.group_id
      where u.auth_user_id = auth.uid()
        and (
          g.head_coach_id = receiver_uid
          or exists (select 1 from group_coaches gc where gc.group_id = g.id and gc.coach_id = receiver_uid)
        )
    ) then
      return true;
    end if;

    return exists (
      select 1 from athletes a
      join users u on u.id = a.parent_user_id or u.id = a.athlete_user_id
      join groups g on g.id = a.group_id
      join branches b on b.name = g.branch and b.club_id = g.club_id
      where u.auth_user_id = auth.uid()
        and b.coordinator_user_id = receiver_uid
    );
  end if;

  return false;
end;
$function$;
