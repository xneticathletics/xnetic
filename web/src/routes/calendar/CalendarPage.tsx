import { useEffect, useMemo, useState } from "react";
import { listSessions, completeSession, type TrainingSession } from "../../lib/api/trainingSessions";
import { listMatches, type MatchRow } from "../../lib/api/matches";
import { listGroups, type Group } from "../../lib/api/groups";
import { listVenues, type Venue } from "../../lib/api/venues";
import { buildMonthGrid, toDateKey, todayKey, MONTH_LABELS, WEEKDAY_LABELS } from "../../lib/date";
import SessionModal from "./SessionModal";
import MatchModal from "./MatchModal";
import AttendanceModal from "./AttendanceModal";

type DayItem = { kind: "session"; data: TrainingSession } | { kind: "match"; data: MatchRow };

export default function CalendarPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [groupFilter, setGroupFilter] = useState<string>("");

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionModal, setSessionModal] = useState<{ session: TrainingSession | null } | null>(null);
  const [matchModal, setMatchModal] = useState<{ match: MatchRow | null } | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<TrainingSession | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([listSessions(), listMatches(), listGroups(), listVenues()])
      .then(([s, m, g, v]) => {
        setSessions(s);
        setMatches(m);
        setGroups(g);
        setVenues(v);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredSessions = useMemo(
    () => (groupFilter ? sessions.filter((s) => s.group_id === groupFilter) : sessions),
    [sessions, groupFilter]
  );
  const filteredMatches = useMemo(
    () => (groupFilter ? matches.filter((m) => m.group_id === groupFilter) : matches),
    [matches, groupFilter]
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrainingSession[]> = {};
    for (const s of filteredSessions) (map[s.session_date] ??= []).push(s);
    return map;
  }, [filteredSessions]);

  const matchesByDate = useMemo(() => {
    const map: Record<string, MatchRow[]> = {};
    for (const m of filteredMatches) (map[m.match_date] ??= []).push(m);
    return map;
  }, [filteredMatches]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const dayItems = useMemo<DayItem[]>(() => {
    const items: DayItem[] = [
      ...(sessionsByDate[selectedDate] ?? []).map((s) => ({ kind: "session" as const, data: s })),
      ...(matchesByDate[selectedDate] ?? []).map((m) => ({ kind: "match" as const, data: m })),
    ];
    return items.sort((a, b) => a.data.start_time.localeCompare(b.data.start_time));
  }, [sessionsByDate, matchesByDate, selectedDate]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const handleComplete = async (id: string) => {
    try {
      await completeSession(id);
      load();
    } catch (e: any) {
      alert(e.message ?? "İşaretlenemedi");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Antrenman ve Müsabaka Takvimi</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSessionModal({ session: null })}
            className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg"
          >
            + Antrenman Ekle
          </button>
          <button
            onClick={() => setMatchModal({ match: null })}
            className="rounded-lg border border-coral px-4 py-2 text-sm font-bold text-coral"
          >
            🏆 Müsabaka Ekle
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      {groups.length > 1 && (
        <select
          className="mb-4 w-full max-w-xs rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">Tüm Gruplar</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Ay takvimi */}
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={goPrevMonth} className="px-2 text-lg font-bold text-yellow">
              ‹
            </button>
            <span className="text-sm font-bold">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </span>
            <button onClick={goNextMonth} className="px-2 text-lg font-bold text-yellow">
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-muted">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {grid.map((day, idx) => {
              if (day === null) return <div key={idx} />;
              const dateKey = toDateKey(viewYear, viewMonth, day);
              const hasSessions = !!sessionsByDate[dateKey]?.length;
              const hasMatches = !!matchesByDate[dateKey]?.length;
              const hasBoth = hasSessions && hasMatches;
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey();

              let circleClass = "text-muted";
              if (isSelected) circleClass = "bg-teal text-bg font-extrabold";
              else if (hasBoth) circleClass = "bg-violet text-bg font-extrabold";
              else if (hasSessions) circleClass = "bg-yellow text-bg font-extrabold";
              else if (hasMatches) circleClass = "bg-coral text-bg font-extrabold";

              return (
                <div key={idx} className="flex justify-center py-0.5">
                  <button
                    onClick={() => setSelectedDate(dateKey)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${circleClass} ${
                      isToday && !isSelected ? "ring-1 ring-muted" : ""
                    }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center gap-4 border-t border-line pt-3">
            <Legend color="bg-yellow" label="Antrenman" />
            <Legend color="bg-coral" label="Müsabaka" />
            <Legend color="bg-violet" label="İkisi de" />
          </div>
        </div>

        {/* Seçili gün listesi */}
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <span className="text-sm font-bold text-ink">{selectedDate}</span>
            <span className="text-xs text-muted">{dayItems.length > 0 ? `${dayItems.length} etkinlik` : "Etkinlik yok"}</span>
          </div>

          {loading && <p className="text-sm text-muted">Yükleniyor…</p>}
          {!loading && dayItems.length === 0 && (
            <p className="text-sm text-muted">Bu gün için antrenman ya da müsabaka planlanmamış.</p>
          )}

          <div className="space-y-3">
            {dayItems.map((item) => {
              if (item.kind === "match") {
                const m = item.data;
                return (
                  <div key={`match-${m.id}`} className="rounded-xl border border-coral bg-surface p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-bold text-ink">🏆 {m.groups?.name ?? "Grup atanmadı"}</span>
                      <span className="font-bold text-coral">{m.start_time.slice(0, 5)}</span>
                    </div>
                    <p className="text-sm text-muted">vs. {m.opponent_name}</p>
                    {!!m.location && <p className="text-sm text-muted">📍 {m.location}</p>}
                    <button
                      onClick={() => setMatchModal({ match: m })}
                      className="mt-2 text-xs font-bold text-teal hover:underline"
                    >
                      Düzenle
                    </button>
                  </div>
                );
              }

              const s = item.data;
              const isCompleted = s.status === "completed";
              return (
                <div key={`session-${s.id}`} className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold text-ink">{s.groups?.name ?? "Grup atanmadı"}</span>
                    <span className="font-bold text-teal">
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <p className="text-sm text-muted">🏟 {s.venues?.name ?? "Salon atanmadı"}</p>
                  {!!s.topic && <p className="text-sm text-muted">📝 {s.topic}</p>}
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isCompleted ? "bg-teal/20 text-teal" : "bg-yellow/20 text-yellow"
                    }`}
                  >
                    {isCompleted ? "✓ Tamamlandı" : "Planlandı"}
                  </span>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setAttendanceSession(s)}
                      className="rounded-md border border-teal px-3 py-1.5 text-xs font-bold text-teal"
                    >
                      Yoklama Al
                    </button>
                    <button
                      onClick={() => setSessionModal({ session: s })}
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-bold text-muted"
                    >
                      Düzenle
                    </button>
                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(s.id)}
                        className="rounded-md border border-line px-3 py-1.5 text-xs font-bold text-muted"
                      >
                        ✓ Tamamlandı İşaretle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {sessionModal && (
        <SessionModal
          session={sessionModal.session}
          defaultDate={selectedDate}
          groups={groups}
          venues={venues}
          onClose={() => setSessionModal(null)}
          onSaved={() => {
            setSessionModal(null);
            load();
          }}
        />
      )}

      {matchModal && (
        <MatchModal
          match={matchModal.match}
          defaultDate={selectedDate}
          groups={groups}
          onClose={() => setMatchModal(null)}
          onSaved={() => {
            setMatchModal(null);
            load();
          }}
        />
      )}

      {attendanceSession && (
        <AttendanceModal
          session={attendanceSession}
          groupName={attendanceSession.groups?.name ?? "Grup"}
          onClose={() => setAttendanceSession(null)}
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-[11px] font-semibold text-muted">{label}</span>
    </div>
  );
}
