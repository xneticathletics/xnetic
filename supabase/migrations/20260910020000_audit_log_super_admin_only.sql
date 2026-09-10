-- Kullanıcı kararı: Denetim Kaydı club_admin'e hiç gösterilmesin, sadece
-- süper adminin işi olsun. Özellik ilk eklendiğinde bilerek club_admin'e
-- de (sadece kendi kulübü) açılmıştı — şimdi bu tamamen geri alınıyor.
drop policy if exists "audit_log_select_club_admin_own_club" on public.audit_log;
