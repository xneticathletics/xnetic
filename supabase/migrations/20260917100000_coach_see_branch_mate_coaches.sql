-- Antrenörler için mesajlaşma İZNİ (can_message_recipient) genişletildi
-- ama "users" tablosunda antrenörün BAŞKA bir düz antrenörü GÖREBİLECEĞİ
-- bir SELECT politikası hiç yoktu — sadece koordinatör branşındaki
-- antrenörleri görebiliyordu (users_select_coordinator_branch_coaches).
-- Bu yüzden listMyContacts()'taki coach_branches sorgusu doğru satırları
-- bulsa bile, iç içe geçmiş users:coach_id(...) embed'i RLS yüzünden
-- sessizce NULL dönüyordu — antrenörler filtresi boş görünüyordu.
create policy "users_select_branch_mate_coaches" on public.users
  for select to authenticated
  using (
    club_id = current_club_id()
    and role = 'coach'
    and exists (
      select 1 from coach_branches cb1
      join coach_branches cb2 on cb2.branch_id = cb1.branch_id
      where cb1.coach_id = my_user_id() and cb2.coach_id = users.id
    )
  );

-- Aynı hata sınıfı: sporcu, kendi grubundaki diğer sporculara mesaj
-- gönderebilsin diye can_message_recipient() zaten genişletilmişti
-- (bkz. migration 20260916140000), ama "users" tablosunda bir sporcunun
-- BAŞKA bir sporcunun hesabını görebileceği bir SELECT politikası hiç
-- yoktu — bu yüzden groupmate sorgusu da sessizce boş dönüyordu.
create policy "users_select_groupmate_athletes" on public.users
  for select to authenticated
  using (
    club_id = current_club_id()
    and role = 'athlete'
    and exists (
      select 1 from athletes a1
      join athletes a2 on a2.group_id = a1.group_id
      where a1.athlete_user_id = my_user_id()
        and a1.group_id is not null
        and a2.athlete_user_id = users.id
    )
  );
