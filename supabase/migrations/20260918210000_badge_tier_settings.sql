-- Kullanıcı isteği: özel rozet şablonları yerine, admin/branş koordinatörü
-- sadece MEVCUT 7 otomatik rozet kategorisinin eşik sayılarını (5-10-20
-- gibi) kulüp bazında değiştirebilsin. Satır yoksa hardcoded varsayılan
-- eşikler geçerli — bu tablo sadece bir "override" katmanı.
create table public.badge_tier_settings (
  club_id uuid not null references public.clubs(id) on delete cascade,
  badge_type text not null,
  tier1 int not null,
  tier2 int not null,
  tier3 int not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  primary key (club_id, badge_type),
  constraint badge_tier_settings_order_check check (tier1 < tier2 and tier2 < tier3),
  constraint badge_tier_settings_type_check check (badge_type in (
    'antrenman_serisi', 'grup_fitness', 'bireysel_fitness', 'kulup_kidem',
    'sosyal_paylasim', 'magaza_alisverisi', 'mesajlasma'
  ))
);

alter table public.badge_tier_settings enable row level security;

create policy "badge_tier_settings_select" on public.badge_tier_settings for select to authenticated using (
  club_id = current_club_id()
);

create policy "badge_tier_settings_write" on public.badge_tier_settings for all to authenticated using (
  club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())
) with check (
  club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator())
);

-- Bir kulübün bir kategori için geçerli eşiklerini döner — override satırı
-- varsa onu, yoksa mevcut (eski) hardcoded varsayılanları kullanır.
create or replace function public.badge_tier_thresholds(p_club_id uuid, p_badge_type text, out t1 int, out t2 int, out t3 int)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    coalesce(s.tier1, d.t1),
    coalesce(s.tier2, d.t2),
    coalesce(s.tier3, d.t3)
  from (select
      case p_badge_type when 'kulup_kidem' then 1 when 'sosyal_paylasim' then 10 when 'mesajlasma' then 10 else 5 end as t1,
      case p_badge_type when 'kulup_kidem' then 3 when 'sosyal_paylasim' then 25 when 'mesajlasma' then 20 else 10 end as t2,
      case p_badge_type when 'kulup_kidem' then 5 when 'sosyal_paylasim' then 50 when 'mesajlasma' then 30 else 20 end as t3
  ) d
  left join public.badge_tier_settings s on s.club_id = p_club_id and s.badge_type = p_badge_type;
$$;

-- check_my_badges() — SQL mantığı aynı, sadece sabit sayılar yerine
-- badge_tier_thresholds() sonucunu kullanıyor.
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
  v_t1 int; v_t2 int; v_t3 int;
begin
  if v_uid is null then return; end if;

  for r_athlete in
    select a.id, a.registered_at
    from athletes a
    where a.club_id = v_club and (a.athlete_user_id = v_uid or a.parent_user_id = v_uid)
  loop
    select t1, t2, t3 into v_t1, v_t2, v_t3 from public.badge_tier_thresholds(v_club, 'antrenman_serisi');
    r_count := count_antrenman_serisi(r_athlete.id);
    r_tier := case when r_count >= v_t3 then v_t3 when r_count >= v_t2 then v_t2 when r_count >= v_t1 then v_t1 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier)
      values (v_club, r_athlete.id, 'antrenman_serisi', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now()
      where badges.tier < excluded.tier;
    end if;

    select t1, t2, t3 into v_t1, v_t2, v_t3 from public.badge_tier_thresholds(v_club, 'grup_fitness');
    r_count := count_grup_fitness(r_athlete.id);
    r_tier := case when r_count >= v_t3 then v_t3 when r_count >= v_t2 then v_t2 when r_count >= v_t1 then v_t1 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'grup_fitness', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
    end if;

    select t1, t2, t3 into v_t1, v_t2, v_t3 from public.badge_tier_thresholds(v_club, 'bireysel_fitness');
    r_count := count_bireysel_fitness(r_athlete.id);
    r_tier := case when r_count >= v_t3 then v_t3 when r_count >= v_t2 then v_t2 when r_count >= v_t1 then v_t1 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'bireysel_fitness', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
    end if;

    if r_athlete.registered_at is not null then
      select t1, t2, t3 into v_t1, v_t2, v_t3 from public.badge_tier_thresholds(v_club, 'kulup_kidem');
      r_count := count_kulup_kidem_years(r_athlete.id);
      r_tier := case when r_count >= v_t3 then v_t3 when r_count >= v_t2 then v_t2 when r_count >= v_t1 then v_t1 else null end;
      if r_tier is not null then
        insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'kulup_kidem', r_tier)
        on conflict (athlete_id, badge_type) where athlete_id is not null
        do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
      end if;
    end if;
  end loop;

  select t1, t2, t3 into v_t1, v_t2, v_t3 from public.badge_tier_thresholds(v_club, 'sosyal_paylasim');
  r_count := count_sosyal_paylasim(v_uid);
  r_tier := case when r_count >= v_t3 then v_t3 when r_count >= v_t2 then v_t2 when r_count >= v_t1 then v_t1 else null end;
  if r_tier is not null then
    insert into badges (club_id, user_id, badge_type, tier) values (v_club, v_uid, 'sosyal_paylasim', r_tier)
    on conflict (user_id, badge_type) where user_id is not null
    do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
  end if;

  select t1, t2, t3 into v_t1, v_t2, v_t3 from public.badge_tier_thresholds(v_club, 'magaza_alisverisi');
  r_count := count_magaza_alisverisi(v_uid);
  r_tier := case when r_count >= v_t3 then v_t3 when r_count >= v_t2 then v_t2 when r_count >= v_t1 then v_t1 else null end;
  if r_tier is not null then
    insert into badges (club_id, user_id, badge_type, tier) values (v_club, v_uid, 'magaza_alisverisi', r_tier)
    on conflict (user_id, badge_type) where user_id is not null
    do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
  end if;

  select t1, t2, t3 into v_t1, v_t2, v_t3 from public.badge_tier_thresholds(v_club, 'mesajlasma');
  r_count := count_mesajlasma(v_uid);
  r_tier := case when r_count >= v_t3 then v_t3 when r_count >= v_t2 then v_t2 when r_count >= v_t1 then v_t1 else null end;
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
