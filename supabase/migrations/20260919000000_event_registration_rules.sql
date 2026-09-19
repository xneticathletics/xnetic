-- Etkinlik kayıt kuralları (kullanıcı isteği):
--  1) Sadece VELİ kayıt yapabilir (mağaza siparişi gibi) — sporcu sadece görür.
--  2) Bitiş tarihi (yoksa başlangıç tarihi) bugünden önceyse kayıt YAPILAMAZ.
-- Kurallar sadece arayüzde değil, RPC'de zorunlu kılınıyor. Ayrıca istemciye
-- açık, RPC kontrollerini (tarih/rol/kontenjan) atlatabilecek doğrudan
-- INSERT politikası kaldırılıyor — tüm kayıtlar zaten create_event_registration
-- RPC'sinden (security definer) geçiyor, hiçbir istemci kodu doğrudan
-- INSERT yapmıyor.
drop policy if exists "event_registrations_insert" on public.event_registrations;

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
  if current_user_role() <> 'parent' then
    raise exception 'Etkinliğe sadece veli kayıt yapabilir.';
  end if;

  select * into v_event from events where id = p_event_id for update;
  if not found then
    raise exception 'Etkinlik bulunamadı.';
  end if;
  if v_event.club_id is distinct from current_club_id() then
    raise exception 'Etkinlik bulunamadı.';
  end if;
  if v_event.status <> 'published' then
    raise exception 'Bu etkinlik kayıt için açık değil.';
  end if;
  if coalesce(v_event.end_date, v_event.start_date) < current_date then
    raise exception 'Bu etkinlik sona erdi, kayıt yapılamaz.';
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

-- Sporcu (kendi girişi olan) artık kendi adına yapılan kaydı görebilsin —
-- kayıt velisi yapıyor ama sporcu durumu (bekliyor/onaylandı) izleyebilmeli.
drop policy if exists "event_registrations_select" on public.event_registrations;
create policy "event_registrations_select" on public.event_registrations
  for select to authenticated
  using (
    club_id = current_club_id()
    and (
      registered_by = public.my_user_id()
      or exists (
        select 1 from public.athletes a
        where a.id = event_registrations.athlete_id
          and (a.athlete_user_id = public.my_user_id() or a.parent_user_id = public.my_user_id())
      )
      or public.is_admin_tier()
      or exists (
        select 1 from public.events e
        where e.id = event_registrations.event_id
        and public.is_my_coordinator_branch(e.branch)
      )
    )
  );
