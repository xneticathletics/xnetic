-- Egzersiz Geçmişi (AthleteFitnessViewScreen) sadece tarih gösteriyordu,
-- hangi Bireysel Program'a ait olduğu hiç belli olmuyordu — fitness_
-- measurements'ta program bilgisi hiç tutulmuyordu. Sporcu ekranındaki
-- "Bireysel Program" listesiyle "Egzersiz Geçmişi" tarihleri tesadüfen
-- eşleşiyor gibi görünüyordu ama gerçek bir bağlantı yoktu. Yeni kayıtlar
-- için gerçek bir bağlantı kuruyoruz (geçmiş kayıtlar için elbette geriye
-- dönük doldurulamaz, NULL kalır — o kayıtlar program adı olmadan gösterilir).
alter table public.fitness_measurements add column if not exists individual_program_id uuid
  references public.individual_fitness_programs(id) on delete set null;
