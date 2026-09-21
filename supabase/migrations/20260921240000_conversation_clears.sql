-- "Sohbeti Sil" — sohbeti YALNIZCA silen kişinin tarafından temizler.
--
-- Neden karşılıklı silme YOK: messages tablosunda bilerek hiç DELETE
-- politikası yok. Gerçek silme olsaydı, taciz eden biri sohbeti silerek
-- kanıtı kurbanın telefonundan da yok edebilirdi (şikayet akışı da
-- mesajın gerçekten var olmasına dayanıyor — bkz. submit_content_report).
-- Bu yüzden silen kişi için bir "temizleme zamanı" tutuluyor; o andan
-- ÖNCEKİ mesajlar artık o kişiye gösterilmiyor, karşı tarafta hiçbir şey
-- değişmiyor. Sonradan gelen yeni mesajlar normal şekilde görünür.

create table if not exists public.conversation_clears (
  user_id uuid not null references public.users(id) on delete cascade,
  other_user_id uuid not null references public.users(id) on delete cascade,
  cleared_at timestamptz not null default now(),
  primary key (user_id, other_user_id)
);
alter table public.conversation_clears enable row level security;

drop policy if exists "conversation_clears_select_own" on public.conversation_clears;
create policy "conversation_clears_select_own" on public.conversation_clears
  for select to authenticated
  using (public.is_current_user_row(user_id));
-- Yazma politikası bilerek YOK: sadece aşağıdaki RPC üzerinden.

create or replace function public.clear_conversation(p_other uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.my_user_id();
begin
  if me is null then raise exception 'not allowed'; end if;
  if p_other = me then raise exception 'invalid target'; end if;

  insert into public.conversation_clears (user_id, other_user_id, cleared_at)
  values (me, p_other, now())
  on conflict (user_id, other_user_id) do update set cleared_at = now();

  -- Okunmamış mesajlar da temizlendiği için alt menüdeki rozet sayısı
  -- takılı kalmasın: bu sohbetteki okunmamışları okundu say.
  update public.messages
     set read_at = now()
   where receiver_id = me and sender_id = p_other and read_at is null;
end;
$$;

create or replace function public.list_my_conversation_clears()
returns table (other_user_id uuid, cleared_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select c.other_user_id, c.cleared_at
  from public.conversation_clears c
  where c.user_id = public.my_user_id();
$$;

revoke all on function public.clear_conversation(uuid), public.list_my_conversation_clears() from public, anon;
grant execute on function public.clear_conversation(uuid), public.list_my_conversation_clears() to authenticated;

-- now() işlem BAŞLANGICINI döndürür; aynı işlem içinde hemen sonra eklenen
-- bir mesaj cleared_at ile birebir aynı damgayı alıp "sent_at > cleared_at"
-- filtresine takılabiliyor. clock_timestamp() gerçek anı verdiği için
-- sınırı kesinleştiriyor.
create or replace function public.clear_conversation(p_other uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.my_user_id();
begin
  if me is null then raise exception 'not allowed'; end if;
  if p_other = me then raise exception 'invalid target'; end if;

  insert into public.conversation_clears (user_id, other_user_id, cleared_at)
  values (me, p_other, clock_timestamp())
  on conflict (user_id, other_user_id) do update set cleared_at = clock_timestamp();

  update public.messages
     set read_at = clock_timestamp()
   where receiver_id = me and sender_id = p_other and read_at is null;
end;
$$;
