-- BULUNAN HATA (kullanıcı canlıda karşılaştı): Sosyal Alan'a fotoğraf/
-- video eklerken "Object not found" hatası — createSocialPost() önce
-- dosyayı "social-posts" bucket'ına yüklüyor, SONRA createSignedUrl()
-- çağırıyor, EN SONUNDA social_posts tablosuna satırı ekliyor. Ama
-- "social_posts_storage_select" politikası, imzalı URL üretebilmek için
-- storage_path'in zaten social_posts tablosunda bir satıra karşılık
-- gelmesini şart koşuyordu — o satır henüz YOK (üçüncü adımda
-- oluşacak), bu yüzden RLS SELECT'i reddediyor, Storage API bunu
-- "Object not found" olarak gösteriyor (tavuk-yumurta sorunu).
--
-- Çözüm: kendi yüklediğim dosyayı (klasör yolu zaten benim
-- kulübüm+kullanıcım olduğunu kanıtlıyor — social_posts_storage_insert
-- politikasıyla aynı, tabloya bağımlı olmayan kontrol) her zaman
-- görebileyim diye path-bazlı bir OR dalı eklendi. Bu hem tavuk-yumurta
-- sorununu çözüyor hem de author_id için ayrı bir users alt sorgusuna
-- gerek bırakmıyor (performans açısından da bonus — path kontrolü daha
-- ucuz).
drop policy if exists "social_posts_storage_select" on storage.objects;
create policy "social_posts_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'social-posts'
    and (
      (
        (storage.foldername(name))[1] = current_club_id()::text
        and (storage.foldername(name))[2] = (select id::text from public.users where auth_user_id = auth.uid())
      )
      or exists (
        select 1 from public.social_posts sp
        where sp.storage_path = storage.objects.name
        and sp.club_id = public.current_club_id()
        and (
          (sp.status = 'approved' and public.is_my_branch(sp.branch))
          or public.is_admin_tier()
          or (sp.status = 'pending' and public.is_branch_moderator(sp.branch))
        )
      )
    )
  );
