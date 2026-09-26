-- Kullanıcı kararı (2026-09-26): geçmiş bir antrenmanın yoklaması artık
-- HİÇBİR ROL tarafından değiştirilemez — sadece önizleme (görüntüleme).
-- Eskiden bu pencere (antrenman başlamadan/başladıktan sonra X dakika)
-- sadece İSTEMCİDE uygulanıyordu VE kulüp admini için hiç uygulanmıyordu
-- ("ofisten geriye dönük düzeltme" senaryosu, bkz. eski AttendanceScreen
-- yorumu) — üstelik can_write_attendance() (asıl RLS kontrolü) pencereyi
-- HİÇ bilmiyordu, admin VE antrenör için de zaman sınırı yoktu; sadece
-- istemcideki buton/uyarı caydırıcıydı, doğrudan bir API çağrısı bunu
-- tamamen atlayabilirdi. Artık pencere kontrolü can_write_attendance
-- içinde, admin dahil HERKES için — CLAUDE.md'deki ilke: "Postgres RLS
-- gerçek yetkilendirme katmanı, istemci taraflı kontrol değil."
--
-- Görüntüleme (SELECT) bu kısıtlamadan MUAF — geçmiş yoklama hâlâ
-- görülebilmeli ("önizleme"), sadece INSERT/UPDATE/DELETE kilitleniyor.
create or replace function public.can_write_attendance(p_session_id uuid, p_athlete_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  -- Saatler Türkiye yerel saati olarak saklandığı için karşılaştırma
  -- Europe/Istanbul'a çevrilerek yapılıyor (send_session_rpe_reminders'daki
  -- aynı desen).
  v_now timestamp := (now() at time zone 'Europe/Istanbul');
begin
  return exists (
    select 1
    from training_sessions s
    join athletes a on a.id = p_athlete_id and a.club_id = s.club_id
    left join club_settings cs on cs.club_id = s.club_id
    where s.id = p_session_id
      and s.club_id = current_club_id()
      and v_now between
        (s.session_date + s.start_time) - make_interval(mins => coalesce(cs.attendance_window_before_minutes, 15)::int)
        and
        (s.session_date + s.start_time) + make_interval(mins => coalesce(cs.attendance_window_after_minutes, 15)::int)
      and (
        public.is_admin_tier()
        or (
          public.is_my_coached_group(s.group_id)
          and (
            a.group_id = s.group_id
            or exists (select 1 from athlete_groups ag where ag.athlete_id = a.id and ag.group_id = s.group_id)
          )
        )
      )
  );
end;
$$;

-- ---------- SELECT: pencereden bağımsız, admin her zaman görüntüler ----------
-- (attendance_coach_select / attendance_own_select zaten pencereden
-- bağımsızdı, dokunulmadı — antrenör/veli/sporcu için değişiklik yok.)
drop policy if exists attendance_admin_all on public.attendance;
create policy attendance_admin_select on public.attendance
  for select to authenticated
  using (
    is_admin_tier()
    and exists (select 1 from training_sessions s where s.id = attendance.session_id and s.club_id = current_club_id())
  );

-- ---------- Yazma: sadece pencere içinde, TEK politika (admin+antrenör) ----------
-- Eski attendance_coach_insert/_update ile aynı işi görüyor ama artık
-- can_write_attendance TEK yerde hem admin hem antrenör için pencereyi
-- zorunlu kıldığından, ikisini ayrı politikalarda tekrar etmeye gerek yok.
drop policy if exists attendance_coach_insert on public.attendance;
create policy attendance_write_insert on public.attendance
  for insert to authenticated
  with check (public.can_write_attendance(session_id, athlete_id));

drop policy if exists attendance_coach_update on public.attendance;
create policy attendance_write_update on public.attendance
  for update to authenticated
  using (is_admin_tier() or is_athletes_coach(athlete_id))
  with check (public.can_write_attendance(session_id, athlete_id));

-- Silme daha önce sadece admin'e açıktı (attendance_admin_all'ın parçası
-- olarak) — artık o da pencereyle sınırlı.
create policy attendance_delete on public.attendance
  for delete to authenticated
  using (
    is_admin_tier()
    and public.can_write_attendance(session_id, athlete_id)
  );
