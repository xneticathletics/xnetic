-- Yeni kurulan kulüp logosunu yükleyemiyordu.
--
-- Kulüp Oluştur akışı, hesap kurulduktan hemen sonra seçilen logoyu
-- yüklüyor. Ama yeni kulüp "pending_review" durumunda doğuyor ve abonelik
-- kapısı (20260921260000) bu durumda JWT'deki club_id'yi NULL yapıyor.
-- club-logos politikaları current_club_id() kullandığı için kontrol NULL'a
-- düşüyor ve yükleme reddediliyor. Üstelik CreateClubPage hatayı sessizce
-- yuttuğu için kullanıcıya "logo yüklenmedi" diye bir şey görünmüyordu —
-- sadece ana sayfada X-NETIC amblemi çıkıyordu (canlıda yakalandı).
--
-- Logo yüklemek abonelik onayından bağımsız, zararsız bir işlem ve kayıt
-- akışının parçası; bu yüzden bu iki politika ham claim'i kullanıyor.
-- Klasör hâlâ kulübün kendi id'siyle sınırlı, yani başka bir kulübün
-- logosuna dokunulamıyor.
drop policy if exists "Sadece kendi kulübünün admini logo yükleyebilir" on storage.objects;
create policy "Sadece kendi kulübünün admini logo yükleyebilir" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-logos'
    and current_user_role() = any (array['club_admin', 'super_admin'])
    and (public.is_super_admin() or (storage.foldername(name))[1] = (public.current_club_id_raw())::text)
  );

drop policy if exists "Sadece kendi kulübünün admini logosunu güncelleyebilir" on storage.objects;
create policy "Sadece kendi kulübünün admini logosunu güncelleyebilir" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-logos'
    and current_user_role() = any (array['club_admin', 'super_admin'])
    and (public.is_super_admin() or (storage.foldername(name))[1] = (public.current_club_id_raw())::text)
  );
