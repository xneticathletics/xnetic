-- Haftalık sabit antrenman programı: admin hangi gruplarda bu özelliğin
-- kullanılacağını işaretler (fixed_schedule), branş koordinatörü (veya
-- salon yetkilisi) o gruplar için gün/saat/salon şablonları girer,
-- generateSessionsFromTemplates() (bkz. src/lib/api/trainingSchedule.ts)
-- bundan gerçek training_sessions kayıtlarını üretir — payment_plans →
-- payments ile aynı desen.

alter table public.groups add column if not exists fixed_schedule boolean not null default false;

create table if not exists public.training_schedule_templates (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null default public.current_club_id() references public.clubs(id),
  group_id uuid not null references public.groups(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Pzt..6=Paz (WEEKDAY_LABELS ile aynı kural)
  start_time time not null,
  end_time time not null,
  venue_id uuid references public.venues(id) on delete set null,
  active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

alter table public.training_schedule_templates enable row level security;

-- Şablonları görmek hassas değil (sadece program bilgisi) — training_sessions_select
-- ile aynı geniş kulüp-içi okuma.
create policy "training_schedule_templates_select" on public.training_schedule_templates
  for select to authenticated
  using (club_id = public.current_club_id());

-- Yazma: admin, o grubun branş koordinatörü, ya da o salonun yetkilisi.
-- is_my_coordinated_group / is_venue_authority bir sonraki migration'da tanımlanıyor.
create policy "training_schedule_templates_write" on public.training_schedule_templates
  for all to authenticated
  using (
    club_id = public.current_club_id()
    and (public.is_admin_tier() or public.is_my_coordinated_group(group_id) or public.is_venue_authority(venue_id))
  )
  with check (
    club_id = public.current_club_id()
    and (public.is_admin_tier() or public.is_my_coordinated_group(group_id) or public.is_venue_authority(venue_id))
  );

-- "Salon yetkilisi" etiketi — group_coaches ile aynı basit junction table
-- deseni. Ayrı bir rol değil, mevcut bir antrenöre (coach_id = users.id)
-- belirli bir salon için "antrenman ekle" yetkisi açan bir bayrak.
create table if not exists public.venue_coaches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null default public.current_club_id() references public.clubs(id),
  venue_id uuid not null references public.venues(id) on delete cascade,
  coach_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (venue_id, coach_id)
);

alter table public.venue_coaches enable row level security;

create policy "venue_coaches_select" on public.venue_coaches
  for select to authenticated
  using (club_id = public.current_club_id());

-- Atama sadece admin + (herhangi bir branşın) koordinatörü tarafından
-- yapılabilir — is_branch_coordinator() zaten kulüpte var olan, branşa
-- özel olmayan aynı geniş kontrol (bkz. 20260905040000_branch_coordinator_admin_rights.sql).
create policy "venue_coaches_write" on public.venue_coaches
  for all to authenticated
  using (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()))
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));
