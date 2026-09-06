-- Önceki migration (20260906200000) "REVOKE ... FROM anon" yazmıştı ama
-- etkisiz kaldı: bu fonksiyonlar PostgreSQL'in varsayılanı gereği PUBLIC
-- sözde-rolüne (yani gerçekte HERKESE — anon dahil) EXECUTE ile
-- oluşturulmuştu (proacl'de "=X" girdisi). Belirli bir rolden (anon) REVOKE
-- etmek, o rol PUBLIC üzerinden yetkiyi almaya devam ettiği için hiçbir şey
-- değiştirmiyor — canlıda doğrulandı: revoke sonrası anon (giriş yapmamış)
-- hâlâ is_athletes_coach ve create_shop_order'ı çağırabiliyordu.
--
-- Doğrusu: PUBLIC'ten REVOKE etmek. Bu fonksiyonların hepsinde (create_shop_order
-- hariç) zaten PUBLIC'ten AYRI, doğrudan "authenticated"a verilmiş bir GRANT
-- da var — yani PUBLIC'i kaldırmak "authenticated" için hiçbir şeyi bozmuyor,
-- sadece anon'un PUBLIC üzerinden aldığı örtük erişimi kapatıyor.

revoke execute on function public.can_message_recipient(uuid) from public;
revoke execute on function public.is_athlete_self_update_safe(uuid, uuid, athlete_status, athlete_type, uuid, uuid, uuid) from public;
revoke execute on function public.is_athletes_coach(uuid) from public;
revoke execute on function public.is_branch_coordinator() from public;
revoke execute on function public.is_coach_of_my_athlete(uuid) from public;
revoke execute on function public.is_current_user_row(uuid) from public;
revoke execute on function public.is_my_athlete(uuid) from public;
revoke execute on function public.is_my_coached_group(uuid) from public;
revoke execute on function public.is_parent_of_my_coached_athlete(uuid) from public;
revoke execute on function public.is_self_update_safe(uuid, user_role, uuid, boolean) from public;
revoke execute on function public.register_push_token(text) from public;
revoke execute on function public.update_shop_order_status(uuid, text) from public;
revoke execute on function public.create_shop_order(uuid, uuid, integer, text, text) from public;
