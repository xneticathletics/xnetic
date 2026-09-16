-- Veli sosyal alanda sadece görüntüleme yapabilmeli, paylaşım yapamamalı.
-- social_posts_insert politikası is_my_branch() üzerinden kontrol
-- ediyordu, ama is_my_branch() velinin çocuğunun branşını da geçerli
-- sayıyor (paylaşım DIŞINDA, görme/bildirim gibi başka amaçlarla kasıtlı
-- olarak öyle tasarlanmış) — bu yüzden veli aslında paylaşım
-- yapabiliyordu. current_user_role() <> 'parent' şartı ekleniyor.
drop policy if exists "social_posts_insert" on public.social_posts;
create policy "social_posts_insert" on public.social_posts
  for insert to authenticated
  with check (
    club_id = current_club_id()
    and is_current_user_row(author_id)
    and current_user_role() <> 'parent'
    and (is_my_branch(branch) or is_admin_tier())
  );
