import { useEffect, useState } from "react";
import { listAnnouncements, getAnnouncementReaders, type Announcement, type AnnouncementReader } from "../../lib/api/announcements";
import AnnouncementModal from "./AnnouncementModal";

const TARGET_LABEL: Record<string, string> = {
  club: "Tüm Kulüp",
  group: "Grup",
  athletes: "Sporcular",
  parents: "Veliler",
  coaches: "Antrenörler",
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function AnnouncementAttachment({ url }: { url: string }) {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return <img src={url} alt="Ek" className="mb-2 max-h-48 rounded-lg border border-line object-cover" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mb-2 inline-block text-xs font-bold text-teal hover:underline">
      📎 Ek Dosyayı Aç
    </a>
  );
}

export default function AnnouncementsListPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [readersFor, setReadersFor] = useState<string | null>(null);
  const [readers, setReaders] = useState<AnnouncementReader[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);

  const load = () => {
    setLoading(true);
    listAnnouncements()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleReaders = async (id: string) => {
    if (readersFor === id) {
      setReadersFor(null);
      return;
    }
    setReadersFor(id);
    setReadersLoading(true);
    try {
      setReaders(await getAnnouncementReaders(id));
    } catch {
      setReaders([]);
    } finally {
      setReadersLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Duyurular</h1>
        <button onClick={() => setModalOpen(true)} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Duyuru Yap
        </button>
      </div>

      {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}
      {!loading && items.length === 0 && <p className="text-sm text-muted">Henüz duyuru yok.</p>}

      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-teal">{a.target_types.map((t) => TARGET_LABEL[t] ?? t).join(", ")}</span>
              <span className="text-xs text-muted">{new Date(a.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
            <p className="mb-1 text-lg font-bold text-yellow">{a.title}</p>
            <p className="mb-2 text-sm text-muted">{a.body}</p>
            {a.attachment_url && <AnnouncementAttachment url={a.attachment_url} />}
            <button onClick={() => toggleReaders(a.id)} className="text-xs font-bold text-teal hover:underline">
              {readersFor === a.id ? "Gizle" : "Kimler Okudu?"}
            </button>

            {readersFor === a.id && (
              <div className="mt-3 rounded-lg border border-line bg-bg p-3">
                {readersLoading && <p className="text-xs text-muted">Yükleniyor…</p>}
                {!readersLoading && readers.length === 0 && <p className="text-xs text-muted">Henüz kimse okumamış.</p>}
                {!readersLoading && readers.length > 0 && (
                  <ul className="space-y-1">
                    {readers.map((r) => (
                      <li key={r.user_id} className="flex justify-between text-xs">
                        <span className="text-ink">{r.name}</span>
                        <span className="text-muted">{new Date(r.read_at).toLocaleString("tr-TR")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <AnnouncementModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
