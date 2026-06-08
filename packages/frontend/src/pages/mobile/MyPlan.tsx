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

const AVAIL_TYPES = [
  { value: "AVAILABLE",   label: "Verfügbar",  bg: "bg-green-500" },
  { value: "PREFERRED",   label: "Bevorzugt",  bg: "bg-blue-500" },
  { value: "PARTIAL",     label: "Teilweise",  bg: "bg-amber-400" },
  { value: "UNAVAILABLE", label: "Nicht da",   bg: "bg-red-500" },
] as const;

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
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="h-1.5" style={{ backgroundColor: s.color }} />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(s.date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
                    </p>
                  </div>
                  <Badge label={TYPE_LABELS[s.type] ?? s.type} color="wine" />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Clock size={14} className="text-gray-400" />{s.startTime}–{s.endTime}</span>
                  <span className="flex items-center gap-1"><Users size={14} className="text-gray-400" />{free} Platz{free !== 1 ? "plätze" : ""} frei</span>
                </div>
                {s.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.requiredSkills.map((sk) => <Badge key={sk} label={sk} color="gray" />)}
                  </div>
                )}
                <Button
                  onClick={() => !applied && apply.mutate(s.id)}
                  disabled={applied || apply.isPending || free <= 0}
                  variant={applied ? "secondary" : "primary"}
                  className="w-full justify-center"
                  size="sm"
                >
                  {applied ? "✓ Beworben" : free <= 0 ? "Ausgebucht" : "Jetzt bewerben"}
                </Button>
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
  const [note, setNote] = useState("");
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const { data: avails = [] } = useAvailability(monthStr);
  const setAvail = useSetAvailability();

  const prev = () => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); };

  const availByDay = new Map(avails.map((a) => [new Date(a.date).getDate(), a]));
  const { last, startDay } = getMonthDates(year, month);

  const handleSelect = async (type: string) => {
    if (!pickerDay) return;
    const date = `${year}-${String(month).padStart(2,"0")}-${String(pickerDay).padStart(2,"0")}`;
    await setAvail.mutateAsync({ date, type, note: note || undefined });
    setPickerDay(null);
    setNote("");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Tippe auf einen Tag und trage deine Verfügbarkeit ein.</p>
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
            const dot = avail ? AVAIL_TYPES.find((t) => t.value === avail.type)?.bg : null;
            const isToday = day === now.getDate() && month === now.getMonth()+1 && year === now.getFullYear();
            const isPast = new Date(year, month-1, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return (
              <button key={day} disabled={isPast}
                onClick={() => { setPickerDay(day); setNote(""); }}
                className={cn("aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors",
                  isPast ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100",
                  isToday ? "ring-2 ring-[#8B1A1A]" : "",
                  pickerDay === day ? "bg-gray-100" : "")}>
                <span className={isToday ? "font-bold text-[#8B1A1A]" : "text-gray-700"}>{day}</span>
                {dot && <div className={cn("w-1.5 h-1.5 rounded-full mt-0.5", dot)} />}
              </button>
            );
          })}
        </div>
      </div>

      {pickerDay && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <p className="font-medium text-gray-800">
            {new Date(year, month-1, pickerDay).toLocaleDateString("de-DE", { weekday:"long", day:"2-digit", month:"long" })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AVAIL_TYPES.map((t) => (
              <button key={t.value} onClick={() => handleSelect(t.value)}
                className={cn("py-3 rounded-xl text-sm font-medium border-2 transition-colors",
                  availByDay.get(pickerDay!)?.type === t.value
                    ? "border-current bg-gray-50"
                    : "border-gray-200 text-gray-700 hover:border-gray-300")}>
                <div className={cn("w-3 h-3 rounded-full mx-auto mb-1", t.bg)} />
                {t.label}
              </button>
            ))}
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30"
            placeholder="Notiz (optional)" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {AVAIL_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={cn("w-2.5 h-2.5 rounded-full", t.bg)} />
            {t.label}
          </div>
        ))}
      </div>
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
    { id: "plan",          label: "Mein Plan" },
    { id: "schichten",     label: "Schichtbörse" },
    { id: "verfuegbarkeit", label: "Verfügbarkeit" },
  ];

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Sub-Navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === t.id ? "bg-white text-[#8B1A1A] shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "plan"          && <MeinPlanTab />}
      {activeTab === "schichten"     && <SchichtboerseTab />}
      {activeTab === "verfuegbarkeit" && <VerfuegbarkeitTab />}
    </div>
  );
}
