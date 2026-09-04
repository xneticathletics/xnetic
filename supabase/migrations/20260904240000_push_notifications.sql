-- Push bildirimleri: her cihazın Expo push token'ını saklayan tablo +
-- kullanıcının kendi token'ını güvenle kaydedebilmesi için SECURITY DEFINER
-- bir RPC (aynı cihazda farklı hesaplarla art arda giriş yapıldığında token
-- bir önceki kullanıcıdan yenisine güvenle "el değiştirebilsin" diye).

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expo_push_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_select on public.push_tokens;
create policy push_tokens_select on public.push_tokens for select
  using (user_id = (select id from public.users where auth_user_id = auth.uid()));

drop policy if exists push_tokens_delete on public.push_tokens;
create policy push_tokens_delete on public.push_tokens for delete
  using (user_id = (select id from public.users where auth_user_id = auth.uid()));

-- Doğrudan insert/update politikası yok: yazma yalnızca aşağıdaki RPC
-- üzerinden yapılır, RLS'i kasıtlı olarak bypass eder (SECURITY DEFINER).
create or replace function public.register_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from public.users where auth_user_id = auth.uid();
  if v_user_id is null then
    raise exception 'Kullanıcı bulunamadı.';
  end if;

  insert into public.push_tokens (user_id, expo_push_token)
  values (v_user_id, p_token)
  on conflict (expo_push_token) do update set user_id = excluded.user_id;
end;
$$;

grant execute on function public.register_push_token(text) to authenticated;
