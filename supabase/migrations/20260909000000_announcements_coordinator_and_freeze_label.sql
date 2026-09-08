-- Branş koordinatörü artık kendi branşının gruplarına duyuru
-- gönderebiliyor — "kendi branşının admini" ilkesi. Kulüp geneli
-- (club/parents/coaches/athletes hedefli) duyurular hâlâ sadece admin'e
-- özel; istemci tarafında (AnnouncementFormScreen) koordinatöre zaten
-- sadece "Belirli Gruplar" seçeneği gösteriliyor ve grup seçici kendi
-- branşına kilitli — ama gerçek yetki kontrolü burada, RLS'te.
drop policy if exists "announcements_admin_write" on public.announcements;
create policy "announcements_admin_write" on public.announcements
  for insert to authenticated
  with check (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()));

-- Antrenör detayı ekranları (kişisel bilgi, branş/belge, izin, atamalar)
-- bugüne kadar hiç koordinatöre açılmamıştı (o kutucuk yoktu) — bu yüzden
-- altlarındaki RLS hep admin-only kalmış, kimse fark etmemiş. Şimdi
-- "Antrenör detayını düzenleyebilir" onayıyla, koordinatör kendi
-- branşındaki bir antrenörün bu bilgilerini düzenleyebiliyor — SADECE o
-- antrenör gerçekten koordinatörün branşındaysa (coach_branches üzerinden).

-- 1) Kişisel bilgiler (CoachFormScreen) — users tablosu.
create policy "users_coordinator_update_branch_coaches" on public.users
  for update to authenticated
  using (
    club_id = public.current_club_id()
    and role = 'coach'
    and exists (select 1 from coach_branches cb where cb.coach_id = users.id and public.is_my_coordinator_branch((select name from branches where id = cb.branch_id)))
  )
  with check (
    club_id = public.current_club_id()
    and role = 'coach'
    and exists (select 1 from coach_branches cb where cb.coach_id = users.id and public.is_my_coordinator_branch((select name from branches where id = cb.branch_id)))
  );

-- 2) Branş/belge bilgileri (CoachBranchScreen) — sadece KENDİ branşına
-- yeni bir kayıt ekleyebilir/güncelleyebilir/silebilir, başka bir branşa
-- ekleyemez (with check aynı koşulu tekrar doğruluyor).
create policy "coach_branches_coordinator_write" on public.coach_branches
  for all to authenticated
  using (
    exists (select 1 from users u where u.id = coach_branches.coach_id and u.club_id = public.current_club_id())
    and exists (select 1 from branches b where b.id = coach_branches.branch_id and public.is_my_coordinator_branch(b.name))
  )
  with check (
    exists (select 1 from users u where u.id = coach_branches.coach_id and u.club_id = public.current_club_id())
    and exists (select 1 from branches b where b.id = coach_branches.branch_id and public.is_my_coordinator_branch(b.name))
  );

-- 3) İzin kayıtları (CoachLeaveScreen) — coach_leaves.
create policy "coach_leaves_coordinator_write" on public.coach_leaves
  for all to authenticated
  using (
    club_id = public.current_club_id()
    and exists (
      select 1 from coach_branches cb
      where cb.coach_id = coach_leaves.coach_id
      and public.is_my_coordinator_branch((select name from branches where id = cb.branch_id))
    )
  )
  with check (
    club_id = public.current_club_id()
    and exists (
      select 1 from coach_branches cb
      where cb.coach_id = coach_leaves.coach_id
      and public.is_my_coordinator_branch((select name from branches where id = cb.branch_id))
    )
  );

-- 4) Grup atamaları (Antrenör Atamaları / CoachesOverviewScreen) — Baş
-- Antrenör ataması groups.head_coach_id, Yardımcı Antrenör group_coaches
-- üzerinden. is_my_coordinated_group zaten training_sessions için
-- kurulmuştu (bkz. 20260907040000) — aynı fonksiyon burada da geçerli:
-- koordinatör sadece KENDİ branşındaki gruplara atama yapabilir. Bu,
-- groups tablosunun diğer kolonlarını (isim/salon/sabit program) da
-- teknik olarak UPDATE edilebilir kılıyor — ama "Kulüp Yapısı" ekranı
-- (GroupFormScreen) koordinatöre hâlâ hiç açık değil, o yüzden gerçek
-- kullanım hep Antrenör Atamaları üzerinden kalıyor.
create policy "groups_coordinator_update" on public.groups
  for update to authenticated
  using (club_id = public.current_club_id() and public.is_my_coordinated_group(id))
  with check (club_id = public.current_club_id() and public.is_my_coordinated_group(id));

create policy "group_coaches_coordinator_write" on public.group_coaches
  for all to authenticated
  using (exists (select 1 from groups g where g.id = group_coaches.group_id and public.is_my_coordinated_group(g.id)))
  with check (exists (select 1 from groups g where g.id = group_coaches.group_id and public.is_my_coordinated_group(g.id)));

-- Kayıt dondurma talebini kim gönderdiyse o rolle etiketlensin — bugüne
-- kadar club_admin dışındaki HERKES (koordinatör/antrenör dahil) "veli"
-- olarak etiketleniyordu (bkz. MembershipFreezeScreen.tsx), çünkü kolonun
-- check constraint'i sadece 'parent'/'admin' kabul ediyordu. 'coach'
-- değeri ekleniyor — gerçek etiketleme değişikliği aynı commit'teki
-- MembershipFreezeScreen.tsx'te.
alter table public.membership_freezes drop constraint if exists membership_freezes_requested_by_role_check;
alter table public.membership_freezes add constraint membership_freezes_requested_by_role_check
  check (requested_by_role = any (array['parent', 'admin', 'coach']));
