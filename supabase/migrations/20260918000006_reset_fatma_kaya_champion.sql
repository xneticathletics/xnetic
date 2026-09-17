-- Kullanıcı isteği: Fatma Kaya'nın şampiyon rozetini kaldır, sonra yeniden
-- ver — bir sonraki girişte karşılama/kutlama animasyonu tekrar tetiklensin.
delete from public.badges b
using public.athletes a
where b.athlete_id = a.id and a.full_name ilike 'Fatma Kaya' and b.badge_type = 'sampiyon';

insert into public.badges (club_id, athlete_id, badge_type, tier)
select a.club_id, a.id, 'sampiyon', 1
from public.athletes a
where a.full_name ilike 'Fatma Kaya';
