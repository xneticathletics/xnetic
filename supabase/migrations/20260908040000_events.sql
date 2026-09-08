-- Etkinlik/Turnuva/Kamp modülü — Mağaza özelliğindeki "fotoğraflı ürün +
-- ücret + sipariş (Havale/Elden beyanı) + admin onayı" desenini birebir
-- miras alıyor (bkz. shop_products/shop_orders, create_shop_order). Yeni
-- bir ödeme altyapısı yok — aidat sistemindeki "veli beyan eder, admin
-- onaylar" felsefesi burada da geçerli.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id),
  type text not null check (type in ('etkinlik','turnuva','kamp')),
  title text not null,
  description text,
  banner_url text,
  -- null = kulüp geneli; groups.branch ile aynı konvansiyon (FK değil,
  -- branches.name ile isim eşleşmesi).
  branch text,
  location text,
  start_date date not null,
  end_date date,
  fee_try numeric(10,2) not null default 0 check (fee_try >= 0),
  capacity int check (capacity is null or capacity > 0),
  registration_deadline date,
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index events_club_status_idx on public.events(club_id, status);
create index events_branch_idx on public.events(branch);

alter table public.events enable row level security;

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id),
  registered_by uuid not null references public.users(id),
  -- Kayıt anında events.fee_try'den alınan anlık görüntü — admin sonradan
  -- ücreti değiştirse bile geçmiş kayıtları etkilemez.
  amount_due numeric(10,2) not null,
  payment_method text check (payment_method in ('havale','elden')),
  receipt_url text,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  unique (event_id, athlete_id)
);

create index event_registrations_event_idx on public.event_registrations(event_id);
create index event_registrations_athlete_idx on public.event_registrations(athlete_id);

alter table public.event_registrations enable row level security;

-- Bir branş koordinatörünün TAM OLARAK bu branş için event
-- oluşturma/düzenleme/onay yetkisi var mı — is_my_coordinated_group ile
-- birebir aynı kalıp, sadece branş adı üzerinden.
create or replace function public.is_my_coordinator_branch(p_branch text)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
begin
  if p_branch is null then return false; end if;
  return exists (
    select 1 from users u
    join branches b on b.coordinator_user_id = u.id
    where u.auth_user_id = auth.uid()
    and b.name = p_branch
    and b.club_id = public.current_club_id()
  );
end;
$$;

revoke execute on function public.is_my_coordinator_branch(text) from public;
grant execute on function public.is_my_coordinator_branch(text) to authenticated;

-- events RLS: yayınlanmış olanlar herkese (kulüp içi), taslak/iptal
-- sadece admin + o branşın koordinatörüne görünür.
create policy "events_select" on public.events
  for select to authenticated
  using (
    club_id = public.current_club_id()
    and (status = 'published' or public.is_admin_tier() or public.is_my_coordinator_branch(branch))
  );

create policy "events_admin_all" on public.events
  for all to authenticated
  using (club_id = public.current_club_id() and public.is_admin_tier())
  with check (club_id = public.current_club_id() and public.is_admin_tier());

-- with check sayesinde koordinatör branch'i null'a veya başka bir branşa
-- asla çeviremez (kulüp geneli etkinlik sadece admin'e açık).
create policy "events_coordinator_write" on public.events
  for all to authenticated
  using (club_id = public.current_club_id() and branch is not null and public.is_my_coordinator_branch(branch))
  with check (club_id = public.current_club_id() and branch is not null and public.is_my_coordinator_branch(branch));

-- event_registrations RLS: durum değişiklikleri RPC üzerinden (aşağıda) —
-- payments tablosundaki "direkt UPDATE yok, dar bir RPC var" prensibiyle
-- aynı, bu yüzden burada ayrı bir UPDATE politikası YOK.
create policy "event_registrations_select" on public.event_registrations
  for select to authenticated
  using (
    registered_by = (select id from public.users where auth_user_id = auth.uid())
    or public.is_admin_tier()
    or exists (
      select 1 from public.events e
      where e.id = event_registrations.event_id
      and public.is_my_coordinator_branch(e.branch)
    )
  );

-- Ek güvenlik katmanı — asıl mantık (kontenjan, fiyat anlık görüntüsü,
-- ücretsizde otomatik onay) create_event_registration RPC'sinde.
create policy "event_registrations_insert" on public.event_registrations
  for insert to authenticated
  with check (public.is_my_athlete(athlete_id));

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

  -- Ücretsiz etkinliklerde admin onayı beklemeden direkt onaylanır —
  -- onay adımı sadece ücretli (beyan gerektiren) kayıtlar için anlamlı.
  v_status := case when v_event.fee_try = 0 then 'approved' else 'pending' end;

  begin
    insert into event_registrations (event_id, athlete_id, registered_by, amount_due, payment_method, note, status)
    values (p_event_id, p_athlete_id, (select id from users where auth_user_id = auth.uid()), v_event.fee_try, p_payment_method, p_note, v_status)
    returning * into v_result;
  exception when unique_violation then
    raise exception 'Bu sporcu zaten kayıtlı.';
  end;

  return v_result;
end;
$$;

revoke execute on function public.create_event_registration(uuid, uuid, text, text) from public;
grant execute on function public.create_event_registration(uuid, uuid, text, text) to authenticated;

-- Admin/ilgili branş koordinatörü kaydı onaylar/reddeder. Kulüp geneli
-- (branch=null) etkinliklerde koordinatör onaylayamaz — sadece admin.
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

revoke execute on function public.update_event_registration_status(uuid, text) from public;
grant execute on function public.update_event_registration_status(uuid, text) to authenticated;

-- Veli kendi bekleyen (henüz incelenmemiş) kaydını iptal edip kontenjanı
-- serbest bırakabilir — onaylanmış/reddedilmiş bir kaydı iptal edemez.
create or replace function public.cancel_my_event_registration(p_registration_id uuid)
returns public.event_registrations
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_result event_registrations%rowtype;
begin
  update event_registrations
  set status = 'cancelled'
  where id = p_registration_id
  and status = 'pending'
  and registered_by = (select id from users where auth_user_id = auth.uid())
  returning * into v_result;

  if not found then
    raise exception 'Bu kayıt iptal edilemez.';
  end if;

  return v_result;
end;
$$;

revoke execute on function public.cancel_my_event_registration(uuid) from public;
grant execute on function public.cancel_my_event_registration(uuid) to authenticated;

-- Depolama: büyük banner görseli (public, imzasız düz URL — announcement-
-- attachments ile aynı desen) ve ödeme dekontu (private, payment-receipts
-- ile birebir aynı desen).
insert into storage.buckets (id, name, public, file_size_limit)
values ('event-banners', 'event-banners', true, 2097152)
on conflict (id) do update set file_size_limit = 2097152, public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values ('event-receipts', 'event-receipts', false, 5242880)
on conflict (id) do update set file_size_limit = 5242880, public = false;

create policy "event_banners_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'event-banners'
    and exists (
      select 1 from public.events e
      where e.id::text = (storage.foldername(storage.objects.name))[1]
      and (public.is_admin_tier() or public.is_my_coordinator_branch(e.branch))
    )
  )
  with check (
    bucket_id = 'event-banners'
    and exists (
      select 1 from public.events e
      where e.id::text = (storage.foldername(storage.objects.name))[1]
      and (public.is_admin_tier() or public.is_my_coordinator_branch(e.branch))
    )
  );

create policy "event_receipts_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-receipts'
    and exists (
      select 1 from public.event_registrations r
      where r.id::text = (storage.foldername(storage.objects.name))[1]
      and public.is_my_athlete(r.athlete_id)
    )
  );

create policy "event_receipts_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'event-receipts'
    and exists (
      select 1 from public.event_registrations r
      join public.events e on e.id = r.event_id
      where r.id::text = (storage.foldername(storage.objects.name))[1]
      and (
        public.is_my_athlete(r.athlete_id)
        or public.is_admin_tier()
        or public.is_my_coordinator_branch(e.branch)
      )
    )
  );
