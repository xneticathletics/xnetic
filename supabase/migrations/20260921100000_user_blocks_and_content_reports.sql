-- Apple 1.2 (kullanıcı içeriği): kullanıcı engelleme + içerik şikayeti.
-- Tüm yazmalar SECURITY DEFINER RPC'lerden geçer; tablolara doğrudan yazma yok.

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);
alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own" on public.user_blocks
  for select to authenticated
  using (public.is_current_user_row(blocker_id));

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  content_type text not null check (content_type in ('message', 'social_post', 'user')),
  content_id uuid,
  content_snapshot text,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id) on delete set null
);
create index if not exists content_reports_club_status_idx on public.content_reports (club_id, status, created_at desc);
alter table public.content_reports enable row level security;

-- Yönetici/koordinatör kulübün şikayetlerini görür; şikayet eden kendi şikayetini görür.
drop policy if exists "content_reports_select" on public.content_reports;
create policy "content_reports_select" on public.content_reports
  for select to authenticated
  using (
    club_id = public.current_club_id()
    and (public.is_admin_tier() or public.is_branch_coordinator() or public.is_current_user_row(reporter_id))
  );

-- İki yönlü engel kontrolü: RLS'te başkasının satırını ham subquery ile
-- okumak sessizce başarısız olur (bkz. visibility-dependent policy bug), bu
-- yüzden SECURITY DEFINER yardımcı.
create or replace function public.is_blocked_either_way(p_other uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = public.my_user_id() and b.blocked_id = p_other)
       or (b.blocker_id = p_other and b.blocked_id = public.my_user_id())
  );
$$;
revoke all on function public.is_blocked_either_way(uuid) from public, anon;
grant execute on function public.is_blocked_either_way(uuid) to authenticated;

-- Engelli kişiye/engelleyene mesaj gönderilemesin.
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
  for insert to authenticated
  with check (
    is_super_admin()
    or (
      club_id = current_club_id()
      and public.is_current_user_row(sender_id)
      and can_message_recipient(receiver_id)
      and not public.is_blocked_either_way(receiver_id)
    )
  );

create or replace function public.block_user(p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.my_user_id();
  my_club uuid := public.current_club_id();
begin
  if me is null or my_club is null then raise exception 'not allowed'; end if;
  if p_user = me then raise exception 'cannot block self'; end if;
  if not exists (select 1 from public.users u where u.id = p_user and u.club_id = my_club) then
    raise exception 'user not found';
  end if;
  insert into public.user_blocks (blocker_id, blocked_id, club_id)
  values (me, p_user, my_club)
  on conflict do nothing;
end;
$$;

create or replace function public.unblock_user(p_user uuid)
returns void
language sql security definer set search_path = public
as $$
  delete from public.user_blocks where blocker_id = public.my_user_id() and blocked_id = p_user;
$$;

create or replace function public.list_my_blocked_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select blocked_id from public.user_blocks where blocker_id = public.my_user_id();
$$;

-- Beni engelleyenlerin id'leri (onların gönderilerini/mesajlarını da gizlemek için).
create or replace function public.list_blocked_me_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select blocker_id from public.user_blocks where blocked_id = public.my_user_id();
$$;

create or replace function public.submit_content_report(
  p_type text, p_content_id uuid, p_reported_user uuid, p_reason text, p_details text, p_snapshot text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.my_user_id();
  my_club uuid := public.current_club_id();
  rid uuid;
begin
  if me is null or my_club is null then raise exception 'not allowed'; end if;
  if p_reported_user = me then raise exception 'cannot report self'; end if;
  if not exists (select 1 from public.users u where u.id = p_reported_user and u.club_id = my_club) then
    raise exception 'user not found';
  end if;
  insert into public.content_reports (club_id, reporter_id, reported_user_id, content_type, content_id, content_snapshot, reason, details)
  values (my_club, me, p_reported_user, p_type, p_content_id, left(p_snapshot, 500), p_reason, left(p_details, 500))
  returning id into rid;
  return rid;
end;
$$;

create or replace function public.resolve_content_report(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not (public.is_admin_tier() or public.is_branch_coordinator()) then raise exception 'not allowed'; end if;
  update public.content_reports
    set status = 'resolved', resolved_at = now(), resolved_by = public.my_user_id()
    where id = p_id and club_id = public.current_club_id();
end;
$$;

-- Şikayeti alacak yöneticiler (kulüp yöneticileri) — istemci bildirim göndermek için.
create or replace function public.list_report_recipients()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select u.id from public.users u
  where u.club_id = public.current_club_id() and u.role = 'club_admin' and u.is_active
    and u.id <> public.my_user_id();
$$;

revoke all on function public.block_user(uuid), public.unblock_user(uuid), public.list_my_blocked_ids(),
  public.list_blocked_me_ids(), public.submit_content_report(text, uuid, uuid, text, text, text),
  public.resolve_content_report(uuid), public.list_report_recipients() from public, anon;
grant execute on function public.block_user(uuid), public.unblock_user(uuid), public.list_my_blocked_ids(),
  public.list_blocked_me_ids(), public.submit_content_report(text, uuid, uuid, text, text, text),
  public.resolve_content_report(uuid), public.list_report_recipients() to authenticated;
