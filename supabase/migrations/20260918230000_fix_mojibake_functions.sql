-- Kök neden: Tokyo->Frankfurt Supabase proje geçişinde (bkz. proje notu
-- "Supabase region migration") fonksiyon gövdelerindeki Türkçe metinler
-- UTF8 baytları WIN1252 olarak yanlış çözümlenip tekrar UTF8'e kodlanarak
-- (çift kodlama / mojibake) bozulmuş — "GeÃ§ersiz" gibi. Bu SADECE canlı
-- veritabanındaki fonksiyon gövdelerini etkiliyor, buradaki migration
-- dosyaları hep doğruydu (git revert/push bunu değiştirmiyor).
--
-- Düzeltme: WIN1252 kodlaması tersine çevrilebilir bir dönüşüm olduğu için
-- (convert_to(metin,'WIN1252') -> convert_from(...,'UTF8')) her fonksiyonun
-- gövdesi otomatik olarak düzeltiliyor. send_birthday_notifications hariç
-- (o ayrı bir migration'da elle düzeltildi — emoji içerdiği için bu genel
-- dönüşüm onda başarısız oluyordu, önceden test edildi).
do $$
declare
  v_rec record;
  v_def text;
  v_fixed text;
  v_failed text := '';
begin
  for v_rec in
    select p.proname, p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
    where n.nspname = 'public'
      and p.prokind = 'f'
      and l.lanname in ('sql', 'plpgsql')
      and p.proname <> 'send_birthday_notifications'
      and pg_get_functiondef(p.oid) ~ 'Ã.|Å.|â€'
  loop
    v_def := pg_get_functiondef(v_rec.oid);
    begin
      v_fixed := convert_from(convert_to(v_def, 'WIN1252'), 'UTF8');
      if v_fixed ~ 'Ã.|Å.|â€' then
        v_failed := v_failed || v_rec.proname || '(kaldı); ';
      else
        execute v_fixed;
      end if;
    exception when others then
      v_failed := v_failed || v_rec.proname || '(hata:' || sqlerrm || '); ';
    end;
  end loop;

  if v_failed <> '' then
    raise exception 'Bazı fonksiyonlar düzeltilemedi: %', v_failed;
  end if;
end $$;

-- extra_income'daki bozuk açıklamaları düzelt (ör. "Mağaza siparişi" satırları).
-- Satır satır + exception yakalama: bazı satırlar WIN1252'ye sığmayan
-- karakter (emoji vb.) içerebilir, tek bir satırın hata vermesi diğerlerini
-- engellemesin diye.
do $$
declare
  v_row record;
  v_fixed text;
begin
  for v_row in select id, description from extra_income where description ~ 'Ã.|Å.|â€' loop
    begin
      v_fixed := convert_from(convert_to(v_row.description, 'WIN1252'), 'UTF8');
      if v_fixed !~ 'Ã.|Å.|â€' then
        update extra_income set description = v_fixed where id = v_row.id;
      end if;
    exception when others then
      null; -- düzeltilemeyen satır olduğu gibi kalır
    end;
  end loop;
end $$;

-- notifications'daki bozuk başlık/gövdeleri düzelt — emoji içeren (birthday
-- şablonundan gelen, WIN1252'ye tam sığmayan) satırlar atlanıyor, o
-- kayıtlar send_birthday_notifications'ın elle düzeltilmiş hâlinden sonraki
-- yeni gönderimlerde zaten doğru olacak.
do $$
declare
  v_row record;
  v_title_fixed text;
  v_body_fixed text;
begin
  for v_row in select id, title, body from notifications where title ~ 'Ã.|Å.|â€' or body ~ 'Ã.|Å.|â€' loop
    begin
      v_title_fixed := v_row.title;
      v_body_fixed := v_row.body;
      if v_row.title ~ 'Ã.|Å.|â€' then
        v_title_fixed := convert_from(convert_to(v_row.title, 'WIN1252'), 'UTF8');
      end if;
      if v_row.body ~ 'Ã.|Å.|â€' then
        v_body_fixed := convert_from(convert_to(v_row.body, 'WIN1252'), 'UTF8');
      end if;
      if v_title_fixed !~ 'Ã.|Å.|â€' and v_body_fixed !~ 'Ã.|Å.|â€' then
        update notifications set title = v_title_fixed, body = v_body_fixed where id = v_row.id;
      end if;
    exception when others then
      null; -- düzeltilemeyen satır (ör. emoji içeren eski doğum günü bildirimi) olduğu gibi kalır
    end;
  end loop;
end $$;
