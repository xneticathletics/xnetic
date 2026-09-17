-- Admin/branş koordinatörünün KENDİ rozet şablonlarını tanımlayabilmesi
-- (isim, yüklenen simge, açıklama, kısa açıklama, DEĞİŞKEN sayıda aşama —
-- her aşamanın kendi eşiği). Kazanım OTOMATİK: her aşama, mevcut 7
-- metrikten (antrenman serisi, grup/bireysel fitness, kulüp kıdemi,
-- sosyal paylaşım, mağaza, mesajlaşma) birine bağlanır.
--
-- ÖNEMLİ: mevcut, zaten test edilmiş 8 kategorilik `badges` sistemi
-- (migration 20260917150000_badges_system.sql) HİÇ BOZULMUYOR — bu tamamen
-- PARALEL bir katman. check_my_badges()'teki 7 sayım sorgusu, davranışı
-- BİREBİR AYNI kalacak şekilde adı konmuş fonksiyonlara çıkarılıyor, hem
-- eski hem yeni motor bunları çağırıyor (kod tekrarı önleniyor).

create or replace function public.count_antrenman_serisi(p_athlete_id uuid)
returns int
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_streak int := 0;
  v_best int := 0;
  rec record;
begin
  for rec in
    select att.status
    from attendance att
    join training_sessions ts on ts.id = att.session_id
    where att.athlete_id = p_athlete_id and ts.status = 'completed'
    order by ts.session_date asc, ts.start_time asc
  loop
    if rec.status in ('geldi', 'gec_kaldi') then
      v_streak := v_streak + 1;
      if v_streak > v_best then v_best := v_streak; end if;
    elsif rec.status = 'gelmedi' then
      v_streak := 0;
    end if;
  end loop;
  return v_best;
end;
$$;

create or replace function public.count_grup_fitness(p_athlete_id uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from fitness_program_completions where athlete_id = p_athlete_id;
$$;

create or replace function public.count_bireysel_fitness(p_athlete_id uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select count(distinct measured_at)::int from fitness_measurements
  where athlete_id = p_athlete_id and individual_program_id is not null;
$$;

create or replace function public.count_kulup_kidem_years(p_athlete_id uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select coalesce(extract(year from age(now(), registered_at))::int, 0) from athletes where id = p_athlete_id;
$$;

create or replace function public.count_sosyal_paylasim(p_user_id uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from social_posts where author_id = p_user_id and status = 'approved';
$$;

create or replace function public.count_magaza_alisverisi(p_user_id uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from shop_orders where parent_user_id = p_user_id and status in ('confirmed', 'delivered');
$$;

create or replace function public.count_mesajlasma(p_user_id uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select count(distinct receiver_id)::int from messages where sender_id = p_user_id;
$$;

-- check_my_badges() artık yukarıdaki adı konmuş fonksiyonları çağırıyor —
-- SQL mantığı, sadece taşınmış olması dışında BİREBİR AYNI.
create or replace function public.check_my_badges()
returns setof public.badges
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := my_user_id();
  v_club uuid := current_club_id();
  r_athlete record;
  r_count int;
  r_tier int;
begin
  if v_uid is null then return; end if;

  for r_athlete in
    select a.id, a.registered_at
    from athletes a
    where a.club_id = v_club and (a.athlete_user_id = v_uid or a.parent_user_id = v_uid)
  loop
    r_count := count_antrenman_serisi(r_athlete.id);
    r_tier := case when r_count >= 20 then 20 when r_count >= 10 then 10 when r_count >= 5 then 5 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier)
      values (v_club, r_athlete.id, 'antrenman_serisi', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now()
      where badges.tier < excluded.tier;
    end if;

    r_count := count_grup_fitness(r_athlete.id);
    r_tier := case when r_count >= 20 then 20 when r_count >= 10 then 10 when r_count >= 5 then 5 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'grup_fitness', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
    end if;

    r_count := count_bireysel_fitness(r_athlete.id);
    r_tier := case when r_count >= 20 then 20 when r_count >= 10 then 10 when r_count >= 5 then 5 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'bireysel_fitness', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
    end if;

    if r_athlete.registered_at is not null then
      r_count := count_kulup_kidem_years(r_athlete.id);
      r_tier := case when r_count >= 5 then 5 when r_count >= 3 then 3 when r_count >= 1 then 1 else null end;
      if r_tier is not null then
        insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'kulup_kidem', r_tier)
        on conflict (athlete_id, badge_type) where athlete_id is not null
        do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
      end if;
    end if;
  end loop;

  r_count := count_sosyal_paylasim(v_uid);
  r_tier := case when r_count >= 50 then 50 when r_count >= 25 then 25 when r_count >= 10 then 10 else null end;
  if r_tier is not null then
    insert into badges (club_id, user_id, badge_type, tier) values (v_club, v_uid, 'sosyal_paylasim', r_tier)
    on conflict (user_id, badge_type) where user_id is not null
    do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
  end if;

  r_count := count_magaza_alisverisi(v_uid);
  r_tier := case when r_count >= 20 then 20 when r_count >= 10 then 10 when r_count >= 5 then 5 else null end;
  if r_tier is not null then
    insert into badges (club_id, user_id, badge_type, tier) values (v_club, v_uid, 'magaza_alisverisi', r_tier)
    on conflict (user_id, badge_type) where user_id is not null
    do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
  end if;

  r_count := count_mesajlasma(v_uid);
  r_tier := case when r_count >= 30 then 30 when r_count >= 20 then 20 when r_count >= 10 then 10 else null end;
  if r_tier is not null then
    insert into badges (club_id, user_id, badge_type, tier) values (v_club, v_uid, 'mesajlasma', r_tier)
    on conflict (user_id, badge_type) where user_id is not null
    do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
  end if;

  return query
    select b.* from badges b
    where b.seen_at is null and (
      b.user_id = v_uid
      or b.athlete_id in (select a.id from athletes a where a.club_id = v_club and (a.athlete_user_id = v_uid or a.parent_user_id = v_uid))
    );
end;
$$;

-- ===================================================================
-- Yeni: özel rozet şablonları
-- ===================================================================

create table public.badge_templates (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  icon_url text,
  description text,
  short_description text,
  metric_type text not null check (metric_type in (
    'antrenman_serisi', 'grup_fitness', 'bireysel_fitness', 'kulup_kidem',
    'sosyal_paylasim', 'magaza_alisverisi', 'mesajlasma'
  )),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create table public.badge_template_stages (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.badge_templates(id) on delete cascade,
  stage_order int not null,
  threshold int not null,
  title text,
  description text,
  unique (template_id, stage_order)
);

create table public.custom_badge_earned (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  template_id uuid not null references public.badge_templates(id) on delete cascade,
  stage_order int not null,
  earned_at timestamptz not null default now(),
  seen_at timestamptz,
  constraint custom_badge_earned_owner_check check ((athlete_id is not null) <> (user_id is not null))
);
create unique index custom_badge_earned_athlete_uq on public.custom_badge_earned(athlete_id, template_id) where athlete_id is not null;
create unique index custom_badge_earned_user_uq on public.custom_badge_earned(user_id, template_id) where user_id is not null;

alter table public.badge_templates enable row level security;
alter table public.badge_template_stages enable row level security;
alter table public.custom_badge_earned enable row level security;

-- Şablonları herkes görebilsin (ne için çalıştığını bilsinler), sadece
-- admin/koordinatör yazabilsin.
create policy "badge_templates_select" on public.badge_templates
  for select to authenticated using (club_id = current_club_id());
create policy "badge_templates_write" on public.badge_templates
  for all to authenticated
  using (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
  with check (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()));

create policy "badge_template_stages_select" on public.badge_template_stages
  for select to authenticated
  using (exists (select 1 from badge_templates t where t.id = template_id and t.club_id = current_club_id()));
create policy "badge_template_stages_write" on public.badge_template_stages
  for all to authenticated
  using (exists (
    select 1 from badge_templates t where t.id = template_id and t.club_id = current_club_id()
      and (is_admin_tier() or is_branch_coordinator())
  ))
  with check (exists (
    select 1 from badge_templates t where t.id = template_id and t.club_id = current_club_id()
      and (is_admin_tier() or is_branch_coordinator())
  ));

-- Kazanılan özel rozetlerin görünürlüğü, mevcut badges_select ile BİREBİR
-- AYNI kural — aynı helper'lar (is_admin_tier, is_my_coordinated_athlete,
-- head/yardımcı antrenör kontrolü). INSERT/UPDATE client policy YOK —
-- sadece check_my_custom_badges() üzerinden.
create policy "custom_badge_earned_select" on public.custom_badge_earned for select to authenticated using (
  club_id = current_club_id() and (
    user_id = my_user_id()
    or (athlete_id is not null and exists (
      select 1 from athletes a where a.id = custom_badge_earned.athlete_id
        and (a.athlete_user_id = my_user_id() or a.parent_user_id = my_user_id())
    ))
    or is_admin_tier()
    or (athlete_id is not null and is_my_coordinated_athlete(athlete_id))
    or (athlete_id is not null and exists (
      select 1 from athletes a join groups g on g.id = a.group_id
      where a.id = custom_badge_earned.athlete_id and (
        g.head_coach_id = my_user_id()
        or exists (select 1 from group_coaches gc where gc.group_id = g.id and gc.coach_id = my_user_id())
      )
    ))
  )
);

create or replace function public.check_my_custom_badges()
returns setof public.custom_badge_earned
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := my_user_id();
  v_club uuid := current_club_id();
  v_template record;
  v_athlete record;
  v_count int;
  v_stage int;
begin
  if v_uid is null then return; end if;

  for v_template in select * from badge_templates where club_id = v_club and active loop
    if v_template.metric_type in ('antrenman_serisi', 'grup_fitness', 'bireysel_fitness', 'kulup_kidem') then
      for v_athlete in
        select a.id from athletes a where a.club_id = v_club and (a.athlete_user_id = v_uid or a.parent_user_id = v_uid)
      loop
        v_count := case v_template.metric_type
          when 'antrenman_serisi' then count_antrenman_serisi(v_athlete.id)
          when 'grup_fitness' then count_grup_fitness(v_athlete.id)
          when 'bireysel_fitness' then count_bireysel_fitness(v_athlete.id)
          when 'kulup_kidem' then count_kulup_kidem_years(v_athlete.id)
        end;
        select stage_order into v_stage from badge_template_stages
          where template_id = v_template.id and threshold <= v_count
          order by threshold desc limit 1;
        if v_stage is not null then
          insert into custom_badge_earned (club_id, athlete_id, template_id, stage_order)
          values (v_club, v_athlete.id, v_template.id, v_stage)
          on conflict (athlete_id, template_id) where athlete_id is not null
          do update set stage_order = excluded.stage_order, seen_at = null, earned_at = now()
          where custom_badge_earned.stage_order < excluded.stage_order;
        end if;
      end loop;
    else
      v_count := case v_template.metric_type
        when 'sosyal_paylasim' then count_sosyal_paylasim(v_uid)
        when 'magaza_alisverisi' then count_magaza_alisverisi(v_uid)
        when 'mesajlasma' then count_mesajlasma(v_uid)
      end;
      select stage_order into v_stage from badge_template_stages
        where template_id = v_template.id and threshold <= v_count
        order by threshold desc limit 1;
      if v_stage is not null then
        insert into custom_badge_earned (club_id, user_id, template_id, stage_order)
        values (v_club, v_uid, v_template.id, v_stage)
        on conflict (user_id, template_id) where user_id is not null
        do update set stage_order = excluded.stage_order, seen_at = null, earned_at = now()
        where custom_badge_earned.stage_order < excluded.stage_order;
      end if;
    end if;
  end loop;

  return query
    select c.* from custom_badge_earned c
    where c.seen_at is null and (
      c.user_id = v_uid
      or c.athlete_id in (select a.id from athletes a where a.club_id = v_club and (a.athlete_user_id = v_uid or a.parent_user_id = v_uid))
    );
end;
$$;

revoke execute on function public.check_my_custom_badges() from public;
grant execute on function public.check_my_custom_badges() to authenticated;

create or replace function public.mark_custom_badge_seen(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update custom_badge_earned set seen_at = now()
  where id = p_id and seen_at is null and (
    user_id = my_user_id()
    or athlete_id in (select a.id from athletes a where a.athlete_user_id = my_user_id() or a.parent_user_id = my_user_id())
  );
end;
$$;

revoke execute on function public.mark_custom_badge_seen(uuid) from public;
grant execute on function public.mark_custom_badge_seen(uuid) to authenticated;

-- ===================================================================
-- Simge (ikon) yüklemesi için public bucket — club-logos ile aynı muamele
-- (küçük, dekoratif görsel; imzalı URL gerektirmeyecek kadar hassasiyetsiz).
-- ===================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('badge-icons', 'badge-icons', true, 2097152)
on conflict (id) do update set public = true, file_size_limit = 2097152;

create policy "badge_icons_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'badge-icons'
    and (is_admin_tier() or is_branch_coordinator())
    and (storage.foldername(storage.objects.name))[1] = current_club_id()::text
  );

create policy "badge_icons_storage_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'badge-icons' and (is_admin_tier() or is_branch_coordinator())
    and (storage.foldername(storage.objects.name))[1] = current_club_id()::text
  )
  with check (
    bucket_id = 'badge-icons' and (is_admin_tier() or is_branch_coordinator())
    and (storage.foldername(storage.objects.name))[1] = current_club_id()::text
  );

create policy "badge_icons_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'badge-icons' and (is_admin_tier() or is_branch_coordinator())
    and (storage.foldername(storage.objects.name))[1] = current_club_id()::text
  );
