-- Kullanıcı isteği: "Sporcu Fatma Kaya'ya şampiyon rozeti ver" — normalde
-- bu award_champion_badge(athlete_id) RPC'si üzerinden branş koordinatörü
-- tarafından uygulama içinden yapılıyor, burada aynı mantığı (bkz. migration
-- 20260917150000_badges_system.sql) doğrudan tek seferlik uyguluyoruz.
insert into public.badges (club_id, athlete_id, badge_type, tier)
select a.club_id, a.id, 'sampiyon', 1
from public.athletes a
where a.full_name ilike 'Fatma Kaya'
on conflict (athlete_id, badge_type) where athlete_id is not null
do update set seen_at = null, earned_at = now();
