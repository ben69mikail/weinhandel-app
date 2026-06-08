import { useState } from "react";
import { useShifts, useUsers, useCreateShift, useUpdateShift, useDeleteShift, useAssignShift, useUpdateAssignmentStatus, Shift } from "@/hooks/useApi";
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
  const [preselectedDate, setPreselectedDate] = useState("");
  const [form, setForm] = useState({ ...emptyShift });
  const [editingId, setEditingId] = useState<string | null>(null);

  const weekStr = `${year}-W${String(week).padStart(2, "0")}`;
  const { data: shifts = [], isLoading } = useShifts({ week: weekStr });
  const { data: users = [] } = useUsers();
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
    setPreselectedDate(date ? date.toISOString().slice(0, 10) : "");
    setModalOpen(true);
  };

  const openEdit = (s: Shift) => {
    setEditingId(s.id);
    setForm({ ...emptyShift, ...s, date: s.date.slice(0, 10), assignUserIds: s.assignments.map((a) => a.userId) });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateShift.mutateAsync({ id: editingId, ...form });
    } else {
      await createShift.mutateAsync(form as Parameters<typeof createShift.mutateAsync>[0]);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Schicht löschen?")) return;
    await deleteShift.mutateAsync(id);
    setSelectedShift(null);
  };

  const handlePublish = async (s: Shift) => {
    await updateShift.mutateAsync({ id: s.id, isPublished: true });
  };

  const handleToggleOpen = async (s: Shift) => {
    await updateShift.mutateAsync({ id: s.id, isOpenShift: !s.isOpenShift, isPublished: true });
    setSelectedShift((prev) => prev ? { ...prev, isOpenShift: !prev.isOpenShift, isPublished: true } : prev);
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

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Laden...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="px-3 py-2 text-xs font-medium text-gray-400">Mitarbeiter</div>
            {days.map((d, i) => (
              <div key={i} className="px-3 py-2 text-xs font-medium text-gray-600 border-l border-gray-100">
                <div>{DAY_NAMES[i]}</div>
                <div className={`text-base font-bold mt-0.5 ${isSameDay(d, now) ? "text-[#8B1A1A]" : "text-gray-800"}`}>
                  {d.getDate()}.{d.getMonth() + 1}.
                </div>
              </div>
            ))}
          </div>

          {/* Employee rows */}
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-8 border-b border-gray-100 min-h-[56px]">
              <div className="px-3 py-2 flex items-center gap-2 border-r border-gray-100">
                <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                <span className="text-xs font-medium text-gray-700 truncate">{u.firstName}</span>
              </div>
              {days.map((d, i) => {
                const dayShifts = shifts.filter((s) => isSameDay(new Date(s.date), d) && s.assignments.some((a) => a.userId === u.id));
                return (
                  <div key={i} className="border-l border-gray-100 p-1 min-h-[56px] hover:bg-gray-50 cursor-pointer group"
                    onClick={() => openCreate(d)}>
                    {dayShifts.map((s) => (
                      <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedShift(s); }}
                        className="text-xs rounded px-1.5 py-1 mb-0.5 cursor-pointer hover:opacity-80 transition-opacity text-white truncate"
                        style={{ backgroundColor: s.color }}>
                        {s.startTime}–{s.endTime}
                      </div>
                    ))}
                    <div className="hidden group-hover:flex items-center justify-center w-5 h-5 bg-gray-200 rounded text-gray-500 mx-auto mt-1">
                      <Plus size={10} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Unassigned shifts row */}
          <div className="grid grid-cols-8 border-b border-gray-100 bg-amber-50/50 min-h-[48px]">
            <div className="px-3 py-2 flex items-center text-xs text-gray-400 border-r border-gray-100">Offen</div>
            {days.map((d, i) => {
              const dayShifts = shifts.filter((s) => isSameDay(new Date(s.date), d) && s.assignments.length === 0);
              return (
                <div key={i} className="border-l border-gray-100 p-1">
                  {dayShifts.map((s) => (
                    <div key={s.id} onClick={() => setSelectedShift(s)}
                      className="text-xs rounded px-1.5 py-1 mb-0.5 cursor-pointer border border-dashed border-gray-300 text-gray-500 truncate hover:bg-amber-100">
                      {s.title} {s.startTime}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shift detail panel */}
      {selectedShift && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{selectedShift.title}</h3>
            <button onClick={() => setSelectedShift(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge label={new Date(selectedShift.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })} color="gray" />
              <Badge label={`${selectedShift.startTime} – ${selectedShift.endTime}`} color="blue" />
              <Badge label={TYPE_LABELS[selectedShift.type] ?? selectedShift.type} color="wine" />
              {selectedShift.isPublished ? <Badge label="Veröffentlicht" color="green" /> : <Badge label="Entwurf" color="yellow" />}
            </div>

            {selectedShift.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedShift.notes}</p>}

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Mitarbeiter ({selectedShift.assignments.length}/{selectedShift.maxWorkers})</p>
              {selectedShift.assignments.length === 0 ? (
                <p className="text-sm text-gray-400">Keine zugewiesen</p>
              ) : (
                <div className="space-y-2">
                  {selectedShift.assignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Avatar name={`${a.user.firstName} ${a.user.lastName}`} src={a.user.avatarUrl} size="sm" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{a.user.firstName} {a.user.lastName}</span>
                      <Badge label={a.status} color={a.status === "APPROVED" ? "green" : a.status === "REJECTED" ? "red" : a.status === "APPLIED" ? "yellow" : "blue"} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bewerber-Verwaltung */}
            {selectedShift.assignments.some((a) => a.status === "APPLIED") && (
              <div>
                <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-2 flex items-center gap-1.5">
                  <Users size={13} />
                  {selectedShift.assignments.filter((a) => a.status === "APPLIED").length} Bewerbung(en) ausstehend
                </p>
                <div className="space-y-2">
                  {selectedShift.assignments.filter((a) => a.status === "APPLIED").map((a) => (
                    <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <Avatar name={`${a.user.firstName} ${a.user.lastName}`} src={a.user.avatarUrl} size="sm" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{a.user.firstName} {a.user.lastName}</span>
                      <button
                        onClick={() => updateAssignment.mutate({ shiftId: selectedShift.id, assignmentId: a.id, status: "APPROVED" })}
                        disabled={updateAssignment.isPending}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">
                        ✓
                      </button>
                      <button
                        onClick={() => updateAssignment.mutate({ shiftId: selectedShift.id, assignmentId: a.id, status: "REJECTED" })}
                        disabled={updateAssignment.isPending}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">
                        ✗
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {!selectedShift.isPublished && (
                <Button className="w-full" size="sm" onClick={() => handlePublish(selectedShift)}><Eye size={14} /> Veröffentlichen</Button>
              )}
              <Button
                className="w-full"
                size="sm"
                variant={selectedShift.isOpenShift ? "secondary" : "primary"}
                onClick={() => handleToggleOpen(selectedShift)}>
                {selectedShift.isOpenShift ? "🔒 Schichtbörse schließen" : "🔓 In Schichtbörse stellen"}
              </Button>
              <Button variant="secondary" className="w-full" size="sm" onClick={() => { setSelectedShift(null); openEdit(selectedShift); }}>
                Bearbeiten
              </Button>
              <Button variant="danger" className="w-full" size="sm" onClick={() => handleDelete(selectedShift.id)}>
                <Trash2 size={14} /> Löschen
              </Button>
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Mitarbeiter zuweisen</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {users.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <input type="checkbox" checked={form.assignUserIds.includes(u.id)}
                        onChange={(e) => setForm((f) => ({ ...f, assignUserIds: e.target.checked ? [...f.assignUserIds, u.id] : f.assignUserIds.filter((id) => id !== u.id) }))} />
                      <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                      {u.firstName} {u.lastName}
                    </label>
                  ))}
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