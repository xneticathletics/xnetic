-- topUpAllActivePlans() (web + mobil src/lib/api/paymentPlans.ts) her
-- kulüp/finans sayfası açılışında TÜM aktif planları tek tek (N+1) tazeliyordu.
-- 201 planlı bir kulüpte bu onlarca saniye sürüyor, kullanıcı sabırsızlanıp
-- sayfayı yeniden yükleyince aynı anda iki "tazeleme" çalışıp aynı
-- plan_id+due_date için 2 payments satırı oluşturabiliyordu (check-then-insert
-- yarış durumu, hiçbir eşsizlik kısıtı yoktu). Bu kısıt, aynı yarış durumu
-- tekrar olsa bile artık veritabanı seviyesinde ikinci satırı engelliyor —
-- uygulama kodu ayrıca upsert(...,{onConflict, ignoreDuplicates:true}) kullanacak
-- şekilde güncellendi (bkz. paymentPlans.ts).
-- Kısıtı eklemeden önce, N+1 yarış durumunun zaten oluşturduğu mevcut
-- kopyaları temizle (aynı plan_id+due_date'ten en eskisini tut, gerisini sil).
delete from public.payments p
using (
  select id, row_number() over (partition by plan_id, due_date order by created_at) as rn
  from public.payments
  where plan_id is not null
) d
where p.id = d.id and d.rn > 1;

alter table public.payments
  add constraint payments_plan_id_due_date_key unique (plan_id, due_date);
