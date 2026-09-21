-- PERFORMANS: engellenen kişiler tek çağrıda dönsün.
-- listHiddenUserIds() istemcide iki ayrı RPC çağırıyordu
-- (list_my_blocked_ids + list_blocked_me_ids). Mesaj listesi, kişi listesi
-- ve sosyal akışın her açılışında iki ağ gidiş-dönüşü demekti; Frankfurt'a
-- mobil bağlantıda her biri ~100ms. Tek fonksiyonda birleştirildi.
create or replace function public.list_hidden_user_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select blocked_id from public.user_blocks where blocker_id = public.my_user_id()
  union
  select blocker_id from public.user_blocks where blocked_id = public.my_user_id();
$$;
revoke all on function public.list_hidden_user_ids() from public, anon;
grant execute on function public.list_hidden_user_ids() to authenticated;
