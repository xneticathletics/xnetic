-- Web panelinden yüklenen logolar logo_updated_at'i güncellemediği için bazı
-- kulüplerde bu alan NULL kaldı — mobil uygulama bu durumda logoyu sürümsüz
-- sabit URL ile gösterip eski önbelleği kullanıyordu. Bir kereliğine
-- dolduruluyor ki mobil, bir sonraki açılışta logoyu taze indirsin.
update public.clubs set logo_updated_at = now() where logo_updated_at is null;
