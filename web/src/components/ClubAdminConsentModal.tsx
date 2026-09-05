import Modal from "./Modal";
import { CLUB_ADMIN_CONSENT_SECTIONS } from "../lib/consentTexts";

// Kulüp Oluştur formundaki onay kutusunun yanındaki "Metni Görüntüle"
// linkinden açılır — dört bölümün tamamını (KVKK, sağlık verisi erişim
// taahhüdü, foto/video izni, görev beyanı) tek seferde, kaydırılabilir
// şekilde gösterir.
export default function ClubAdminConsentModal({ clubName, onClose }: { clubName: string; onClose: () => void }) {
  return (
    <Modal title="KVKK Aydınlatma Metni ve Kullanım Şartları" onClose={onClose}>
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {CLUB_ADMIN_CONSENT_SECTIONS.map((section, i) => (
          <div key={section.title} className={i > 0 ? "mt-5 border-t border-line pt-4" : ""}>
            <h3 className="mb-2 text-sm font-bold text-ink">{section.title}</h3>
            <p className="whitespace-pre-line text-xs leading-relaxed text-muted">{section.body(clubName || "Kulübünüz")}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg"
      >
        Kapat
      </button>
    </Modal>
  );
}
