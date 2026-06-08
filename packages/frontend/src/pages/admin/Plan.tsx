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
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const TYPE_LABELS: Record<string, string> = { REGULAR: "Regulär", EVENT: "Event", TASTING: "Verkostung", CONCERT: "Konzert", HOLIDAY_COVERAGE: "Notfall" };
const emptyShift = { title: "", date: "", startTime: "09:00", endTime: "17:00", location: "Weinhandel", type: "REGULAR", area: "Arbeitsbereich 1", maxWorkers: 2, minWorkers: 1, notes: "", isPublished: false, isOpenShift: false, requiredSkills: [] as string[], color: "#8B1A1A", assignUserIds: [] as string[] };

export default function Plan() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getWeek(now));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [form, setForm] = useState({ ...emptyShift });
  const [editingId, setEditingId] = useState<string | null>(null);

  const weekStr = `${year}-W${String(week).padStart(2, "0")}`;
  const firstDayOfWeek = (() => { const jan4 = new Date(year, 0, 4); return new Date(jan4.getTime() - ((jan4.getDay() || 7) - 1) * 86400000 + (week - 1) * 7 * 86400000); })();
  const availMonthStr = `${firstDayOfWeek.getFullYear()}-${String(firstDayOfWeek.getMonth() + 1).padStart(2, "0")}`;

  const { data: shifts = [], isLoading } = useShifts({ week: weekStr });
  const { data: users = [] } = useUsers();
  const { data: allAvails = [] } = useAllAvailability(availMonthStr);
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

  // Helper: get availability for a user on a specific day
  const getAvail = (userId: string, day: Date) =>
    allAvails.find((a) => a.userId === userId && isSameDay(new Date(a.date), day));

  // Helper: get APPLIED shifts for a user on a specific day
  const getApplied = (userId: string, day: Date) =>
    shifts.filter((s) => isSameDay(new Date(s.date), day) && s.assignments.some((a) => a.userId === userId && a.status === "APPLIED"));

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
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Verfügbar (mit Zeit)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Nicht da</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Beworben für Schicht</span>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Laden...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
            <div className="px-3 py-2 text-xs font-medium text-gray-400">Mitarbeiter</div>
            {days.map((d, i) => {
              const dayAvailCount = allAvails.filter((a) => isSameDay(new Date(a.date), d) && a.type === "AVAILABLE").length;
              const dayUnavailCount = allAvails.filter((a) => isSameDay(new Date(a.date), d) && a.type === "UNAVAILABLE").length;
              return (
                <div key={i} className="px-3 py-2 text-xs font-medium text-gray-600 border-l border-gray-200">
                  <div className={`text-base font-bold ${isSameDay(d, now) ? "text-[#8B1A1A]" : "text-gray-800"}`}>
                    {DAY_NAMES[i]} {d.getDate()}.
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {dayAvailCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-700 bg-green-100 rounded px-1 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{dayAvailCount} frei
                      </span>
                    )}
                    {dayUnavailCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-700 bg-red-100 rounded px-1 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />{dayUnavailCount} weg
                      </span>
                    )}
                  </div>
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
                const dayShifts = shifts.filter((s) => isSameDay(new Date(s.date), d) && s.assignments.some((a) => a.userId === u.id && a.status !== "REJECTED"));
                const avail = getAvail(u.id, d);
                const appliedShifts = getApplied(u.id, d);
                const isAvailable = avail?.type === "AVAILABLE";
                const isUnavailable = avail?.type === "UNAVAILABLE";

                return (
                  <div key={i}
                    className={`border-l border-gray-100 p-1 min-h-[64px] cursor-pointer group relative transition-colors
                      ${isAvailable ? "bg-green-50/60 hover:bg-green-50" : isUnavailable ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"}`}
                    onClick={() => openCreate(d)}>

                    {/* Availability indicator */}
                    {avail && (
                      <div className={`text-[10px] font-medium rounded px-1 py-0.5 mb-0.5 flex items-center gap-1 w-fit
                        ${isAvailable ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${isAvailable ? "bg-green-500" : "bg-red-500"}`} />
                        {isAvailable
                          ? (avail.startTime && avail.endTime ? `${avail.startTime}–${avail.endTime}` : "Verfügbar")
                          : "Nicht da"}
                      </div>
                    )}

                    {/* Applied badges */}
                    {appliedShifts.map((s) => (
                      <div key={s.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedShift(s); }}
                        className="text-[10px] font-medium rounded px-1 py-0.5 mb-0.5 flex items-center gap-1 w-fit text-amber-700 bg-amber-100 cursor-pointer hover:bg-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        Beworben
                      </div>
                    ))}

                    {/* Assigned shifts */}
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

          {/* Unassigned / Open shifts row */}
          <div className="grid grid-cols-8 border-b border-gray-100 bg-amber-50/50 min-h-[48px]">
            <div className="px-3 py-2 flex items-center text-xs text-gray-400 border-r border-gray-100 font-medium">Offen / Unbesetzt</div>
            {days.map((d, i) => {
              const openShifts = shifts.filter((s) => isSameDay(new Date(s.date), d) && s.assignments.length === 0);
              const partialShifts = shifts.filter((s) => isSameDay(new Date(s.date), d) && s.assignments.length > 0 && s.assignments.length < s.minWorkers);
              return (
                <div key={i} className="border-l border-gray-100 p-1">
                  {openShifts.map((s) => (
                    <div key={s.id} onClick={() => setSelectedShift(s)}
                      className="text-[10px] rounded px-1.5 py-1 mb-0.5 cursor-pointer border border-dashed border-amber-300 text-amber-700 bg-amber-50 truncate hover:bg-amber-100 font-medium">
                      📋 {s.title} {s.startTime}
                    </div>
                  ))}
                  {partialShifts.map((s) => (
                    <div key={s.id} onClick={() => setSelectedShift(s)}
                      className="text-[10px] rounded px-1.5 py-1 mb-0.5 cursor-pointer border border-dashed border-orange-300 text-orange-700 bg-orange-50 truncate hover:bg-orange-100 font-medium">
                      ⚠ {s.title} ({s.assignments.length}/{s.minWorkers})
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Verfügbar-Zusammenfassung */}
          <div className="grid grid-cols-8 bg-green-50/30 min-h-[40px]">
            <div className="px-3 py-2 flex items-center text-xs text-green-700 border-r border-gray-100 font-medium gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Verfügbar
            </div>
            {days.map((d, i) => {
              const avails = allAvails.filter((a) => isSameDay(new Date(a.date), d) && a.type === "AVAILABLE");
              return (
                <div key={i} className="border-l border-gray-100 p-1 flex flex-col gap-0.5">
                  {avails.map((a) => (
                    <div key={a.id} className="text-[10px] text-green-700 truncate">
                      {a.user.firstName} {a.startTime ? `${a.startTime}–${a.endTime}` : ""}
                    </div>
                  ))}
                  {avails.length === 0 && <span className="text-[10px] text-gray-300">–</span>}
                </div>
              );
            })}
          </div>
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
              const shiftDate = new Date(selectedShift.date);
              const assignedIds = new Set(selectedShift.assignments.map((a) => a.userId));
              const freeAvails = allAvails.filter((a) =>
                isSameDay(new Date(a.date), shiftDate) &&
                a.type === "AVAILABLE" &&
                !assignedIds.has(a.userId)
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
                          onClick={() => assignShift.mutate({ shiftId: selectedShift.id, userId: a.userId })}
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
