-- 20260909000000_announcements_coordinator_and_freeze_label.sql'in kendi
-- yorumu "Kulüp geneli (club/parents/coaches/athletes hedefli) duyurular
-- hâlâ sadece admin'e özel... gerçek yetki kontrolü burada, RLS'te" diyordu
-- ama with check hiçbir zaman target_types/target_ids'e bakmadı — sadece
-- club_id ve (admin veya koordinatör) kontrolü vardı. Tam uygulama
-- taraması sırasında bulundu: bir branş koordinatörü, AnnouncementFormScreen
-- arayüzünü atlayıp doğrudan bir REST çağrısıyla target_types=['club'] (ya
-- da 'parents'/'coaches'/'athletes', ya da başka bir branşın grubu) vererek
-- kulüp geneline veya kendi branşı dışına duyuru yayınlayabiliyordu.
--
-- Düzeltme: admin olmayan (koordinatör) bir insert, SADECE target_types
-- tam olarak {group} olduğunda ve target_ids'teki HER grup kendi
-- koordine ettiği bir grup olduğunda geçerli.
drop policy if exists "announcements_admin_write" on public.announcements;
create policy "announcements_admin_write" on public.announcements
  for insert to authenticated
  with check (
    club_id = public.current_club_id()
    and (
      public.is_admin_tier()
      or (
        public.is_branch_coordinator()
        and target_types = array['group']::public.announcement_target[]
        and target_ids is not null
        and array_length(target_ids, 1) > 0
        and not exists (
          select 1 from unnest(target_ids) as gid
          where not public.is_my_coordinated_group(gid)
        )
      )
    )
  );
