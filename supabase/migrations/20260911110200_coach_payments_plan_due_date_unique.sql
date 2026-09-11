-- Tam uygulama taramasında bulunan: topUpAllActiveCoachPlans() (mobil +
-- web src/lib/api/coachPaymentPlans.ts) her Antrenör Ödemeleri ekranı
-- açılışında TÜM aktif planları tek tek (N+1) tazeliyordu — payments
-- tablosunda 20260906020000 ile düzeltilen AYNI hata sınıfı, coach_payments
-- tarafında hiç düzeltilmemişti. Kısıtı eklemeden önce, olası N+1 yarış
-- durumunun zaten oluşturduğu kopyaları temizle (aynı plan_id+due_date'ten
-- en eskisini tut, gerisini sil).
-- Bir kopya çiftinden biri zaten "paid" ise onu koru (ödeme geçmişi
-- kaybolmasın) — aksi halde en eskisini koru.
delete from public.coach_payments p
using (
  select id, row_number() over (
    partition by plan_id, due_date
    order by (status = 'paid') desc, created_at
  ) as rn
  from public.coach_payments
  where plan_id is not null
) d
where p.id = d.id and d.rn > 1;

alter table public.coach_payments
  add constraint coach_payments_plan_id_due_date_key unique (plan_id, due_date);
