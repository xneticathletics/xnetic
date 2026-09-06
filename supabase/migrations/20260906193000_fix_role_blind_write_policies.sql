-- Güvenlik denetiminde bulundu: birçok tabloda RLS, "kulübün üyesi mi"
-- (club_id = current_club_id()) dışında HİÇBİR rol kontrolü yapmıyordu ve
-- cmd=ALL tek bir politikaya bağlıydı — yani SELECT/INSERT/UPDATE/DELETE
-- hepsi aynı, role-kör kurala tabiydi. Uygulama arayüzü bu ekranları sadece
-- club_admin/koordinatöre gösterse de, RLS bunu ZORUNLU KILMIYORDU: bir
-- veli ya da sporcu hesabı, doğrudan REST API çağrısıyla (uygulamanın
-- arayüzünü hiç kullanmadan) bu tablolara yazabiliyordu.
--
-- Canlıda test kulübündeki bir veli hesabıyla doğrulandı: veli, club_settings
-- tablosuna "payment_overdue_grace_days":9999 ve "disabled_home_tiles" içeren
-- bir satır INSERT edebildi (201), ve tüm kulübe görünen sahte bir duyuru
-- (announcements) oluşturabildi (201). İkisi de test sonrası admin
-- hesabıyla silindi.
--
-- Düzeltme: her tabloda SELECT (mevcut, geniş erişim aynı kalıyor) ile
-- INSERT/UPDATE/DELETE (artık is_admin_tier() ve/veya ilgili
-- antrenör/koordinatör kontrolüyle sınırlı) ayrıştırılıyor. Hangi rolün
-- neyi yazabildiği, o tabloya yazan mevcut app kodundaki (src/lib/api/*)
-- gerçek kullanım noktalarından çıkarıldı — UI'da zaten sadece o roller
-- görünüyordu, burada aynı kural DB seviyesinde de zorunlu kılınıyor.

-- ===================================================================
-- Grup A: basit club_id kontrolü, yazma sadece is_admin_tier() (club_admin)
-- ===================================================================

drop policy if exists tenant_isolation_club_settings on public.club_settings;
create policy club_settings_select on public.club_settings for select using (club_id = current_club_id());
create policy club_settings_admin_write on public.club_settings for insert with check (club_id = current_club_id() and is_admin_tier());
create policy club_settings_admin_update on public.club_settings for update using (club_id = current_club_id() and is_admin_tier()) with check (club_id = current_club_id() and is_admin_tier());
create policy club_settings_admin_delete on public.club_settings for delete using (club_id = current_club_id() and is_admin_tier());

drop policy if exists tenant_isolation_branches on public.branches;
create policy branches_select on public.branches for select using (club_id = current_club_id());
create policy branches_admin_write on public.branches for insert with check (club_id = current_club_id() and is_admin_tier());
create policy branches_admin_update on public.branches for update using (club_id = current_club_id() and is_admin_tier()) with check (club_id = current_club_id() and is_admin_tier());
create policy branches_admin_delete on public.branches for delete using (club_id = current_club_id() and is_admin_tier());

drop policy if exists tenant_isolation_venues on public.venues;
create policy venues_select on public.venues for select using (club_id = current_club_id());
create policy venues_admin_write on public.venues for insert with check (club_id = current_club_id() and is_admin_tier());
create policy venues_admin_update on public.venues for update using (club_id = current_club_id() and is_admin_tier()) with check (club_id = current_club_id() and is_admin_tier());
create policy venues_admin_delete on public.venues for delete using (club_id = current_club_id() and is_admin_tier());

drop policy if exists tenant_isolation_groups on public.groups;
create policy groups_select on public.groups for select using (club_id = current_club_id());
create policy groups_admin_write on public.groups for insert with check (club_id = current_club_id() and is_admin_tier());
create policy groups_admin_update on public.groups for update using (club_id = current_club_id() and is_admin_tier()) with check (club_id = current_club_id() and is_admin_tier());
create policy groups_admin_delete on public.groups for delete using (club_id = current_club_id() and is_admin_tier());

drop policy if exists tenant_isolation_announcements on public.announcements;
create policy announcements_select on public.announcements for select using (club_id = current_club_id());
create policy announcements_admin_write on public.announcements for insert with check (club_id = current_club_id() and is_admin_tier());
create policy announcements_admin_update on public.announcements for update using (club_id = current_club_id() and is_admin_tier()) with check (club_id = current_club_id() and is_admin_tier());
create policy announcements_admin_delete on public.announcements for delete using (club_id = current_club_id() and is_admin_tier());

-- ===================================================================
-- Grup B: EXISTS ile kulüp kontrolü yapan atama tabloları, yazma sadece
-- is_admin_tier() — CoachesList/CoachDetail (Antrenörler) ekranı zaten
-- sadece club_admin'e görünüyor.
-- ===================================================================

drop policy if exists tenant_isolation_group_coaches on public.group_coaches;
create policy group_coaches_select on public.group_coaches for select
  using (exists (select 1 from groups g where g.id = group_coaches.group_id and g.club_id = current_club_id()));
create policy group_coaches_admin_write on public.group_coaches for insert
  with check (is_admin_tier() and exists (select 1 from groups g where g.id = group_coaches.group_id and g.club_id = current_club_id()));
create policy group_coaches_admin_update on public.group_coaches for update
  using (is_admin_tier() and exists (select 1 from groups g where g.id = group_coaches.group_id and g.club_id = current_club_id()))
  with check (is_admin_tier() and exists (select 1 from groups g where g.id = group_coaches.group_id and g.club_id = current_club_id()));
create policy group_coaches_admin_delete on public.group_coaches for delete
  using (is_admin_tier() and exists (select 1 from groups g where g.id = group_coaches.group_id and g.club_id = current_club_id()));

drop policy if exists tenant_isolation_coach_branches on public.coach_branches;
create policy coach_branches_select on public.coach_branches for select
  using (exists (select 1 from users u where u.id = coach_branches.coach_id and u.club_id = current_club_id()));
create policy coach_branches_admin_write on public.coach_branches for insert
  with check (is_admin_tier() and exists (select 1 from users u where u.id = coach_branches.coach_id and u.club_id = current_club_id()));
create policy coach_branches_admin_update on public.coach_branches for update
  using (is_admin_tier() and exists (select 1 from users u where u.id = coach_branches.coach_id and u.club_id = current_club_id()))
  with check (is_admin_tier() and exists (select 1 from users u where u.id = coach_branches.coach_id and u.club_id = current_club_id()));
create policy coach_branches_admin_delete on public.coach_branches for delete
  using (is_admin_tier() and exists (select 1 from users u where u.id = coach_branches.coach_id and u.club_id = current_club_id()));

-- ===================================================================
-- Grup C: içerik/atama tabloları — admin VEYA o kaydın antrenörü/branş
-- koordinatörü yazabilir (uygulamada da bu roller kullanıyor).
-- ===================================================================

-- athlete_groups: "Ek Branşlar ve Gruplar" — admin ya da sporcunun kendi
-- antrenörü ekleyip çıkarabiliyor (AthleteDetailScreen, isStaff).
drop policy if exists tenant_isolation_athlete_groups on public.athlete_groups;
create policy athlete_groups_select on public.athlete_groups for select
  using (exists (select 1 from athletes a where a.id = athlete_groups.athlete_id and a.club_id = current_club_id()));
create policy athlete_groups_write on public.athlete_groups for insert
  with check (exists (select 1 from athletes a where a.id = athlete_groups.athlete_id and a.club_id = current_club_id() and (is_admin_tier() or is_athletes_coach(a.id))));
create policy athlete_groups_update on public.athlete_groups for update
  using (exists (select 1 from athletes a where a.id = athlete_groups.athlete_id and a.club_id = current_club_id() and (is_admin_tier() or is_athletes_coach(a.id))))
  with check (exists (select 1 from athletes a where a.id = athlete_groups.athlete_id and a.club_id = current_club_id() and (is_admin_tier() or is_athletes_coach(a.id))));
create policy athlete_groups_delete on public.athlete_groups for delete
  using (exists (select 1 from athletes a where a.id = athlete_groups.athlete_id and a.club_id = current_club_id() and (is_admin_tier() or is_athletes_coach(a.id))));

-- fitness_group_members: Fitness Grupları üyeleri — grup oluşturma/düzenleme
-- her antrenöre açık (FitnessGroupsScreen'de canCreate kısıtı yok).
drop policy if exists tenant_isolation_fitness_group_members on public.fitness_group_members;
create policy fitness_group_members_select on public.fitness_group_members for select
  using (exists (select 1 from fitness_groups fg where fg.id = fitness_group_members.fitness_group_id and fg.club_id = current_club_id()));
create policy fitness_group_members_write on public.fitness_group_members for insert
  with check (exists (select 1 from fitness_groups fg where fg.id = fitness_group_members.fitness_group_id and fg.club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach')));
create policy fitness_group_members_update on public.fitness_group_members for update
  using (exists (select 1 from fitness_groups fg where fg.id = fitness_group_members.fitness_group_id and fg.club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach')))
  with check (exists (select 1 from fitness_groups fg where fg.id = fitness_group_members.fitness_group_id and fg.club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach')));
create policy fitness_group_members_delete on public.fitness_group_members for delete
  using (exists (select 1 from fitness_groups fg where fg.id = fitness_group_members.fitness_group_id and fg.club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach')));

-- match_roster: maç kadrosu — admin ya da o maçın grubunu koçlayan antrenör.
drop policy if exists tenant_isolation_match_roster on public.match_roster;
create policy match_roster_select on public.match_roster for select
  using (exists (select 1 from matches m where m.id = match_roster.match_id and m.club_id = current_club_id()));
create policy match_roster_write on public.match_roster for insert
  with check (exists (select 1 from matches m where m.id = match_roster.match_id and m.club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(m.group_id))));
create policy match_roster_update on public.match_roster for update
  using (exists (select 1 from matches m where m.id = match_roster.match_id and m.club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(m.group_id))))
  with check (exists (select 1 from matches m where m.id = match_roster.match_id and m.club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(m.group_id))));
create policy match_roster_delete on public.match_roster for delete
  using (exists (select 1 from matches m where m.id = match_roster.match_id and m.club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(m.group_id))));

-- training_session_media: antrenman fotoğraf/video eki — admin ya da o
-- antrenmanın grubunu koçlayan antrenör.
drop policy if exists tenant_isolation_training_session_media on public.training_session_media;
create policy training_session_media_select on public.training_session_media for select using (club_id = current_club_id());
create policy training_session_media_write on public.training_session_media for insert
  with check (club_id = current_club_id() and (is_admin_tier() or exists (select 1 from training_sessions ts where ts.id = training_session_media.session_id and is_my_coached_group(ts.group_id))));
create policy training_session_media_update on public.training_session_media for update
  using (club_id = current_club_id() and (is_admin_tier() or exists (select 1 from training_sessions ts where ts.id = training_session_media.session_id and is_my_coached_group(ts.group_id))))
  with check (club_id = current_club_id() and (is_admin_tier() or exists (select 1 from training_sessions ts where ts.id = training_session_media.session_id and is_my_coached_group(ts.group_id))));
create policy training_session_media_delete on public.training_session_media for delete
  using (club_id = current_club_id() and (is_admin_tier() or exists (select 1 from training_sessions ts where ts.id = training_session_media.session_id and is_my_coached_group(ts.group_id))));

-- training_plans: şu an hiçbir ekran tarafından kullanılmıyor (src/lib/api
-- içinde referansı yok) ama savunma amaçlı aynı kurala bağlanıyor.
drop policy if exists tenant_isolation_training_plans on public.training_plans;
create policy training_plans_select on public.training_plans for select using (club_id = current_club_id());
create policy training_plans_write on public.training_plans for insert
  with check (club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(group_id)));
create policy training_plans_update on public.training_plans for update
  using (club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(group_id)))
  with check (club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(group_id)));
create policy training_plans_delete on public.training_plans for delete
  using (club_id = current_club_id() and (is_admin_tier() or is_my_coached_group(group_id)));

-- ===================================================================
-- Grup D: Fitness Grupları/Programları — oluşturma/düzenleme her
-- antrenöre açık, SİLME sadece admin+branş koordinatörüne (bu oturumda
-- ekranlardan silme butonu bu şekilde kısıtlanmıştı — DB aynı kuralı
-- şimdi zorunlu kılıyor).
-- ===================================================================

drop policy if exists tenant_isolation_fitness_groups on public.fitness_groups;
create policy fitness_groups_select on public.fitness_groups for select using (club_id = current_club_id());
create policy fitness_groups_write on public.fitness_groups for insert
  with check (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'));
create policy fitness_groups_update on public.fitness_groups for update
  using (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'))
  with check (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'));
create policy fitness_groups_delete on public.fitness_groups for delete
  using (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()));

drop policy if exists tenant_isolation_fitness_programs on public.fitness_programs;
create policy fitness_programs_select on public.fitness_programs for select using (club_id = current_club_id());
create policy fitness_programs_write on public.fitness_programs for insert
  with check (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'));
create policy fitness_programs_update on public.fitness_programs for update
  using (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'))
  with check (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'));
create policy fitness_programs_delete on public.fitness_programs for delete
  using (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()));

drop policy if exists tenant_isolation_fitness_program_items on public.fitness_program_items;
create policy fitness_program_items_select on public.fitness_program_items for select using (club_id = current_club_id());
create policy fitness_program_items_write on public.fitness_program_items for insert
  with check (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'));
create policy fitness_program_items_update on public.fitness_program_items for update
  using (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'))
  with check (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'));
create policy fitness_program_items_delete on public.fitness_program_items for delete
  using (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()));

-- nutrition_articles: kulübe özel yazılar — düzenleme club_admin+koordinatör,
-- silme SADECE süper admin (NutritionArticleDetailScreen.tsx canEdit/canDelete
-- ile birebir aynı kural — bu oturumda mobil/web'de uygulanmıştı, RLS'te
-- eksikti). Global (club_id NULL) satırlar bu politikaların dışında kalmaya
-- devam ediyor (ayrı bir konu, bu denetimin kapsamı dışında).
drop policy if exists tenant_isolation_nutrition_articles on public.nutrition_articles;
create policy nutrition_articles_select on public.nutrition_articles for select using (club_id = current_club_id());
create policy nutrition_articles_write on public.nutrition_articles for insert
  with check (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()));
create policy nutrition_articles_update on public.nutrition_articles for update
  using (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
  with check (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()));
create policy nutrition_articles_delete on public.nutrition_articles for delete
  using (is_super_admin());

-- fitness_exercises: club-owned satırların insert/update/delete'inde ROL
-- kontrolü hiç yoktu (sadece club_id eşleşmesi) — global (club_id NULL)
-- satırlar zaten doğru korunuyordu, sadece kulübe özel satırlar eksikti.
drop policy if exists fitness_exercises_insert on public.fitness_exercises;
create policy fitness_exercises_insert on public.fitness_exercises for insert
  with check (
    (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'))
    or (club_id is null and is_super_admin())
  );
drop policy if exists fitness_exercises_update on public.fitness_exercises;
create policy fitness_exercises_update on public.fitness_exercises for update
  using (
    (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  )
  with check (
    (club_id = current_club_id() and (is_admin_tier() or current_user_role() = 'coach'))
    or (club_id is null and current_user_role() = any (array['coach','club_admin','super_admin']))
  );
drop policy if exists fitness_exercises_delete on public.fitness_exercises;
create policy fitness_exercises_delete on public.fitness_exercises for delete
  using (
    (club_id = current_club_id() and (is_admin_tier() or is_branch_coordinator()))
    or (club_id is null and is_super_admin())
  );

-- ===================================================================
-- Grup E: announcement_reads — okundu bilgisi sadece kendi adına
-- yazılabilir (başkası adına "okudu" işaretlemek/silmek anlamsız ve
-- kötüye kullanılabilir).
-- ===================================================================

drop policy if exists tenant_isolation_announcement_reads on public.announcement_reads;
create policy announcement_reads_select on public.announcement_reads for select
  using (exists (select 1 from announcements a where a.id = announcement_reads.announcement_id and a.club_id = current_club_id()));
create policy announcement_reads_own_write on public.announcement_reads for insert
  with check (exists (select 1 from users u where u.id = announcement_reads.user_id and u.auth_user_id = auth.uid()));
create policy announcement_reads_own_update on public.announcement_reads for update
  using (exists (select 1 from users u where u.id = announcement_reads.user_id and u.auth_user_id = auth.uid()))
  with check (exists (select 1 from users u where u.id = announcement_reads.user_id and u.auth_user_id = auth.uid()));
create policy announcement_reads_own_delete on public.announcement_reads for delete
  using (exists (select 1 from users u where u.id = announcement_reads.user_id and u.auth_user_id = auth.uid()));
