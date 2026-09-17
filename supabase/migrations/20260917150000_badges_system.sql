-- Rozet (ödül) sistemi — sporcuları teşvik etmek için tamamen otomatik
-- kazanılan rozetler (antrenman serisi, fitness tamamlama, kulüp kıdemi,
-- sosyal paylaşım, mağaza alışverişi, mesajlaşma) + branş koordinatörünün
-- elle verdiği tek bir "Şampiyon" rozeti.
--
-- Hesaplama + yazma BİLEREK SECURITY DEFINER bir fonksiyonda (check_my_badges)
-- birleştirildi, istemci tarafında değil — aksi halde bir kullanıcı
-- devtools'tan kendi çocuğuna sahte bir tier yazabilirdi. İstemci sadece bu
-- fonksiyonu çağırır, ham sayıları asla kendisi hesaplayıp göndermez.
--
-- İki sahiplik modu: athlete_id (sporcuya özel — antrenman/fitness/kıdem/
-- şampiyon) veya user_id (kullanıcıya özel — sosyal/mağaza/mesajlaşma,
-- çünkü bunlar doğrudan bir users.id'ye bağlı, belirli bir sporcuya
-- etiketlenmiş değil). Sporcuya özel rozetlerde sporcunun kendi girişi
-- yoksa veli hesabında görünür (athlete_user_id/parent_user_id ile
-- dinamik çözülüyor, statik kopya değil — sporcuya sonradan hesap
-- açılırsa aynı satır otomatik oraya "geçer").
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  badge_type text not null,
  tier int not null,
  earned_at timestamptz not null default now(),
  seen_at timestamptz,
  awarded_by uuid references public.users(id),
  constraint badges_owner_check check ((athlete_id is not null) <> (user_id is not null))
);

create unique index badges_athlete_type_uq on public.badges(athlete_id, badge_type) where athlete_id is not null;
create unique index badges_user_type_uq on public.badges(user_id, badge_type) where user_id is not null;
create index badges_club_idx on public.badges(club_id);

alter table public.badges enable row level security;

-- SELECT: sporcuya-özel satırlar "bu sporcuyu görebilir miyim" çevresine
-- açık (kendi/veli girişi, admin, koordinatör, grubunun antrenörü) —
-- kullanıcıya-özel satırlar sadece sahibine. INSERT/UPDATE/DELETE için
-- HİÇBİR client policy yok — tüm yazma aşağıdaki security definer
-- fonksiyonlardan geçer (RLS'i bypass eder).
create policy "badges_select" on public.badges for select to authenticated using (
  club_id = current_club_id() and (
    user_id = my_user_id()
    or (athlete_id is not null and exists (
      select 1 from athletes a where a.id = badges.athlete_id
        and (a.athlete_user_id = my_user_id() or a.parent_user_id = my_user_id())
    ))
    or is_admin_tier()
    or (athlete_id is not null and is_my_coordinated_athlete(athlete_id))
    or (athlete_id is not null and exists (
      select 1 from athletes a join groups g on g.id = a.group_id
      where a.id = badges.athlete_id and (
        g.head_coach_id = my_user_id()
        or exists (select 1 from group_coaches gc where gc.group_id = g.id and gc.coach_id = my_user_id())
      )
    ))
  )
);

-- Bana bağlı tüm sporcular (kendi girişim ya da veli olduğum) ve kendim
-- için her kategoriyi yeniden hesaplar, eşik aşıldıysa upsert eder (tier
-- sadece YÜKSELİRSE güncellenir, o an seen_at NULL'a çekilir ki yeni tier
-- tekrar kutlansın). NULL seen_at olan (henüz kutlanmamış) TÜM satırlarımı
-- döner — istemci ek sorguya gerek kalmadan direkt kutlayabilir.
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
    -- antrenman_serisi: en uzun kesintisiz "geldi/gec_kaldi" serisi.
    -- izinli/raporlu atlanır (ne bozar ne uzatır), sadece "gelmedi" sıfırlar.
    declare
      v_streak int := 0;
      v_best int := 0;
      rec record;
    begin
      for rec in
        select att.status
        from attendance att
        join training_sessions ts on ts.id = att.session_id
        where att.athlete_id = r_athlete.id and ts.status = 'completed'
        order by ts.session_date asc, ts.start_time asc
      loop
        if rec.status in ('geldi', 'gec_kaldi') then
          v_streak := v_streak + 1;
          if v_streak > v_best then v_best := v_streak; end if;
        elsif rec.status = 'gelmedi' then
          v_streak := 0;
        end if;
      end loop;
      r_tier := case when v_best >= 20 then 20 when v_best >= 10 then 10 when v_best >= 5 then 5 else null end;
      if r_tier is not null then
        insert into badges (club_id, athlete_id, badge_type, tier)
        values (v_club, r_athlete.id, 'antrenman_serisi', r_tier)
        on conflict (athlete_id, badge_type) where athlete_id is not null
        do update set tier = excluded.tier, seen_at = null, earned_at = now()
        where badges.tier < excluded.tier;
      end if;
    end;

    -- grup_fitness: tamamlanan grup fitness programı sayısı.
    select count(*) into r_count from fitness_program_completions where athlete_id = r_athlete.id;
    r_tier := case when r_count >= 20 then 20 when r_count >= 10 then 10 when r_count >= 5 then 5 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'grup_fitness', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
    end if;

    -- bireysel_fitness: bireysel bir programa karşı ölçüm girilen farklı
    -- gün sayısı — veri modelinde ayrı bir "tamamlama" olayı yok, en yakın
    -- vekil metrik bu.
    select count(distinct measured_at) into r_count
    from fitness_measurements where athlete_id = r_athlete.id and individual_program_id is not null;
    r_tier := case when r_count >= 20 then 20 when r_count >= 10 then 10 when r_count >= 5 then 5 else null end;
    if r_tier is not null then
      insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'bireysel_fitness', r_tier)
      on conflict (athlete_id, badge_type) where athlete_id is not null
      do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
    end if;

    -- kulup_kidem: kayıt tarihinden bu yana geçen tam yıl sayısı.
    if r_athlete.registered_at is not null then
      r_count := extract(year from age(now(), r_athlete.registered_at))::int;
      r_tier := case when r_count >= 5 then 5 when r_count >= 3 then 3 when r_count >= 1 then 1 else null end;
      if r_tier is not null then
        insert into badges (club_id, athlete_id, badge_type, tier) values (v_club, r_athlete.id, 'kulup_kidem', r_tier)
        on conflict (athlete_id, badge_type) where athlete_id is not null
        do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
      end if;
    end if;
  end loop;

  -- Kullanıcıya özel rozetler (kendim) — sosyal paylaşım, mağaza, mesajlaşma.
  select count(*) into r_count from social_posts where author_id = v_uid and status = 'approved';
  r_tier := case when r_count >= 50 then 50 when r_count >= 25 then 25 when r_count >= 10 then 10 else null end;
  if r_tier is not null then
    insert into badges (club_id, user_id, badge_type, tier) values (v_club, v_uid, 'sosyal_paylasim', r_tier)
    on conflict (user_id, badge_type) where user_id is not null
    do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
  end if;

  select count(*) into r_count from shop_orders where parent_user_id = v_uid and status in ('confirmed', 'delivered');
  r_tier := case when r_count >= 20 then 20 when r_count >= 10 then 10 when r_count >= 5 then 5 else null end;
  if r_tier is not null then
    insert into badges (club_id, user_id, badge_type, tier) values (v_club, v_uid, 'magaza_alisverisi', r_tier)
    on conflict (user_id, badge_type) where user_id is not null
    do update set tier = excluded.tier, seen_at = null, earned_at = now() where badges.tier < excluded.tier;
  end if;

  select count(distinct receiver_id) into r_count from messages where sender_id = v_uid;
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

revoke execute on function public.check_my_badges() from public;
grant execute on function public.check_my_badges() to authenticated;

create or replace function public.mark_badge_seen(p_badge_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update badges set seen_at = now()
  where id = p_badge_id and seen_at is null and (
    user_id = my_user_id()
    or athlete_id in (select a.id from athletes a where a.athlete_user_id = my_user_id() or a.parent_user_id = my_user_id())
  );
end;
$$;

revoke execute on function public.mark_badge_seen(uuid) from public;
grant execute on function public.mark_badge_seen(uuid) to authenticated;

-- Sadece branş koordinatörü, kendi koordinatörü olduğu branştaki bir
-- sporcuya "Şampiyon" rozeti verebilir (tier her zaman 1, tekrar
-- verilirse sadece kutlama anı yenilenir).
create or replace function public.award_champion_badge(p_athlete_id uuid)
returns public.badges
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_row badges;
begin
  if not is_branch_coordinator() then
    raise exception 'Sadece branş koordinatörü şampiyon rozeti verebilir';
  end if;
  if not exists (
    select 1 from athletes a
    join groups g on g.id = a.group_id
    join branches b on b.name = g.branch and b.club_id = a.club_id
    where a.id = p_athlete_id and b.coordinator_user_id = my_user_id()
  ) then
    raise exception 'Bu sporcu koordinatörü olduğun branşta değil';
  end if;

  insert into badges (club_id, athlete_id, badge_type, tier, awarded_by)
  select a.club_id, a.id, 'sampiyon', 1, my_user_id() from athletes a where a.id = p_athlete_id
  on conflict (athlete_id, badge_type) where athlete_id is not null
  do update set seen_at = null, earned_at = now(), awarded_by = excluded.awarded_by
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.award_champion_badge(uuid) from public;
grant execute on function public.award_champion_badge(uuid) to authenticated;
