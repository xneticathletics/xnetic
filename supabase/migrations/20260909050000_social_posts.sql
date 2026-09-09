-- "Antrenman Fotoğrafları" (bir antrenman oturumuna bağlı foto galerisi)
-- tamamen kaldırılıp yerine branş-bazlı, foto+video paylaşılabilen bir
-- "Sosyal Alan" akışı geliyor. Sporcu/veli paylaşımları branşın antrenör
-- veya koordinatörü onaylayana kadar KİMSEYE görünmez (moderasyon);
-- antrenör/koordinatör paylaşımları anında yayınlanır. Herkes SADECE
-- kendi bağlı olduğu branş(lar)ın akışını görür (admin hepsini görür).
-- 2 hafta sonra otomatik silinir (foto/video, pending/approved ayrımı yok).

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  branch text not null,
  author_id uuid not null references public.users(id),
  media_type text not null check (media_type in ('photo','video')),
  media_url text not null,
  storage_path text not null,
  caption text,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.users(id)
);

create index social_posts_club_branch_idx on public.social_posts(club_id, branch);
create index social_posts_status_idx on public.social_posts(status);
create index social_posts_created_at_idx on public.social_posts(created_at);

alter table public.social_posts enable row level security;

-- is_my_branch daha önce sadece grup üyeliği üzerinden (veli/kendi-sporcu/
-- yardımcı-antrenör/baş-antrenör) branş bağlılığı kontrol ediyordu.
-- coach_branches'taki salt "branş uzmanlığı" (hiçbir gruba atanmamış
-- antrenör) kapsam dışıydı — bu, src/lib/api/myGroups.ts'teki
-- getMyBranchGroupIds'in client-side zaten kapsadığı bir durumdu, DB
-- helper'ına da eklendi. Not: is_my_branch events_select politikasında
-- da kullanılıyor, bu genişletme aynı boşluğu orada da kapatıyor.
create or replace function public.is_my_branch(p_branch text)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_uid uuid;
begin
  if p_branch is null then return true; end if;
  select id into v_uid from users where auth_user_id = auth.uid();
  if v_uid is null then return false; end if;
  return exists (
    select 1 from athletes a join groups g on g.id = a.group_id
    where g.branch = p_branch and (a.parent_user_id = v_uid or a.athlete_user_id = v_uid)
  ) or exists (
    select 1 from group_coaches gc join groups g on g.id = gc.group_id
    where g.branch = p_branch and gc.coach_id = v_uid
  ) or exists (
    select 1 from groups g where g.branch = p_branch and g.head_coach_id = v_uid
  ) or exists (
    select 1 from coach_branches cb join branches b on b.id = cb.branch_id
    where b.name = p_branch and b.club_id = public.current_club_id() and cb.coach_id = v_uid
  );
end;
$$;

revoke execute on function public.is_my_branch(text) from public;
grant execute on function public.is_my_branch(text) to authenticated;

-- is_my_branch'ten farklı olarak veli/sporcuyu KAPSAMAZ — sadece Sosyal
-- Alan'da bekleyen paylaşımları görebilecek/onaylayabilecek/branş bazlı
-- silebilecek antrenör/koordinatörleri belirler.
create or replace function public.is_branch_moderator(p_branch text)
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_uid uuid;
begin
  if p_branch is null then return false; end if;
  select id into v_uid from users where auth_user_id = auth.uid();
  if v_uid is null then return false; end if;
  return exists (
    select 1 from group_coaches gc join groups g on g.id = gc.group_id
    where g.branch = p_branch and gc.coach_id = v_uid
  ) or exists (
    select 1 from groups g where g.branch = p_branch and g.head_coach_id = v_uid
  ) or exists (
    select 1 from coach_branches cb join branches b on b.id = cb.branch_id
    where b.name = p_branch and b.club_id = public.current_club_id() and cb.coach_id = v_uid
  ) or public.is_my_coordinator_branch(p_branch);
end;
$$;

revoke execute on function public.is_branch_moderator(text) from public;
grant execute on function public.is_branch_moderator(text) to authenticated;

-- Durum client'tan asla güvenilmez, trigger ile sunucu tarafında hesaplanır.
create or replace function public.social_posts_set_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_role text;
begin
  select role into v_role from users where id = new.author_id;
  if v_role in ('coach','club_admin') then
    new.status := 'approved';
    new.approved_at := now();
    new.approved_by := new.author_id;
  else
    new.status := 'pending';
    new.approved_at := null;
    new.approved_by := null;
  end if;
  return new;
end;
$$;

create trigger trg_social_posts_set_status
  before insert on public.social_posts
  for each row execute function public.social_posts_set_status();

create or replace function public.social_posts_set_approval()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    new.approved_at := now();
    new.approved_by := (select id from users where auth_user_id = auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_social_posts_set_approval
  before update on public.social_posts
  for each row execute function public.social_posts_set_approval();

create policy "social_posts_select" on public.social_posts
  for select to authenticated
  using (
    club_id = public.current_club_id()
    and (
      (status = 'approved' and public.is_my_branch(branch))
      or author_id = (select id from users where auth_user_id = auth.uid())
      or public.is_admin_tier()
      or (status = 'pending' and public.is_branch_moderator(branch))
    )
  );

create policy "social_posts_insert" on public.social_posts
  for insert to authenticated
  with check (
    club_id = public.current_club_id()
    and author_id = (select id from users where auth_user_id = auth.uid())
    and (public.is_my_branch(branch) or public.is_admin_tier())
  );

create policy "social_posts_approve" on public.social_posts
  for update to authenticated
  using (
    club_id = public.current_club_id()
    and status = 'pending'
    and (public.is_branch_moderator(branch) or public.is_admin_tier())
  )
  with check (
    club_id = public.current_club_id()
    and status = 'approved'
    and (public.is_branch_moderator(branch) or public.is_admin_tier())
  );

create policy "social_posts_delete" on public.social_posts
  for delete to authenticated
  using (
    club_id = public.current_club_id()
    and (
      author_id = (select id from users where auth_user_id = auth.uid())
      or public.is_branch_moderator(branch)
      or public.is_admin_tier()
    )
  );

-- Moderasyon + branş kısıtlaması olan içerik için private + ~10 yıllık
-- imzalı URL (session-media/user-photos/event-receipts ile aynı desen) —
-- public bucket olsa sızan/tahmin edilen bir URL hem pending-gate'i hem
-- branş-gate'ini tamamen atlar. 50MB sert sınır (video için).
insert into storage.buckets (id, name, public, file_size_limit)
values ('social-posts', 'social-posts', false, 52428800)
on conflict (id) do update set file_size_limit = 52428800;

-- INSERT sadece "kendi klasörüne yüklüyor" (ucuz sahiplik kontrolü, satır
-- yükleme anında henüz yok) — asıl branş/durum kısıtlaması social_posts
-- tablosunun kendi politikalarında. SELECT/DELETE ise satıra ters join
-- ile TAM OLARAK aynı görünürlük/silme kuralını uygular, aksi halde
-- createSignedUrl yetkisiz bir path için de çağrılabilirdi.
create policy "social_posts_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'social-posts'
    and (storage.foldername(storage.objects.name))[1] = public.current_club_id()::text
    and (storage.foldername(storage.objects.name))[2] = (select id::text from public.users where auth_user_id = auth.uid())
  );

create policy "social_posts_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'social-posts'
    and exists (
      select 1 from public.social_posts sp
      where sp.storage_path = storage.objects.name
      and sp.club_id = public.current_club_id()
      and (
        (sp.status = 'approved' and public.is_my_branch(sp.branch))
        or sp.author_id = (select id from public.users where auth_user_id = auth.uid())
        or public.is_admin_tier()
        or (sp.status = 'pending' and public.is_branch_moderator(sp.branch))
      )
    )
  );

create policy "social_posts_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'social-posts'
    and exists (
      select 1 from public.social_posts sp
      where sp.storage_path = storage.objects.name
      and sp.club_id = public.current_club_id()
      and (
        sp.author_id = (select id from public.users where auth_user_id = auth.uid())
        or public.is_branch_moderator(sp.branch)
        or public.is_admin_tier()
      )
    )
  );

-- Her gün Türkiye saatiyle 10:55'te (UTC 07:55) — session-media (07:40) ve
-- announcements (07:50) temizlik görevlerinden sonraki boş pencere.
create or replace function public.trigger_social_posts_cleanup()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_project_url text := 'https://dfinjohgmtdawkgwnhfj.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaW5qb2hnbXRkYXdrZ3duaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMxODYsImV4cCI6MjEwMjYxOTE4Nn0.DphbUJBUFQv2KcOyPu4kWjVf0cRiAR2CI2MEWJ6n7nQ';
begin
  perform net.http_post(
    url := v_project_url || '/functions/v1/cleanup-old-social-posts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.trigger_social_posts_cleanup() from public;

select cron.schedule('cleanup-old-social-posts-daily', '55 7 * * *', $$select public.trigger_social_posts_cleanup();$$);

-- ---------------------------------------------------------------------
-- Eski "Antrenman Fotoğrafları" özelliğinin kaldırılması. Veri kaybı
-- riski yok — bu tablo zaten en fazla 14 günlük veri barındırıyordu ve
-- tamamen geçici (fotoğraflar) olarak tasarlanmıştı; yoklama/ödeme gibi
-- kalıcı/geçmişe dönük hiçbir kayıt buna dahil değildi. Storage bucket'ı
-- silinmeden ÖNCE bucket'taki tüm dosyalar service-role ile ayrı bir
-- adımda boşaltıldı (bucket satırını silmek dosyaları silmez).
select cron.unschedule('cleanup-old-session-media-daily');
drop function if exists public.trigger_session_media_cleanup();
drop policy if exists "training_session_media_select" on public.training_session_media;
drop policy if exists "training_session_media_write" on public.training_session_media;
drop policy if exists "training_session_media_update" on public.training_session_media;
drop policy if exists "training_session_media_delete" on public.training_session_media;
drop table if exists public.training_session_media;
drop policy if exists "session_media_insert" on storage.objects;
drop policy if exists "session_media_delete" on storage.objects;
-- Not: "delete from storage.buckets" Supabase tarafından doğrudan
-- engelleniyor (yalnızca Storage API üzerinden silinebiliyor) — bucket
-- satırı burada kasıtlı olarak bırakıldı. Politikaları kaldırıldığı için
-- artık kullanılamaz durumda (insert/select/delete yok); içindeki eski
-- dosyalar (en fazla 14 günlük, zaten geçiciydi) erişilemez halde kalır.
