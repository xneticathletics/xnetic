-- PERFORMANS: users tablosunun 8 ayrı SELECT politikası tek politikada
-- birleştiriliyor. GÖRÜNÜRLÜK KURALLARI BİREBİR AYNI — sadece sıra değişiyor.
--
-- Sorun: Postgres tüm politikaları tek bir OR ifadesine çeviriyor ve bu
-- ifadeyi soldan sağa değerlendiriyor. Politikalar ada göre sıralandığı
-- için PAHALI olanlar (is_coach_of_my_athlete, is_parent_of_my_coached_athlete,
-- is_branch_mate_coach, is_my_coordinated_branch_coach — hepsi SECURITY
-- DEFINER, satır başına alt sorgu) başa; UCUZ yönetici kontrolü en sona
-- düşüyordu. EXPLAIN (130 kullanıcılık demo kulüp, yönetici olarak):
--     Seq Scan on users ... actual time=10.4..78.3
--     Buffers: shared hit=34928      <-- satır başına alt sorgular
-- Yani bir kulüp yöneticisi, kendi ucuz kuralına ulaşmadan önce her satır
-- için dört pahalı fonksiyonu çalıştırıyordu. Gerçek boyuttaki bir kulüpte
-- bu saniyelere çıkıyor (ana sayfadaki antrenör listesi, kullanıcı ekranı).
--
-- Çözüm: tek politika, ucuz kollar önde. İlk eşleşen kol kısa devre yapıyor.

drop policy if exists users_own_select on public.users;
drop policy if exists users_select_club_admins on public.users;
drop policy if exists users_admin_select_super_admin on public.users;
drop policy if exists users_super_admin_select_club_admins on public.users;
drop policy if exists users_select_coach_parents on public.users;
drop policy if exists users_select_my_group_coaches on public.users;
drop policy if exists users_select_branch_mate_coaches on public.users;
drop policy if exists users_select_coordinator_branch_coaches on public.users;

create policy users_select on public.users
  for select to authenticated
  using (
    -- --- UCUZ KOLLAR (sadece claim/sütun karşılaştırması) ---
    -- 1) Kendi satırım.
    auth_user_id = auth.uid()
    -- 2) Kulüp yöneticisi kendi kulübünün tamamını görür (eski users_admin_all
    --    ALL politikasıyla aynı kural; burada da olması yöneticinin pahalı
    --    kollara hiç girmemesini sağlıyor).
    or (club_id = public.current_club_id() and public.is_admin_tier())
    -- 3) Kulüpteki herkes, kulübün yöneticilerini görebilir (mesajlaşma için).
    or (club_id = public.current_club_id() and role = 'club_admin' and is_active)
    -- 4) Yönetici tier'ı süper admini görebilir (mesajlaşma için).
    or (public.is_admin_tier() and role = 'super_admin' and is_active)
    -- 5) Süper admin yalnızca kulüp yöneticilerini görür.
    or (public.is_super_admin() and role = 'club_admin' and is_active)

    -- --- PAHALI KOLLAR (satır başına alt sorgu) — en sonda ---
    or (
      club_id = public.current_club_id()
      and (
        -- Antrenör: kendi sporcularının velileri/sporcu hesapları.
        public.is_parent_of_my_coached_athlete(id)
        -- Veli/sporcu: kendi sporcusunun antrenörleri.
        or public.is_coach_of_my_athlete(id)
        or (
          role = 'coach'
          and (
            -- Aynı branştaki antrenör arkadaşları.
            public.is_branch_mate_coach(id)
            -- Koordinatörün kendi branşındaki antrenörler.
            or public.is_my_coordinated_branch_coach(id)
          )
        )
      )
    )
  );
