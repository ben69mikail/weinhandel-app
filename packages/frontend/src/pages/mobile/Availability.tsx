import { useState } from "react";
import { useAvailability, useSetAvailability } from "@/hooks/useApi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AvailType = "AVAILABLE" | "UNAVAILABLE" | "PREFERRED" | "PARTIAL";

const TYPES: { value: AvailType; label: string; color: string; bg: string }[] = [
  { value: "AVAILABLE",   label: "Verfügbar",   color: "text-green-700",  bg: "bg-green-500" },
  { value: "PREFERRED",   label: "Bevorzugt",   color: "text-blue-700",   bg: "bg-blue-500" },
  { value: "PARTIAL",     label: "Teilweise",   color: "text-amber-700",  bg: "bg-amber-400" },
  { value: "UNAVAILABLE", label: "Nicht da",    color: "text-red-700",    bg: "bg-red-500" },
];

function getMonthDates(year: number, month: number) {
  return { last: new Date(year, month, 0).getDate(), startDay: (new Date(year, month - 1, 1).getDay() + 6) % 7 };
}

export default function AvailabilityPage() {
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

  const getDotColor = (day: number) => {
    const a = availByDay.get(day);
    if (!a) return null;
    return TYPES.find((t) => t.value === a.type)?.bg ?? null;
  };

  const handleSelect = async (type: AvailType) => {
    if (!pickerDay) return;
    const date = `${year}-${String(month).padStart(2,"0")}-${String(pickerDay).padStart(2,"0")}`;
    await setAvail.mutateAsync({ date, type, note: note || undefined });
    setPickerDay(null);
    setNote("");
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Verfügbarkeit</h1>

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
            const dot = getDotColor(day);
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

      {/* Picker */}
      {pickerDay && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <p className="font-medium text-gray-800">
            {new Date(year, month-1, pickerDay).toLocaleDateString("de-DE", { weekday:"long", day:"2-digit", month:"long" })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => handleSelect(t.value)}
                className={cn("py-3 rounded-xl text-sm font-medium border-2 transition-colors",
                  availByDay.get(pickerDay)?.type === t.value
                    ? `border-current ${t.color} bg-gray-50`
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={cn("w-2.5 h-2.5 rounded-full", t.bg)} />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}