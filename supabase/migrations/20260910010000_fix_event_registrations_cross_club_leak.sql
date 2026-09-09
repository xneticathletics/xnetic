-- KRİTİK BULGU (bugünkü tarama sırasında, event_registrations tablosuna
-- dokunan yeni bir client fonksiyonu eklerken fark edildi): bu tablonun
-- hiç club_id sütunu YOKTU. Bu yüzden:
--   1) event_registrations_select politikasındaki is_admin_tier() dalı
--      hiçbir kulüp sınırı olmadan HERHANGİ bir club_admin/accounting
--      rolündeki kullanıcının PLATFORMDAKİ TÜM kulüplerin kayıtlarını
--      (sporcu adı, ödenen tutar, dekont/makbuz URL'si, not dahil)
--      görebilmesine izin veriyordu.
--   2) update_event_registration_status() RPC'sindeki yetki kontrolü de
--      aynı şekilde club_id'siz is_admin_tier() kullanıyordu — yani
--      HERHANGİ bir kulübün admin'i BAŞKA bir kulübün kayıt onay/red
--      işlemini yapabiliyordu (okuma değil, YAZMA/müdahale açığı).
-- create_event_registration() RPC'si zaten is_my_athlete() ile sporcu
-- sahipliğini doğru kontrol ediyordu, ama oluşan satırın kendisi hiç
-- kulüple etiketlenmiyordu — sorunun kökü buydu.
--
-- Şimdi bu oturumda zaten defalarca uygulanan standart desen izleniyor:
-- club_id sütunu eklenip mevcut satırlar events.club_id'den dolduruluyor,
-- RLS ve her iki RPC de club_id = current_club_id() ile kilitleniyor.

alter table public.event_registrations add column club_id uuid references public.clubs(id);

update public.event_registrations er
set club_id = e.club_id
from public.events e
where e.id = er.event_id and er.club_id is null;

alter table public.event_registrations alter column club_id set not null;
create index event_registrations_club_id_idx on public.event_registrations(club_id);

drop policy if exists "event_registrations_select" on public.event_registrations;
create policy "event_registrations_select" on public.event_registrations
  for select to authenticated
  using (
    club_id = current_club_id()
    and (
      registered_by = public.my_user_id()
      or public.is_admin_tier()
      or exists (
        select 1 from public.events e
        where e.id = event_registrations.event_id
        and public.is_my_coordinator_branch(e.branch)
      )
    )
  );

drop policy if exists "event_registrations_insert" on public.event_registrations;
create policy "event_registrations_insert" on public.event_registrations
  for insert to authenticated
  with check (club_id = current_club_id() and public.is_my_athlete(athlete_id));

create or replace function public.create_event_registration(
  p_event_id uuid,
  p_athlete_id uuid,
  p_payment_method text default null,
  p_note text default null
)
returns public.event_registrations
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_event events%rowtype;
  v_existing_count int;
  v_status text;
  v_result event_registrations%rowtype;
begin
  select * into v_event from events where id = p_event_id for update;
  if not found then
    raise exception 'Etkinlik bulunamadı.';
  end if;
  if v_event.status <> 'published' then
    raise exception 'Bu etkinlik kayıt için açık değil.';
  end if;
  if v_event.registration_deadline is not null and v_event.registration_deadline < current_date then
    raise exception 'Bu etkinlik için son kayıt tarihi geçti.';
  end if;
  if not is_my_athlete(p_athlete_id) then
    raise exception 'Bu sporcu üzerinde yetkiniz yok.';
  end if;

  if v_event.capacity is not null then
    select count(*) into v_existing_count
    from event_registrations
    where event_id = p_event_id and status in ('pending','approved');
    if v_existing_count >= v_event.capacity then
      raise exception 'Kontenjan dolu.';
    end if;
  end if;

  v_status := case when v_event.fee_try = 0 then 'approved' else 'pending' end;

  begin
    insert into event_registrations (club_id, event_id, athlete_id, registered_by, amount_due, payment_method, note, status)
    values (v_event.club_id, p_event_id, p_athlete_id, (select id from users where auth_user_id = auth.uid()), v_event.fee_try, p_payment_method, p_note, v_status)
    returning * into v_result;
  exception when unique_violation then
    raise exception 'Bu sporcu zaten kayıtlı.';
  end;

  return v_result;
end;
$$;

create or replace function public.update_event_registration_status(p_registration_id uuid, p_status text)
returns public.event_registrations
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_reg event_registrations%rowtype;
  v_event events%rowtype;
  v_result event_registrations%rowtype;
begin
  if p_status not in ('approved','rejected') then
    raise exception 'Geçersiz durum.';
  end if;

  select * into v_reg from event_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;
  if v_reg.status <> 'pending' then
    raise exception 'Bu kayıt zaten incelenmiş.';
  end if;

  select * into v_event from events where id = v_reg.event_id;

  if v_event.club_id is distinct from current_club_id() then
    raise exception 'Bu kayıt üzerinde yetkiniz yok.';
  end if;

  if not (is_admin_tier() or (v_event.branch is not null and is_my_coordinator_branch(v_event.branch))) then
    raise exception 'Bu kayıt üzerinde yetkiniz yok.';
  end if;

  update event_registrations
  set status = p_status, reviewed_at = now(), reviewed_by = (select id from users where auth_user_id = auth.uid())
  where id = p_registration_id
  returning * into v_result;

  return v_result;
end;
$$;
