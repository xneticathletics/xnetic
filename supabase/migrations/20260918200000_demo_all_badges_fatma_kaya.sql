-- Kullanıcı isteği: Fatma Kaya'ya TÜM rozet kategorilerini farklı
-- kademelerde ver, görsel (bronz/gümüş/altın) sistemi canlıda tek seferde
-- görebilsin. seen_at NULL bırakılıyor ki bir sonraki girişte kutlama
-- popup'ı sırayla hepsi için tetiklensin.
create temporary table tmp_demo_badge_rows on commit drop as
with athlete as (
  select a.id as athlete_id, a.club_id, a.athlete_user_id, a.parent_user_id
  from public.athletes a
  where a.full_name ilike 'Fatma Kaya'
  limit 1
),
target_user as (
  select coalesce(athlete.athlete_user_id, athlete.parent_user_id) as user_id, athlete.*
  from athlete
)
select club_id, athlete_id, null::uuid as user_id, 'antrenman_serisi'::text as badge_type, 20 as tier from target_user
union all select club_id, athlete_id, null, 'grup_fitness', 5 from target_user
union all select club_id, athlete_id, null, 'bireysel_fitness', 10 from target_user
union all select club_id, athlete_id, null, 'kulup_kidem', 5 from target_user
union all select club_id, null, user_id, 'sosyal_paylasim', 10 from target_user
union all select club_id, null, user_id, 'magaza_alisverisi', 20 from target_user
union all select club_id, null, user_id, 'mesajlasma', 20 from target_user;

insert into public.badges (club_id, athlete_id, user_id, badge_type, tier, seen_at)
select club_id, athlete_id, null, badge_type, tier, null
from tmp_demo_badge_rows
where athlete_id is not null
on conflict (athlete_id, badge_type) where athlete_id is not null
do update set tier = excluded.tier, earned_at = now(), seen_at = null;

insert into public.badges (club_id, athlete_id, user_id, badge_type, tier, seen_at)
select club_id, null, user_id, badge_type, tier, null
from tmp_demo_badge_rows
where user_id is not null
on conflict (user_id, badge_type) where user_id is not null
do update set tier = excluded.tier, earned_at = now(), seen_at = null;

update public.badges b
set seen_at = null, earned_at = now()
from public.athletes a
where b.athlete_id = a.id and a.full_name ilike 'Fatma Kaya' and b.badge_type = 'sampiyon';
