-- İki eksik mesajlaşma izni ekleniyor (can_message_recipient):
--
-- 1) Düz (koordinatör olmayan) bir antrenör, kendi branşındaki diğer
--    antrenörlere mesaj gönderemiyordu — sadece branş koordinatörü
--    branşındaki HERKESE yazabiliyordu, sıradan antrenör hiç kimseye
--    yazamıyordu (bkz. önceki migration'ın kendi yorumu: "sıradan bir
--    antrenör hâlâ başka antrenörlere mesaj atamaz" — bu artık isteniyor).
--    Artık aynı branşı paylaşan (coach_branches üzerinden) HERHANGİ İKİ
--    antrenör birbirine yazabilir — koordinatörlük hâlâ ayrıca kapsanıyor
--    (coordinator_user_id ile coach_branches arasında bir eşleşme olmasa
--    bile).
--
-- 2) Sporcu, kendi grubundaki diğer sporculara mesaj gönderemiyordu —
--    sadece antrenörlerine (baş/yardımcı/koordinatör) yazabiliyordu. Veli
--    rolüne bilerek DOKUNULMADI (veli->veli ya da veli->başka sporcu
--    kapsam dışı, sadece "sporcu->sporcu, aynı grup" istendi).
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
      -- Aynı branşı paylaşan HERHANGİ iki antrenör birbirine yazabilir.
      if exists (
        select 1
        from coach_branches cb1
        join coach_branches cb2 on cb2.branch_id = cb1.branch_id
        where cb1.coach_id = my_id and cb2.coach_id = receiver_uid
      ) then
        return true;
      end if;
      -- Koordinatörlük coach_branches'te ayrı bir satır gerektirmeyebilir
      -- (branches.coordinator_user_id doğrudan atanmış olabilir) — her iki
      -- yönde de (ben koordinatörüm / o koordinatör) ayrıca kontrol.
      return exists (
        select 1 from branches b
        join coach_branches cb on cb.branch_id = b.id
        where (b.coordinator_user_id = my_id and cb.coach_id = receiver_uid)
           or (b.coordinator_user_id = receiver_uid and cb.coach_id = my_id)
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

    if exists (
      select 1 from athletes a
      join users u on u.id = a.parent_user_id or u.id = a.athlete_user_id
      join groups g on g.id = a.group_id
      join branches b on b.name = g.branch and b.club_id = g.club_id
      where u.auth_user_id = auth.uid()
        and b.coordinator_user_id = receiver_uid
    ) then
      return true;
    end if;

    -- Sporcu, kendi grubundaki diğer sporculara yazabilir (sadece
    -- athlete->athlete, aynı grup).
    if my_role = 'athlete' and receiver_role = 'athlete' then
      return exists (
        select 1 from athletes a1
        join athletes a2 on a2.group_id = a1.group_id
        where a1.athlete_user_id = my_id
          and a1.group_id is not null
          and a2.athlete_user_id = receiver_uid
          and a2.status = 'active'
      );
    end if;

    return false;
  end if;

  return false;
end;
$function$;
