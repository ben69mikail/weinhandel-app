import { useState } from "react";
import { useMyShifts } from "@/hooks/useApi";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

function getMonthDates(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0).getDate();
  const startDay = (first.getDay() + 6) % 7; // Mon=0
  return { last, startDay };
}

const STATUS_COLOR: Record<string, string> = { APPROVED: "green", ASSIGNED: "blue", APPLIED: "yellow", REJECTED: "red" };

export default function MyPlan() {
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
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Mein Schichtplan</h1>

      {/* Month nav */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-800">
            {new Date(year, month - 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </span>
          <button onClick={next} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: last }, (_, i) => i + 1).map((day) => {
            const shift = shiftByDay.get(day);
            const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
            const isSelected = selected === String(day);
            return (
              <button key={day} onClick={() => setSelected(shift ? String(day) : null)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors
                  ${isSelected ? "ring-2 ring-[#8B1A1A]" : ""}
                  ${isToday ? "font-bold" : ""}
                  ${shift ? "text-white" : isToday ? "bg-[#8B1A1A]/10 text-[#8B1A1A]" : "text-gray-700 hover:bg-gray-100"}`}
                style={shift ? { backgroundColor: shift.color } : {}}>
                <span>{day}</span>
                {shift && <span className="text-[9px] opacity-80">{shift.startTime}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected shift detail */}
      {selectedShift && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: selectedShift.color }}>
              {new Date(selectedShift.date).getDate()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{selectedShift.title}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {selectedShift.startTime}–{selectedShift.endTime}
              </p>
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

      {/* Shift list */}
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