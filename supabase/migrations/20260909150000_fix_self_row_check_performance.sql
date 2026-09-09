-- Antrenörler ekranındaki yavaşlığı ararken bulunan İKİNCİ, daha yaygın
-- bir performans deseni: "bu satır BENİM kendi satırım mı" kontrolü için
-- pek çok politika, doğrudan RLS'e tabi "users" tablosuna karşı ham bir
-- alt sorgu yazıyordu — "exists (select 1 from users u where u.id = X and
-- u.auth_user_id = auth.uid())" ya da "X = (select users.id from users
-- where auth_user_id = auth.uid())". Bu alt sorgu "users" tablosuna
-- eriştiği için users'ın KENDİ (8 politikadan oluşan, pahalı) RLS
-- filtresine de tabi oluyor — Postgres bunu genelde "önce hangi
-- kullanıcıları görebiliyorum" diye TÜM users tablosunu tarayıp bir
-- hash kümesi kurarak çözüyor (notifications listesi için canlıda
-- ölçüldü: ~226ms, sadece "bu benim kendi bildirimim mi" diye bakmak
-- için tüm 420 kullanıcı satırı taranıyordu).
--
-- Oysa "bu benim kendi satırım mı" sorusunun cevabı zaten SECURITY
-- DEFINER bir yardımcı fonksiyonla (is_current_user_row — RLS'i
-- atlıyor, tek bir primary-key/unique-index sorgusu) tek satırda ve
-- neredeyse anında verilebiliyordu — sadece bu politikalar onu
-- kullanmıyordu. Aynı politikanın çıktısı/anlamı DEĞİŞMİYOR, sadece
-- HANGİ yolla hesaplandığı değişiyor.
create or replace function public.my_user_id()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select id from users where auth_user_id = auth.uid();
$$;

revoke execute on function public.my_user_id() from public;
grant execute on function public.my_user_id() to authenticated;

-- announcement_reads
drop policy if exists "announcement_reads_own_delete" on public.announcement_reads;
create policy "announcement_reads_own_delete" on public.announcement_reads
  for delete to authenticated
  using (public.is_current_user_row(user_id));

drop policy if exists "announcement_reads_own_update" on public.announcement_reads;
create policy "announcement_reads_own_update" on public.announcement_reads
  for update to authenticated
  using (public.is_current_user_row(user_id))
  with check (public.is_current_user_row(user_id));

drop policy if exists "announcement_reads_own_write" on public.announcement_reads;
create policy "announcement_reads_own_write" on public.announcement_reads
  for insert to authenticated
  with check (public.is_current_user_row(user_id));

-- event_registrations
drop policy if exists "event_registrations_select" on public.event_registrations;
create policy "event_registrations_select" on public.event_registrations
  for select to authenticated
  using (
    registered_by = public.my_user_id()
    or is_admin_tier()
    or exists (select 1 from events e where e.id = event_registrations.event_id and is_my_coordinator_branch(e.branch))
  );

-- messages
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
  for insert to authenticated
  with check (
    is_super_admin()
    or (club_id = current_club_id() and public.is_current_user_row(sender_id) and can_message_recipient(receiver_id))
  );

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages
  for select to authenticated
  using (public.is_current_user_row(sender_id) or public.is_current_user_row(receiver_id));

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages
  for update to authenticated
  using (public.is_current_user_row(receiver_id));

-- notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (public.is_current_user_row(recipient_user_id));

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (public.is_current_user_row(recipient_user_id));

-- social_posts
drop policy if exists "social_posts_delete" on public.social_posts;
create policy "social_posts_delete" on public.social_posts
  for delete to authenticated
  using (
    club_id = current_club_id()
    and (public.is_current_user_row(author_id) or is_branch_moderator(branch) or is_admin_tier())
  );

drop policy if exists "social_posts_insert" on public.social_posts;
create policy "social_posts_insert" on public.social_posts
  for insert to authenticated
  with check (
    club_id = current_club_id()
    and public.is_current_user_row(author_id)
    and (is_my_branch(branch) or is_admin_tier())
  );

drop policy if exists "social_posts_select" on public.social_posts;
create policy "social_posts_select" on public.social_posts
  for select to authenticated
  using (
    club_id = current_club_id()
    and (
      (status = 'approved' and is_my_branch(branch))
      or public.is_current_user_row(author_id)
      or is_admin_tier()
      or (status = 'pending' and is_branch_moderator(branch))
    )
  );

-- user_consents
drop policy if exists "user_consents_own_select" on public.user_consents;
create policy "user_consents_own_select" on public.user_consents
  for select to authenticated
  using (user_id = public.my_user_id());

drop policy if exists "user_consents_own_insert" on public.user_consents;
create policy "user_consents_own_insert" on public.user_consents
  for insert to authenticated
  with check (user_id = public.my_user_id());

-- push_tokens
drop policy if exists "push_tokens_select" on public.push_tokens;
create policy "push_tokens_select" on public.push_tokens
  for select to authenticated
  using (user_id = public.my_user_id());

drop policy if exists "push_tokens_delete" on public.push_tokens;
create policy "push_tokens_delete" on public.push_tokens
  for delete to authenticated
  using (user_id = public.my_user_id());
