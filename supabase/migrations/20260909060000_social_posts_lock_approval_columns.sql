-- Bulundu: "social_posts_approve" politikası sadece SON durumun
-- status='approved' ve branch'in hâlâ moderatörün yetkisinde olmasını
-- kontrol ediyordu — HANGİ sütunların değiştiğini kısıtlamıyordu. Canlıda
-- doğrulandı: bir branş moderatörü, bir paylaşımı "onaylarken" aynı
-- UPDATE içine caption/media_url/author_id gibi alanları da sokup
-- gönderenin adına başka bir görsele yönlendirebiliyordu ya da paylaşımın
-- kendisini tahrif edebiliyordu. Çözüm: onay geçişinde (pending→approved)
-- status/approved_at/approved_by DIŞINDAKİ tüm alanları trigger içinde
-- zorla eski (OLD) değerine sabitle — client ne gönderirse göndersin.
create or replace function public.social_posts_set_approval()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    new.approved_at := now();
    new.approved_by := (select id from users where auth_user_id = auth.uid());
    new.club_id := old.club_id;
    new.branch := old.branch;
    new.author_id := old.author_id;
    new.media_type := old.media_type;
    new.media_url := old.media_url;
    new.storage_path := old.storage_path;
    new.caption := old.caption;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
