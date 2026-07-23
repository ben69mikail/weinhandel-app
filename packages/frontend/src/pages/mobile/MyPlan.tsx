import { useState } from "react";
import { useMyShifts, useOpenShifts, useApplyShift, useAvailability, useSetAvailability } from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

function getMonthDates(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0).getDate();
  const startDay = (first.getDay() + 6) % 7;
  return { last, startDay };
}

const STATUS_COLOR: Record<string, string> = { APPROVED: "green", ASSIGNED: "blue", APPLIED: "yellow", REJECTED: "red" };
const TYPE_LABELS: Record<string, string> = { REGULAR: "Regulär", EVENT: "Event", TASTING: "Verkostung", CONCERT: "Konzert", HOLIDAY_COVERAGE: "Notfall" };

// ── Mein Plan Tab ──────────────────────────────────────────────────────────────
function MeinPlanTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState<string | null>(null);
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const { data: shifts = [], isLoading } = useMyShifts(monthStr);

  const prev = () => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); };

  const { last, startDay } = getMonthDates(year, month);
  const shiftByDay = new Map(shifts.map((s) => [new Date(s.date).getDate(), s]));
  const selectedShift = selected ? shifts.find((s) => new Date(s.date).getDate() === Number(selected)) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-800">
            {new Date(year, month - 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </span>
          <button onClick={next} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: last }, (_, i) => i + 1).map((day) => {
            const shift = shiftByDay.get(day);
            const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
            const isSelected = selected === String(day);
            return (
              <button key={day} onClick={() => setSelected(shift ? String(day) : null)}
                className={cn("aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors",
                  isSelected ? "ring-2 ring-[#8B1A1A]" : "",
                  shift ? "text-white" : isToday ? "bg-[#8B1A1A]/10 text-[#8B1A1A] font-bold" : "text-gray-700 hover:bg-gray-100")}
                style={shift ? { backgroundColor: shift.color } : {}}>
                <span>{day}</span>
                {shift && <span className="text-[9px] opacity-80">{shift.startTime}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedShift && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: selectedShift.color }}>
              {new Date(selectedShift.date).getDate()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{selectedShift.title}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><Clock size={12} /> {selectedShift.startTime}–{selectedShift.endTime}</p>
            </div>
          </div>
          {selectedShift.assignments.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users size={14} className="text-gray-400" />
              {selectedShift.assignments.map((a) => a.user.firstName).join(", ")}
            </div>
          )}
          {selectedShift.notes && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{selectedShift.notes}</p>}
          {selectedShift.assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge label={a.status} color={(STATUS_COLOR[a.status] ?? "gray") as "blue"|"gray"|"green"|"red"|"yellow"|"wine"} />
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Laden...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Keine Schichten in diesem Monat</div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{shifts.length} Schichten</p>
          {shifts.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(s.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })} · {s.startTime}–{s.endTime}
                </p>
              </div>
              <Badge label={s.assignments[0]?.status ?? "–"} color={(STATUS_COLOR[s.assignments[0]?.status] ?? "gray") as "blue"|"gray"|"green"|"red"|"yellow"|"wine"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Schichtbörse Tab ───────────────────────────────────────────────────────────
function SchichtboerseTab() {
  const { data: shifts = [], isLoading } = useOpenShifts();
  const apply = useApplyShift();
  const user = useAuthStore((s) => s.user);

  const hasApplied = (shiftId: string) =>
    shifts.find((s) => s.id === shiftId)?.assignments.some((a) => a.userId === user?.id);

  const handleApply = async (id: string) => {
    try {
      await apply.mutateAsync(id);
    } catch (err) {
      const data = (err as { response?: { data?: { code?: string; message?: string } } }).response?.data;
      alert(data?.code === "DAY_LOCKED" ? data.message : "Bewerbung fehlgeschlagen.");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{shifts.length} offene Schichten</p>
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-gray-500">Keine offenen Schichten</p>
        </div>
      ) : (
        shifts.map((s) => {
          const applied = hasApplied(s.id);
          const free = s.maxWorkers - s.assignments.length;
          return (
            <div key={s.id}
              className="rounded-2xl border overflow-hidden shadow-sm transition-colors"
              style={applied ? { borderColor: "#166534", backgroundColor: "#14532d" } : {}}>
              <div className="h-1.5" style={{ backgroundColor: applied ? "#166534" : s.color }} />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold" style={{ color: applied ? "#fff" : "" }}>{s.title}</h3>
                    <p className="text-sm" style={{ color: applied ? "#bbf7d0" : "#6b7280" }}>
                      {new Date(s.date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
                    </p>
                  </div>
                  <Badge label={TYPE_LABELS[s.type] ?? s.type} color="wine" />
                </div>
                <div className="flex flex-wrap gap-3 text-sm" style={{ color: applied ? "#dcfce7" : "#4b5563" }}>
                  <span className="flex items-center gap-1"><Clock size={14} style={{ color: applied ? "#86efac" : "#9ca3af" }} />{s.startTime}–{s.endTime}</span>
                  <span className="flex items-center gap-1"><Users size={14} style={{ color: applied ? "#86efac" : "#9ca3af" }} />{free} Platz{free !== 1 ? "plätze" : ""} frei</span>
                </div>
                {s.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.requiredSkills.map((sk) => <Badge key={sk} label={sk} color="gray" />)}
                  </div>
                )}
                <button
                  onClick={() => !applied && handleApply(s.id)}
                  disabled={applied || apply.isPending || free <= 0}
                  className="w-full py-2 px-4 rounded-xl text-sm font-semibold transition-colors"
                  style={applied
                    ? { backgroundColor: "#166534", color: "#fff", cursor: "default" }
                    : free <= 0
                      ? { backgroundColor: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }
                      : { backgroundColor: "#8B1A1A", color: "#fff" }}
                >
                  {applied ? "✓ Beworben" : free <= 0 ? "Ausgebucht" : "Jetzt bewerben"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Verfügbarkeit Tab ──────────────────────────────────────────────────────────
function VerfuegbarkeitTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const { data: avails = [] } = useAvailability(monthStr);
  const setAvail = useSetAvailability();

  const prev = () => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); };

  const availByDay = new Map(avails.map((a) => [new Date(a.date).getDate(), a]));
  const { last, startDay } = getMonthDates(year, month);

  const openPicker = (day: number) => {
    const existing = availByDay.get(day);
    setPickerDay(day);
    setStartTime(existing?.startTime ?? "09:00");
    setEndTime(existing?.endTime ?? "17:00");
  };

  const handleSave = async () => {
    if (!pickerDay) return;
    const date = `${year}-${String(month).padStart(2,"0")}-${String(pickerDay).padStart(2,"0")}`;
    try {
      await setAvail.mutateAsync({ date, type: "AVAILABLE", startTime, endTime });
      setPickerDay(null);
    } catch (err) {
      const data = (err as { response?: { data?: { code?: string; message?: string } } }).response?.data;
      alert(data?.code === "DAY_LOCKED" ? data.message : "Speichern fehlgeschlagen.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Trage ein, wann du verfügbar bist. Der Administrator sieht deine Zeiten im Schichtplan.</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-800">
            {new Date(year, month - 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </span>
          <button onClick={next} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: last }, (_, i) => i + 1).map((day) => {
            const avail = availByDay.get(day);
            const isToday = day === now.getDate() && month === now.getMonth()+1 && year === now.getFullYear();
            const isPast = new Date(year, month-1, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const isActive = avail?.type === "AVAILABLE";
            return (
              <button key={day} disabled={isPast}
                onClick={() => !isPast && openPicker(day)}
                className={cn("aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors",
                  isPast ? "opacity-25 cursor-not-allowed" : "hover:bg-gray-100",
                  pickerDay === day ? "ring-2 ring-[#8B1A1A]" : "",
                  isActive ? "bg-green-800 !text-white" : isToday ? "ring-2 ring-[#8B1A1A]" : "")}>
                <span className={cn(isActive ? "text-white font-semibold" : isToday ? "font-bold text-[#8B1A1A]" : "text-gray-700")}>{day}</span>
                {isActive && avail?.startTime && (
                  <span className="text-[8px] text-green-200 leading-tight">{avail.startTime}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {pickerDay && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <p className="font-semibold text-gray-800">
            {new Date(year, month-1, pickerDay).toLocaleDateString("de-DE", { weekday:"long", day:"2-digit", month:"long" })}
          </p>
          <p className="text-sm text-gray-500">Von wann bis wann bist du verfügbar?</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Von</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700/30 font-medium" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Bis</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700/30 font-medium" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setPickerDay(null)}>Abbrechen</Button>
            <Button className="flex-1 !bg-green-800 hover:!bg-green-900 justify-center" onClick={handleSave} disabled={setAvail.isPending}>
              {setAvail.isPending ? "Speichern..." : "✓ Verfügbar eintragen"}
            </Button>
          </div>

          {availByDay.get(pickerDay) && (
            <p className="text-xs text-center text-gray-400">Bereits eingetragen: {availByDay.get(pickerDay)?.startTime}–{availByDay.get(pickerDay)?.endTime}</p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">Grüne Tage = du bist verfügbar · Tippe auf Tag zum Bearbeiten</p>
    </div>
  );
}

// ── Main Hub ───────────────────────────────────────────────────────────────────
type Tab = "plan" | "schichten" | "verfuegbarkeit";

export default function MyPlan() {
  const location = useLocation();
  const initialTab = (location.state as { tab?: Tab } | null)?.tab ?? "plan";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const tabs: { id: Tab; label: string }[] = [
    { id: "plan",           label: "Mein Plan" },
    { id: "schichten",      label: "Schichtbörse" },
    { id: "verfuegbarkeit", label: "Verfügbarkeit" },
  ];

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === t.id ? "bg-white text-[#8B1A1A] shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "plan"           && <MeinPlanTab />}
      {activeTab === "schichten"      && <SchichtboerseTab />}
      {activeTab === "verfuegbarkeit" && <VerfuegbarkeitTab />}
    </div>
  );
}
