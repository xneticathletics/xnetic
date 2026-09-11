-- 20260906200000_revoke_anon_helper_function_execute.sql ve 20260906201000_revoke_public_execute_fix.sql,
-- "create_shop_order hiç .rpc() ile çağrılmıyor" varsayımıyla bu fonksiyonun EXECUTE hakkını
-- authenticated'dan da geri aldı. Oysa src/lib/api/shop.ts ve web/src/lib/api/shop.ts'deki
-- createOrder() zaten bu tarihten önce de sonra da bu RPC'yi çağırıyordu — yani o tarihten beri
-- her "Siparişi Onayla" denemesi Postgres'in "permission denied for function" hatasıyla
-- sessizce başarısız oluyordu. Fonksiyonun kendisi zaten SECURITY DEFINER + rol/stok/fiyat
-- kontrollerini sunucu tarafında yapıyor (bkz. tanımı), authenticated'a execute vermek güvenli.
grant execute on function public.create_shop_order(uuid, uuid, integer, text, text) to authenticated;
