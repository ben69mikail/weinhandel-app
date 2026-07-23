import { useState } from "react";
import { useShifts, useUsers, useCreateShift, useUpdateShift, useDeleteShift, useAssignShift, useUpdateAssignmentStatus, useAllAvailability, Shift } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Eye, Users } from "lucide-react";

// --- helpers ---
function getWeekDates(year: number, week: number): Date[] {
  const jan4 = new Date(year, 0, 4);
  const start = new Date(jan4.getTime() - ((jan4.getDay() || 7) - 1) * 86400000 + (week - 1) * 7 * 86400000);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 86400000));
}
function getWeek(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}
// timezone-safe: compare local date parts as string
function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function isSameDay(a: Date, b: Date) {
  return toLocalDateStr(a) === toLocalDateStr(b);
}
// parse ISO date string to local Date (robust against UTC midnight → prev day in UTC+ zones)
function parseAvailDate(dateStr: string): Date {
  // "2026-06-26T00:00:00.000Z" → take date part only → local Date
  const s = dateStr.slice(0, 10); // "2026-06-26"
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight, no timezone shift
}
const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
// Klartext für Konflikt-Codes aus dem Backend (detectAssignConflicts).
const CONFLICT_LABELS: Record<string, string> = {
  NO_AVAILABILITY: "Dieser Mitarbeiter hat für diesen Tag keine Verfügbarkeit angegeben.",
  UNAVAILABLE: "Dieser Mitarbeiter hat sich für diesen Tag als NICHT verfügbar markiert.",
  OUTSIDE_TIMES: "Die Schichtzeiten liegen außerhalb der angegebenen Verfügbarkeit.",
  DOUBLE_BOOKING: "Achtung: Dieser Mitarbeiter ist an diesem Tag bereits für eine andere Schicht eingeteilt!",
};
const TYPE_LABELS: Record<string, string> = { REGULAR: "Regulär", EVENT: "Event", TASTING: "Verkostung", CONCERT: "Konzert", HOLIDAY_COVERAGE: "Notfall" };
const emptyShift = { title: "", date: "", startTime: "09:00", endTime: "17:00", location: "Weinhandel", type: "REGULAR", area: "Arbeitsbereich 1", maxWorkers: 2, minWorkers: 1, notes: "", isPublished: false, isOpenShift: false, requiredSkills: [] as string[], color: "#8B1A1A", assignUserIds: [] as string[], recurring: false, recurWeekdays: [] as number[], recurUntil: "" };

// Wochentage für die Wiederholungs-Auswahl (value = Date.getDay(): 0=So..6=Sa)
const WEEKDAYS = [
  { value: 1, label: "Mo" }, { value: 2, label: "Di" }, { value: 3, label: "Mi" },
  { value: 4, label: "Do" }, { value: 5, label: "Fr" }, { value: 6, label: "Sa" }, { value: 0, label: "So" },
];

export default function Plan() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getWeek(now));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [form, setForm] = useState({ ...emptyShift });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignConflict, setAssignConflict] = useState<{ userId: string; userName: string; conflicts: string[] } | null>(null);

  const weekStr = `${year}-W${String(week).padStart(2, "0")}`;
  const firstDayOfWeek = (() => { const jan4 = new Date(year, 0, 4); return new Date(jan4.getTime() - ((jan4.getDay() || 7) - 1) * 86400000 + (week - 1) * 7 * 86400000); })();
  const lastDayOfWeek = new Date(firstDayOfWeek.getTime() + 6 * 86400000);
  const availMonthStr = `${firstDayOfWeek.getFullYear()}-${String(firstDayOfWeek.getMonth() + 1).padStart(2, "0")}`;
  const availMonthStr2 = lastDayOfWeek.getMonth() !== firstDayOfWeek.getMonth()
    ? `${lastDayOfWeek.getFullYear()}-${String(lastDayOfWeek.getMonth() + 1).padStart(2, "0")}`
    : null;

  const { data: shifts = [], isLoading } = useShifts({ week: weekStr });
  const { data: users = [] } = useUsers();
  const { data: avails1 = [] } = useAllAvailability(availMonthStr);
  const { data: avails2 = [] } = useAllAvailability(availMonthStr2 ?? "__disabled__");
  const allAvails = availMonthStr2 ? [...avails1, ...avails2] : avails1;
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const assignShift = useAssignShift();
  const updateAssignment = useUpdateAssignmentStatus();

  const days = getWeekDates(year, week);

  const prevWeek = () => { if (week === 1) { setYear((y) => y - 1); setWeek(52); } else setWeek((w) => w - 1); };
  const nextWeek = () => { if (week === 52) { setYear((y) => y + 1); setWeek(1); } else setWeek((w) => w + 1); };

  const openCreate = (date?: Date) => {
    setEditingId(null);
    setForm({ ...emptyShift, date: date ? date.toISOString().slice(0, 10) : "" });
    setModalOpen(true);
  };
  const openEdit = (s: Shift) => {
    setEditingId(s.id);
    setForm({ ...emptyShift, ...s, date: s.date.slice(0, 10), assignUserIds: s.assignments.map((a) => a.userId) });
    setModalOpen(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await updateShift.mutateAsync({ id: editingId, ...form });
    else await createShift.mutateAsync(form as Parameters<typeof createShift.mutateAsync>[0]);
    setModalOpen(false);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Schicht löschen?")) return;
    await deleteShift.mutateAsync(id);
    setSelectedShift(null);
  };
  const handlePublish = (s: Shift) => updateShift.mutateAsync({ id: s.id, isPublished: true });
  const handleToggleOpen = async (s: Shift) => {
    await updateShift.mutateAsync({ id: s.id, isOpenShift: !s.isOpenShift, isPublished: true });
    setSelectedShift((prev) => prev ? { ...prev, isOpenShift: !prev.isOpenShift, isPublished: true } : prev);
  };

  // Helper: use a.user.id (always present from explicit include select) + robust date parse
  const getAvail = (userId: string, day: Date) =>
    allAvails.find((a) => a.user.id === userId && isSameDay(parseAvailDate(a.date), day));

  // Helper: get APPLIED shifts for a user on a specific day
  const getApplied = (userId: string, day: Date) =>
    shifts.filter((s) => isSameDay(parseAvailDate(s.date), day) && s.assignments.some((a) => a.userId === userId && a.status === "APPLIED"));

  // Einteilen mit Konflikt-Vorprüfung: Backend liefert bei Konflikten 409
  // ASSIGN_CONFLICT → Popup. Bestätigt der Admin, wird mit force=true erneut gesendet.
  const handleAssign = async (shiftId: string, userId: string, userName: string) => {
    try {
      await assignShift.mutateAsync({ shiftId, userId });
    } catch (err) {
      const data = (err as { response?: { data?: { code?: string; conflicts?: string[] } } }).response?.data;
      if (data?.code === "ASSIGN_CONFLICT" && data.conflicts) {
        setAssignConflict({ userId, userName, conflicts: data.conflicts });
      } else {
        alert("Einteilen fehlgeschlagen.");
      }
    }
  };
  const confirmAssignForce = async () => {
    if (!assignConflict || !selectedShift) return;
    try {
      await assignShift.mutateAsync({ shiftId: selectedShift.id, userId: assignConflict.userId, force: true });
    } finally {
      setAssignConflict(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
        <button onClick={prevWeek} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
        <span className="font-semibold text-gray-800">KW {week} / {year}</span>
        <button onClick={nextWeek} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        <Button size="sm" onClick={() => openCreate()} className="ml-4"><Plus size={14} /> Schicht</Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{backgroundColor:"#166534"}} /> Verfügbar / Beworben</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{backgroundColor:"#8B1A1A"}} /> Eingeteilt</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{backgroundColor:"#dc2626"}} /> Offene Schicht (zu besetzen)</span>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Laden...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
            <div className="px-3 py-2 text-xs font-medium text-gray-400">Mitarbeiter</div>
            {days.map((d, i) => {
              const dayAvailCount = allAvails.filter((a) => isSameDay(parseAvailDate(a.date), d) && a.type === "AVAILABLE").length;
              const dayUnavailCount = allAvails.filter((a) => isSameDay(parseAvailDate(a.date), d) && a.type === "UNAVAILABLE").length;
              return (
                <div key={i} className="px-3 py-2 text-xs font-medium text-gray-600 border-l border-gray-200">
                  <div className={`text-base font-bold ${isSameDay(d, now) ? "text-[#8B1A1A]" : "text-gray-800"}`}>
                    {DAY_NAMES[i]} {d.getDate()}.
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {dayAvailCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-white rounded px-1 py-0.5 font-semibold"
                        style={{ backgroundColor: "#166534" }}>
                        {dayAvailCount} verfügbar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Offene Schichten — ganz oben über den Mitarbeitern */}
          <div className="grid grid-cols-8 border-b border-gray-200 min-h-[48px]" style={{ backgroundColor: "rgba(220,38,38,0.04)" }}>
            <div className="px-3 py-2 flex items-center text-xs border-r border-gray-100 font-semibold gap-1" style={{ color: "#b91c1c" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#dc2626" }} /> Offen
            </div>
            {days.map((d, i) => {
              const openShifts = shifts.filter((s) => isSameDay(parseAvailDate(s.date), d) && s.assignments.length === 0);
              const partialShifts = shifts.filter((s) => isSameDay(parseAvailDate(s.date), d) && s.assignments.filter(a => a.status !== "REJECTED").length > 0 && s.assignments.filter(a => a.status !== "REJECTED").length < s.minWorkers);
              return (
                <div key={i} className="border-l border-gray-100 p-1">
                  {openShifts.map((s) => (
                    <div key={s.id} onClick={() => setSelectedShift(s)}
                      className="text-[10px] rounded px-1.5 py-1 mb-0.5 cursor-pointer text-white font-semibold flex items-center gap-1"
                      style={{ backgroundColor: "#dc2626" }}>
                      <span className="truncate flex-1">{s.title} {s.startTime}–{s.endTime}</span>
                      {/* Bereichsfarbe überdeckt das Rote am Kästchenende */}
                      <span className="w-3 h-3 rounded-sm shrink-0 border border-white/50" style={{ backgroundColor: s.color }} title="Bereichsfarbe" />
                    </div>
                  ))}
                  {partialShifts.map((s) => (
                    <div key={s.id} onClick={() => setSelectedShift(s)}
                      className="text-[10px] rounded px-1.5 py-1 mb-0.5 cursor-pointer text-white font-semibold flex items-center gap-1"
                      style={{ backgroundColor: "#ea580c" }}>
                      <span className="truncate flex-1">{s.title} {s.assignments.filter(a => a.status !== "REJECTED").length}/{s.minWorkers}</span>
                      <span className="w-3 h-3 rounded-sm shrink-0 border border-white/50" style={{ backgroundColor: s.color }} title="Bereichsfarbe" />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Verfügbar-Zusammenfassung — ganz oben über den Mitarbeitern */}
          <div className="grid grid-cols-8 border-b border-gray-200 min-h-[40px]" style={{ backgroundColor: "rgba(20,83,45,0.04)" }}>
            <div className="px-3 py-2 flex items-center text-xs border-r border-gray-100 font-semibold gap-1" style={{ color: "#14532d" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#166534" }} /> Verfügbar
            </div>
            {days.map((d, i) => {
              const avails = allAvails.filter((a) => isSameDay(parseAvailDate(a.date), d) && a.type === "AVAILABLE");
              return (
                <div key={i} className="border-l border-gray-100 p-1 flex flex-col gap-0.5">
                  {avails.map((a) => (
                    <div key={a.id} className="text-[10px] font-semibold text-white rounded px-1 py-0.5 truncate"
                      style={{ backgroundColor: "#166534" }}>
                      {a.user.firstName} {a.startTime ? `${a.startTime}–${a.endTime}` : ""}
                    </div>
                  ))}
                  {avails.length === 0 && <span className="text-[10px] text-gray-300">–</span>}
                </div>
              );
            })}
          </div>

          {/* Employee rows */}
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-8 border-b border-gray-100 min-h-[64px]">
              <div className="px-3 py-2 flex items-center gap-2 border-r border-gray-100">
                <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                <span className="text-xs font-medium text-gray-700 truncate">{u.firstName}</span>
              </div>
              {days.map((d, i) => {
                const dayShifts = shifts.filter((s) => isSameDay(new Date(s.date), d) && s.assignments.some((a) => a.userId === u.id && (a.status === "ASSIGNED" || a.status === "APPROVED")));
                const avail = getAvail(u.id, d);
                const appliedShifts = getApplied(u.id, d);
                const isAvailable = avail?.type === "AVAILABLE";

                return (
                  <div key={i}
                    className="border-l border-gray-100 p-1 min-h-[64px] cursor-pointer group relative transition-colors hover:bg-gray-50"
                    style={isAvailable ? { backgroundColor: "rgba(20,83,45,0.06)" } : {}}
                    onClick={() => openCreate(d)}>

                    {/* Availability: dunkelgrün mit Zeit */}
                    {isAvailable && (
                      <div className="text-[10px] font-semibold rounded px-1 py-0.5 mb-0.5 flex items-center gap-0.5 w-fit text-white"
                        style={{ backgroundColor: "#166534" }}>
                        {avail!.startTime && avail!.endTime ? `${avail!.startTime}–${avail!.endTime}` : "Verfügbar"}
                      </div>
                    )}

                    {/* Schichtbewerbung (APPLIED): auch dunkelgrün */}
                    {appliedShifts.map((s) => (
                      <div key={s.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedShift(s); }}
                        className="text-[10px] font-semibold rounded px-1 py-0.5 mb-0.5 flex items-center gap-0.5 w-fit text-white cursor-pointer"
                        style={{ backgroundColor: "#15803d" }}>
                        📋 {s.startTime}–{s.endTime}
                      </div>
                    ))}

                    {/* Eingeteilt: Farbe der Schicht (vom Admin gewählter Bereich) */}
                    {dayShifts.map((s) => (
                      <div key={s.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedShift(s); }}
                        className="text-[10px] rounded px-1.5 py-1 mb-0.5 cursor-pointer hover:opacity-80 text-white truncate font-medium"
                        style={{ backgroundColor: s.color }}>
                        {s.startTime}–{s.endTime}
                      </div>
                    ))}

                    {/* Hover: add */}
                    {dayShifts.length === 0 && !appliedShifts.length && (
                      <div className="hidden group-hover:flex items-center justify-center w-5 h-5 bg-gray-200 rounded text-gray-500 mx-auto mt-1">
                        <Plus size={10} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        </div>
      )}

      {/* Shift detail panel */}
      {selectedShift && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{selectedShift.title}</h3>
              <p className="text-xs text-gray-500">
                {new Date(selectedShift.date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })} · {selectedShift.startTime}–{selectedShift.endTime}
              </p>
            </div>
            <button onClick={() => setSelectedShift(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
          </div>
          <div className="p-4 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge label={TYPE_LABELS[selectedShift.type] ?? selectedShift.type} color="wine" />
              {selectedShift.isPublished ? <Badge label="Veröffentlicht" color="green" /> : <Badge label="Entwurf" color="yellow" />}
              {selectedShift.isOpenShift && <Badge label="Schichtbörse" color="blue" />}
            </div>

            {selectedShift.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedShift.notes}</p>}

            {/* Bewerber (APPLIED) — oben, prominent */}
            {selectedShift.assignments.some((a) => a.status === "APPLIED") && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                  <Users size={13} />
                  {selectedShift.assignments.filter((a) => a.status === "APPLIED").length} Bewerbung(en) — Bestätigung ausstehend
                </p>
                <div className="space-y-2">
                  {selectedShift.assignments.filter((a) => a.status === "APPLIED").map((a) => {
                    const avail = getAvail(a.userId, new Date(selectedShift.date));
                    return (
                      <div key={a.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100">
                        <Avatar name={`${a.user.firstName} ${a.user.lastName}`} src={a.user.avatarUrl} size="sm" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-800 font-medium">{a.user.firstName} {a.user.lastName}</span>
                          {avail?.startTime && <p className="text-xs text-green-600">{avail.startTime}–{avail.endTime} verfügbar</p>}
                        </div>
                        <button onClick={() => updateAssignment.mutate({ shiftId: selectedShift.id, assignmentId: a.id, status: "APPROVED" })}
                          disabled={updateAssignment.isPending}
                          className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold">✓</button>
                        <button onClick={() => updateAssignment.mutate({ shiftId: selectedShift.id, assignmentId: a.id, status: "REJECTED" })}
                          disabled={updateAssignment.isPending}
                          className="px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold">✗</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verfügbare Mitarbeiter (nicht beworben, nicht zugeteilt) */}
            {(() => {
              const shiftDate = parseAvailDate(selectedShift.date);
              const assignedIds = new Set(selectedShift.assignments.map((a) => a.userId));
              const freeAvails = allAvails.filter((a) =>
                isSameDay(parseAvailDate(a.date), shiftDate) &&
                a.type === "AVAILABLE" &&
                !assignedIds.has(a.user.id)
              );
              if (freeAvails.length === 0) return null;
              return (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    {freeAvails.length} verfügbare Mitarbeiter (nicht zugeteilt)
                  </p>
                  <div className="space-y-1.5">
                    {freeAvails.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                        <Avatar name={`${a.user.firstName} ${a.user.lastName}`} size="sm" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-800">{a.user.firstName} {a.user.lastName}</span>
                          {a.startTime && <p className="text-xs text-green-600">{a.startTime}–{a.endTime}</p>}
                        </div>
                        <button
                          onClick={() => handleAssign(selectedShift.id, a.user.id, `${a.user.firstName} ${a.user.lastName}`)}
                          disabled={assignShift.isPending}
                          className="px-2.5 py-1 text-xs bg-[#8B1A1A] text-white rounded-lg hover:bg-[#6B1414] font-medium">
                          Einteilen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Alle Mitarbeiter einteilen (auch ohne Verfügbarkeit) */}
            {(() => {
              const shiftDate = parseAvailDate(selectedShift.date);
              const assignedIds = new Set(selectedShift.assignments.map((a) => a.userId));
              const availableIds = new Set(
                allAvails
                  .filter((a) => isSameDay(parseAvailDate(a.date), shiftDate) && a.type === "AVAILABLE")
                  .map((a) => a.user.id),
              );
              // Nur die, die weder schon zugeteilt/beworben noch als verfügbar gelistet sind.
              const others = users.filter((u) => !assignedIds.has(u.id) && !availableIds.has(u.id));
              if (others.length === 0) return null;
              return (
                <details className="group">
                  <summary className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1 cursor-pointer list-none">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    Weitere Mitarbeiter einteilen ({others.length}) — Warnung bei fehlender Verfügbarkeit
                  </summary>
                  <div className="space-y-1.5 mt-1">
                    {others.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{u.firstName} {u.lastName}</span>
                        <button
                          onClick={() => handleAssign(selectedShift.id, u.id, `${u.firstName} ${u.lastName}`)}
                          disabled={assignShift.isPending}
                          className="px-2.5 py-1 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium">
                          Einteilen
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })()}

            {/* Zugewiesene Mitarbeiter */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Zugeteilt ({selectedShift.assignments.filter(a => a.status !== "REJECTED" && a.status !== "APPLIED").length}/{selectedShift.maxWorkers})
              </p>
              {selectedShift.assignments.filter(a => a.status !== "APPLIED").length === 0 ? (
                <p className="text-sm text-gray-400 italic">Niemand zugeteilt</p>
              ) : (
                <div className="space-y-2">
                  {selectedShift.assignments.filter(a => a.status !== "APPLIED").map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Avatar name={`${a.user.firstName} ${a.user.lastName}`} src={a.user.avatarUrl} size="sm" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{a.user.firstName} {a.user.lastName}</span>
                      <Badge label={a.status} color={a.status === "APPROVED" ? "green" : a.status === "REJECTED" ? "red" : "blue"} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              {!selectedShift.isPublished && (
                <Button className="w-full" size="sm" onClick={() => handlePublish(selectedShift)}><Eye size={14} /> Veröffentlichen</Button>
              )}
              <Button className="w-full" size="sm" variant={selectedShift.isOpenShift ? "secondary" : "primary"} onClick={() => handleToggleOpen(selectedShift)}>
                {selectedShift.isOpenShift ? "🔒 Schichtbörse schließen" : "🔓 In Schichtbörse stellen"}
              </Button>
              <Button variant="secondary" className="w-full" size="sm" onClick={() => { setSelectedShift(null); openEdit(selectedShift); }}>Bearbeiten</Button>
              <Button variant="danger" className="w-full" size="sm" onClick={() => handleDelete(selectedShift.id)}><Trash2 size={14} /> Löschen</Button>
            </div>
          </div>
        </div>
      )}

      {/* Konflikt-Bestätigung beim Einteilen */}
      {assignConflict && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="text-amber-500 text-lg">⚠️</span> Trotzdem einteilen?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">{assignConflict.userName}</span> für diese Schicht:
            </p>
            <ul className="text-sm text-gray-700 space-y-1.5 mb-4 list-disc pl-5">
              {assignConflict.conflicts.map((c) => (
                <li key={c}>{CONFLICT_LABELS[c] ?? c}</li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setAssignConflict(null)}>Abbrechen</Button>
              <Button variant="danger" className="flex-1" disabled={assignShift.isPending} onClick={confirmAssignForce}>Trotzdem einteilen</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? "Schicht bearbeiten" : "Schicht anlegen"}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titel*</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" placeholder="z.B. Tagschicht" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Datum*</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Von*</label>
                  <input type="time" required value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bis*</label>
                  <input type="time" required value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Typ</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Farbe</label>
                  <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-full h-[38px] px-1 py-1 border border-gray-300 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max. Mitarbeiter</label>
                  <input type="number" min={1} value={form.maxWorkers} onChange={(e) => setForm((f) => ({ ...f, maxWorkers: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Arbeitsbereich</label>
                  <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notizen</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 resize-none" />
              </div>

              {/* Employee list with availability indicator */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Mitarbeiter zuweisen</label>
                <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2">
                  {users.map((u) => {
                    const avail = form.date ? getAvail(u.id, new Date(form.date)) : null;
                    return (
                      <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg">
                        <input type="checkbox" checked={form.assignUserIds.includes(u.id)}
                          onChange={(e) => setForm((f) => ({ ...f, assignUserIds: e.target.checked ? [...f.assignUserIds, u.id] : f.assignUserIds.filter((id) => id !== u.id) }))} />
                        <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                        <span className="flex-1">{u.firstName} {u.lastName}</span>
                        {avail && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${avail.type === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {avail.type === "AVAILABLE"
                              ? (avail.startTime ? `✓ ${avail.startTime}–${avail.endTime}` : "✓ Verfügbar")
                              : "✗ Nicht da"}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {!editingId && (
                <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={form.recurring} onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))} />
                    Schicht wiederholt sich wöchentlich
                  </label>
                  {form.recurring && (
                    <div className="space-y-3 pl-6">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">An welchen Wochentagen?</label>
                        <div className="flex flex-wrap gap-1.5">
                          {WEEKDAYS.map((d) => {
                            const active = form.recurWeekdays.includes(d.value);
                            return (
                              <button key={d.value} type="button"
                                onClick={() => setForm((f) => ({ ...f, recurWeekdays: active ? f.recurWeekdays.filter((x) => x !== d.value) : [...f.recurWeekdays, d.value] }))}
                                className={`w-10 h-9 rounded-lg text-sm font-medium border transition-colors ${active ? "bg-[#8B1A1A] text-white border-[#8B1A1A]" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Wiederholen bis (Enddatum)</label>
                        <input type="date" value={form.recurUntil} min={form.date} required={form.recurring}
                          onChange={(e) => setForm((f) => ({ ...f, recurUntil: e.target.value }))}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isOpenShift} onChange={(e) => setForm((f) => ({ ...f, isOpenShift: e.target.checked }))} />
                  Offene Schicht (Schichtbörse)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                  Veröffentlichen
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Abbrechen</Button>
                <Button type="submit" className="flex-1" disabled={createShift.isPending || updateShift.isPending}>
                  {createShift.isPending || updateShift.isPending ? "Speichern..." : "Speichern"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
