-- BULUNAN HATA (kod incelemesinde, canlıya sürülmeden yakalandı): audit_log
-- tablosundaki club_id/actor_user_id foreign key'leri varsayılan NO ACTION
-- davranışını kullanıyordu. delete-club fonksiyonu artık silme işleminden
-- ÖNCE audit_log'a "club_deleted" kaydı yazıyor — o kayıt club_id'ye
-- referans verdiği için, hemen ardından gelen "delete from clubs" işlemi
-- foreign key ihlali ile BAŞARISIZ OLURDU (denetim kaydının kendisi,
-- kaydettiği silme işlemini engellerdi). Aynı sorun actor_user_id için de
-- geçerli: bir kulüp silindiğinde CASCADE ile o kulübün TÜM kullanıcıları
-- da siliniyor — eğer o kullanıcılardan biri (silen admin dahil) daha önce
-- herhangi bir audit_log satırında actor_user_id olarak geçtiyse, o
-- kullanıcı satırının silinmesi de aynı şekilde engellenirdi.
--
-- Çözüm: ON DELETE SET NULL — kulüp/kullanıcı silinince denetim kaydı
-- SATIRI kalıcı kalır (asıl amaç bu), sadece o sütun NULL'a düşer; hangi
-- kulüp/kullanıcı olduğu zaten "details" jsonb'sinde (clubName, target_email
-- vb.) ayrıca saklanıyor.
alter table public.audit_log drop constraint audit_log_club_id_fkey;
alter table public.audit_log add constraint audit_log_club_id_fkey
  foreign key (club_id) references public.clubs(id) on delete set null;

alter table public.audit_log drop constraint audit_log_actor_user_id_fkey;
alter table public.audit_log add constraint audit_log_actor_user_id_fkey
  foreign key (actor_user_id) references public.users(id) on delete set null;
