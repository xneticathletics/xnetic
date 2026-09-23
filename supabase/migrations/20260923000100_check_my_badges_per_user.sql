-- check_my_badges artik kisi bazli badge_views tablosuna bakiyor
-- (bkz. 20260923000000_badge_seen_per_user.sql). Ayni gun ad-hoc uygulanan
-- tanimin takip edilen surumu; CREATE OR REPLACE oldugu icin tekrar
-- calistirilmasi guvenli.
CREATE OR REPLACE FUNCTION public.check_my_badges()
 RETURNS SETOF badges
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Kutlanmamışlık artık KİŞİ BAZINDA: badges.seen_at tek sütun olduğu
  -- için sporcu ve velisinden hangisi önce açarsa kutlamayı ikisi adına
  -- tüketiyordu (bkz. 20260923000000_badge_seen_per_user.sql).
  return query
    select b.* from badges b
    where not exists (select 1 from badge_views v where v.badge_id = b.id and v.user_id = v_uid)
      and (
        b.user_id = v_uid
        or b.athlete_id in (select a.id from athletes a where a.club_id = v_club and (a.athlete_user_id = v_uid or a.parent_user_id = v_uid))
      );
end;
$function$
;