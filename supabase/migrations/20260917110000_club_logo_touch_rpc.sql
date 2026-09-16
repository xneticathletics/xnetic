-- Kulüp logosu değiştirildiğinde uploadClubLogo() clubs.logo_updated_at'i
-- doğrudan bir .update() ile güncelliyordu ve hatasını BİLEREK sessizce
-- yutuyordu (bkz. src/lib/api/clubLogo.ts) — bu satır clubs tablosunun
-- UPDATE RLS politikasına (migrations klasöründe hiç görünmeyen, bu repo
-- öncesinden gelen baseline şema) bağımlıydı. O politika bu sütun için
-- (veya bu rol için) izin vermiyorsa güncelleme sessizce başarısız olur,
-- logo_updated_at hiç değişmez, dolayısıyla Ana Sayfa/Logo ekranındaki
-- cache-buster URL'i de hiç değişmez ve eski logo süresiz önbellekten
-- gösterilmeye devam eder — "kulüp logosu hala değişmiyor" şikayetinin
-- kök nedeni muhtemelen bu. RLS'nin tam mevcut halini bu ortamdan
-- doğrulayamadığımız için, güvenilir SECURITY DEFINER bir RPC'ye taşıyoruz:
-- bu, altta yatan clubs UPDATE politikası ne olursa olsun her zaman
-- çalışır, sadece çağıranın KENDİ kulübüyle sınırlı kalır.
create or replace function public.touch_club_logo(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clubs
  set logo_updated_at = now()
  where id = p_club_id
    and id = current_club_id();
end;
$$;

grant execute on function public.touch_club_logo(uuid) to authenticated;
