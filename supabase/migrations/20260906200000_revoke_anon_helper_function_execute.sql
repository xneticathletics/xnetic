-- Güvenlik denetiminde Supabase Advisor'ın işaretlediği bir madde: birkaç
-- SECURITY DEFINER yardımcı fonksiyon hem "anon" hem "authenticated" rolü
-- tarafından doğrudan /rest/v1/rpc/<fn> üzerinden çağrılabiliyordu.
--
-- ÖNEMLİ KISIT: bu fonksiyonların çoğu (is_athletes_coach, is_my_athlete,
-- is_my_coached_group, is_branch_coordinator, is_self_update_safe,
-- is_athlete_self_update_safe, is_coach_of_my_athlete,
-- is_parent_of_my_coached_athlete, is_current_user_row,
-- can_message_recipient) RLS politikalarının İÇİNDE kullanılıyor.
-- PostgreSQL'de bir politika ifadesinin içinde çağrılan bir fonksiyon,
-- sorguyu çalıştıran rolün o fonksiyon üzerinde EXECUTE yetkisi olmasını
-- ZORUNLU KILAR — "authenticated" rolünden EXECUTE'u geri almak, bu
-- fonksiyonları kullanan HER RLS politikasını "permission denied for
-- function" hatasıyla bozar, yani gerçek kulüplerdeki gerçek kullanıcılar
-- için uygulamayı tamamen çalışmaz hale getirir. Bu yüzden SADECE "anon"
-- (oturum açmamış) rolünden EXECUTE geri alınıyor — hiçbir zaman oturumsuz
-- çağrılmaları gerekmiyor, "authenticated" ise dokunulmadan kalıyor.
--
-- register_push_token ve update_shop_order_status uygulama kodunda
-- doğrudan .rpc() ile çağrılıyor (bkz. src/lib/push.ts,
-- web/src/lib/api/shop.ts) — authenticated'dan alınmıyor, sadece anon'dan.
--
-- create_shop_order ise ne mobilde ne webde .rpc() ile hiç çağrılmıyor
-- (sipariş akışı doğrudan shop_orders tablosuna insert ediyor) — şu an
-- kullanılmayan bir fonksiyon, bu yüzden hem anon hem authenticated'dan
-- tamamen kaldırılabiliyor; ileride gerekirse yeniden GRANT edilir.

revoke execute on function public.can_message_recipient(uuid) from anon;
revoke execute on function public.is_athlete_self_update_safe(uuid, uuid, athlete_status, athlete_type, uuid, uuid, uuid) from anon;
revoke execute on function public.is_athletes_coach(uuid) from anon;
revoke execute on function public.is_branch_coordinator() from anon;
revoke execute on function public.is_coach_of_my_athlete(uuid) from anon;
revoke execute on function public.is_current_user_row(uuid) from anon;
revoke execute on function public.is_my_athlete(uuid) from anon;
revoke execute on function public.is_my_coached_group(uuid) from anon;
revoke execute on function public.is_parent_of_my_coached_athlete(uuid) from anon;
revoke execute on function public.is_self_update_safe(uuid, user_role, uuid, boolean) from anon;
revoke execute on function public.register_push_token(text) from anon;
revoke execute on function public.update_shop_order_status(uuid, text) from anon;

revoke execute on function public.create_shop_order(uuid, uuid, integer, text, text) from anon, authenticated;
