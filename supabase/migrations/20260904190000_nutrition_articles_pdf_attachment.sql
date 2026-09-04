-- Beslenme rehberi yazılarına isteğe bağlı bir PDF eki eklenebiliyor artık —
-- yazı ya klasik metin (body) ile ya da yüklenen bir PDF ile "yayınlanabilir".
-- İkisi birden de olabilir, ama en az biri zorunlu.
alter table public.nutrition_articles alter column body drop not null;
alter table public.nutrition_articles add column pdf_url text;
alter table public.nutrition_articles add constraint nutrition_articles_content_check check (
  (body is not null and length(trim(body)) > 0) or (pdf_url is not null)
);

-- PDF'ler kulübe özel bir yolda tutulur: "<club_id>/<dosya>". 10 MB üst sınır —
-- bir beslenme rehberi PDF'i için fazlasıyla yeterli (bkz. fitness-exercise-videos'taki
-- aynı gerekçe, video değil PDF olduğu için çok daha küçük tutuldu).
insert into storage.buckets (id, name, public, file_size_limit)
values ('nutrition-pdfs', 'nutrition-pdfs', true, 10485760)
on conflict (id) do update set file_size_limit = 10485760;

-- Sadece kulüp admini yükleyebilir/düzenleyebilir/silebilir — mevcut yazı
-- düzenleme/silme yetkisiyle aynı (bkz. NutritionArticleDetailScreen.tsx'teki
-- role === "club_admin" kontrolü).
create policy "nutrition_pdfs_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'nutrition-pdfs'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(name))[1]
    )
  );

create policy "nutrition_pdfs_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'nutrition-pdfs'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(name))[1]
    )
  );

create policy "nutrition_pdfs_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'nutrition-pdfs'
    and exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.role = 'club_admin'
        and u.club_id::text = (storage.foldername(name))[1]
    )
  );
