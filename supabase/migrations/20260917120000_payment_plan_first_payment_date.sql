-- Aidat planı oluşturma akışı "ayın kaçında" (day_of_month) serbest metin
-- alanından, kullanıcının gün/ay/yıl seçerek gireceği TAM bir ilk ödeme
-- tarihine geçiyor (bkz. src/components/DateField.tsx, PaymentFormScreen,
-- AthleteFormScreen) — hangi AYDA başlayacağı artık bir tahminle değil
-- (day_of_month'un bugünün gününü geçip geçmediğine bakarak) doğrudan bu
-- seçimden belli oluyor. day_of_month sütunu KALDIRILMADI — sonraki aylar
-- için hâlâ "ayın kaçı" bilgisi olarak kullanılıyor (bkz. computeDueDate),
-- sadece başlangıç ayını artık first_payment_date belirliyor.
alter table public.payment_plans add column if not exists first_payment_date date;

-- Var olan planlar için: created_at'in ayı + mevcut day_of_month'tan geriye
-- dönük bir first_payment_date üretiyoruz (o ayın son gününe göre kırpılmış) —
-- böylece eski planlar da yeni anchor mantığıyla eskisiyle AYNI ayda
-- başlamaya devam eder, davranış geriye dönük bozulmaz.
update public.payment_plans pp
set first_payment_date = (
  date_trunc('month', pp.created_at)::date
  + (least(
       pp.day_of_month,
       extract(day from (date_trunc('month', pp.created_at) + interval '1 month' - interval '1 day'))::int
     ) - 1)
)
where pp.first_payment_date is null;
