-- Sporcu/antrenör kartlarındaki fotoğrafsız (geçici) avatar artık sadece
-- baş harf değil, cinsiyete göre bir simge de gösterebilsin diye —
-- shop_products.gender ile aynı sözleşme (erkek/kadin), "unisex" bir kişi
-- için anlamsız olduğundan sadece iki değer + NULL (belirtilmemiş — eski
-- kayıtların hepsi bu durumda başlar, avatar eskisi gibi baş harfe düşer).
-- Kolon seviyesinde bir kısıtlama eklenmiyor; hangi rolün bunu
-- düzenleyebileceği zaten var olan satır bazlı UPDATE RLS politikalarıyla
-- (athletes/users) aynı kalıyor.
alter table public.athletes
  add column if not exists gender text check (gender in ('erkek', 'kadin'));

alter table public.users
  add column if not exists gender text check (gender in ('erkek', 'kadin'));
