-- Kalan 32 bildirimde (aidat/etkinlik hatırlatmaları) sporcu adı/etkinlik
-- adı gibi DOĞRU (bozulmamış) dinamik metinler, bozuk şablon metniyle
-- iç içe geçmiş — bu yüzden bütün satıra WIN1252 ters-dönüşümü uygulamak
-- (extra_income'da olduğu gibi) dinamik kısmı bozardı. Bunun yerine, her
-- Türkçe özel karakterin bozulmuş hâlini (WIN1252 yanlış çözümlemesinin
-- sonucu) doğrusuyla değiştiren hedefli bir eşleme kullanılıyor — doğru
-- yazılmış dinamik metinlerde bu bozuk baytlar zaten hiç oluşmaz, o yüzden
-- güvenli.
do $$
declare
  v_chars text[] := array['ç','Ç','ğ','Ğ','ı','İ','ö','Ö','ş','Ş','ü','Ü','—','₺'];
  v_correct text;
  v_bad text;
begin
  foreach v_correct in array v_chars loop
    v_bad := convert_from(convert_to(v_correct, 'UTF8'), 'WIN1252');
    update notifications set title = replace(title, v_bad, v_correct) where title like '%' || v_bad || '%';
    update notifications set body = replace(body, v_bad, v_correct) where body like '%' || v_bad || '%';
  end loop;
end $$;
