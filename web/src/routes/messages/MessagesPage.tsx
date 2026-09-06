import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listConversations, listMyContacts, listMessagesWithUser, sendMessage, markMessagesRead,
  type Conversation, type Contact, type Message,
} from "../../lib/api/messages";

type RoleFilter = "all" | "coach" | "athlete" | "parent" | "club_admin" | "super_admin";

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "coach", label: "Antrenörler" },
  { key: "athlete", label: "Sporcular" },
  { key: "parent", label: "Veliler" },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday ? d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("tr-TR");
}

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (photoUrl) return <img src={photoUrl} alt="" style={style} className="rounded-full object-cover" />;
  return (
    <div style={style} className="flex items-center justify-center rounded-full bg-line font-bold text-ink">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function MessagesPage() {
  const { role } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [composing, setComposing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [contactQuery, setContactQuery] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    setLoadingList(true);
    listConversations()
      .then(setConversations)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingList(false));
  };

  useEffect(loadConversations, []);

  useEffect(() => {
    if (composing && role) {
      setLoadingContacts(true);
      listMyContacts(role)
        .then(setContacts)
        .catch((e) => setError(e.message))
        .finally(() => setLoadingContacts(false));
    }
  }, [composing, role]);

  const openChat = (contact: Contact) => {
    setSelected(contact);
    setComposing(false);
    setLoadingChat(true);
    listMessagesWithUser(contact.id)
      .then(async (msgs) => {
        setMessages(msgs);
        await markMessagesRead(contact.id);
        loadConversations();
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingChat(false));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !selected) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage(selected.id, body);
      setMessages(await listMessagesWithUser(selected.id));
      loadConversations();
    } catch (e: any) {
      setError(e.message ?? "Gönderilemedi");
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts
    .filter((c) => roleFilter === "all" || c.role === roleFilter)
    .filter((c) => c.name.toLowerCase().includes(contactQuery.trim().toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 lg:h-[calc(100vh-6rem)]">
      <div className="flex w-full max-w-xs flex-col rounded-xl border border-line bg-surface lg:max-w-sm">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h1 className="text-lg font-bold text-ink">Mesajlar</h1>
          <button
            onClick={() => setComposing((v) => !v)}
            className="rounded-lg bg-yellow px-3 py-1.5 text-xs font-bold text-bg"
          >
            {composing ? "Vazgeç" : "+ Yeni Mesaj"}
          </button>
        </div>

        {error && <p className="p-3 text-xs font-semibold text-coral">{error}</p>}

        {composing ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-wrap gap-1.5 p-3 pb-2">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRoleFilter(f.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    roleFilter === f.key ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Kişi ara..."
              className="mx-3 mb-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-yellow"
            />
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {loadingContacts ? (
                <p className="mt-6 text-center text-sm text-muted">Yükleniyor…</p>
              ) : filteredContacts.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted">
                  {contactQuery ? "Eşleşen kişi bulunamadı." : "Mesajlaşabileceğin kimse yok."}
                </p>
              ) : (
                filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openChat(c)}
                    className="mb-2 flex w-full items-center gap-3 rounded-lg border border-line bg-bg p-3 text-left hover:border-yellow"
                  >
                    <Avatar name={c.name} photoUrl={c.photo_url} />
                    <span className="text-sm font-semibold text-ink">{c.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3">
            {loadingList ? (
              <p className="mt-6 text-center text-sm text-muted">Yükleniyor…</p>
            ) : conversations.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted">Henüz mesajın yok. "+ Yeni Mesaj" ile başla.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.contact.id}
                  onClick={() => openChat(c.contact)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left ${
                    selected?.id === c.contact.id ? "border-yellow bg-bg" : "border-line bg-bg hover:border-yellow/50"
                  }`}
                >
                  <Avatar name={c.contact.name} photoUrl={c.contact.photo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{c.contact.name}</p>
                    <p className={`truncate text-xs ${c.unreadCount > 0 ? "font-semibold text-ink" : "text-muted"}`}>
                      {c.lastMessage.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted">{formatTime(c.lastMessage.sent_at)}</span>
                    {c.unreadCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow px-1 text-[10px] font-extrabold text-bg">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col rounded-xl border border-line bg-surface">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted">Bir konuşma seç ya da yeni mesaj başlat.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-line p-4">
              <Avatar name={selected.name} photoUrl={selected.photo_url} size={36} />
              <h2 className="text-sm font-bold text-ink">{selected.name}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingChat ? (
                <p className="text-center text-sm text-muted">Yükleniyor…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted">Henüz mesaj yok — ilk mesajı sen gönder.</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id !== selected.id;
                  return (
                    <div key={m.id} className={`mb-2 flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-xl px-3 py-2 ${
                          isMine ? "rounded-br-sm bg-yellow text-bg" : "rounded-bl-sm border border-line bg-bg text-ink"
                        }`}
                      >
                        <p className="text-sm">{m.body}</p>
                        <p className={`mt-1 text-right text-[10px] ${isMine ? "text-bg/70" : "text-muted"}`}>
                          {formatTime(m.sent_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-end gap-2 border-t border-line p-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Mesaj yaz..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-yellow"
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
              >
                Gönder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
