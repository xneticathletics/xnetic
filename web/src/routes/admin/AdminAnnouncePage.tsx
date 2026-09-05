import { useState } from "react";
import FormField, { inputClass } from "../../components/FormField";
import { notifyAllClubAdmins, uploadBroadcastAttachment } from "../../lib/api/superAdmin";
import { MAX_ATTACHMENT_SIZE_BYTES } from "../../lib/api/announcements";

// Mobildeki SuperAdminAnnounceScreen.tsx'in web karşılığı. Bilinçli olarak
// SADECE kulüp adminlerine gidiyor — Süper Admin'in hiçbir kulübün veli/
// sporcu/antrenör verisine erişimi olmaması gerektiği için (gizlilik),
// mesajlaşma/duyuru burada club_admin rolüyle sınırlı tutuluyor.
export default function AdminAnnouncePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handlePickAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setError(`Dosya en fazla ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB olabilir.`);
      e.target.value = "";
      return;
    }
    setAttachmentFile(file);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return setError("Başlık ve içerik alanlarını doldurmalısın.");
    setSending(true);
    setError(null);
    setSuccessCount(null);
    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile) attachmentUrl = await uploadBroadcastAttachment(attachmentFile);
      const count = await notifyAllClubAdmins(title.trim(), body.trim(), attachmentUrl);
      setSuccessCount(count);
      setTitle("");
      setBody("");
      setAttachmentFile(null);
    } catch (e: any) {
      setError(e.message ?? "Gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-xl font-bold text-ink">Duyurular</h1>
      <p className="mb-6 rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
        Bu duyuru SADECE kulüp adminlerine gider — Süper Admin olarak hiçbir kulübün veli, sporcu ya da antrenör
        verisine erişimin yok, bu yüzden gizlilik gereği yayın kapsamı kasıtlı olarak kulüp adminleriyle sınırlı.
      </p>

      <FormField label="Başlık *">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Yeni özellik: Fitness Grupları" />
      </FormField>
      <FormField label="İçerik *">
        <textarea
          className={`${inputClass} min-h-32`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Duyuru metnini yaz…"
        />
      </FormField>

      <FormField label={`Ek (isteğe bağlı, en fazla ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)} MB — fotoğraf, video, belge)`}>
        <input type="file" onChange={handlePickAttachment} className="text-xs text-muted" />
        {attachmentFile && <p className="mt-1 text-xs text-teal">📎 {attachmentFile.name}</p>}
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}
      {successCount !== null && (
        <p className="mb-3 text-sm font-semibold text-teal">Gönderildi — {successCount} kulüp adminine ulaştı.</p>
      )}

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {sending ? "Gönderiliyor…" : "Duyuruyu Gönder"}
      </button>
    </div>
  );
}
