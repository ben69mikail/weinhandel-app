import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useCurrentTimeEntry, useClockIn, useClockOut, useBreakStart, useBreakEnd, useShifts } from "@/hooks/useApi";
import { Bell } from "lucide-react";

function useTimer(start: string | undefined) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!start) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(start).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MobileDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: entry, isLoading } = useCurrentTimeEntry();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const breakStart = useBreakStart();
  const breakEnd = useBreakEnd();
  const timer = useTimer(entry?.clockIn);
  const breakTimer = useTimer(entry?.breakStart && !entry?.breakEnd ? entry.breakStart : undefined);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const week = (() => {
    const d = new Date(now); d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const w = new Date(d.getFullYear(), 0, 4);
    return Math.round(((d.getTime() - w.getTime()) / 86400000 - 3 + ((w.getDay() + 6) % 7)) / 7) + 1;
  })();
  const { data: shifts = [] } = useShifts({ week: `${now.getFullYear()}-W${String(week).padStart(2,"0")}` });
  const nextShift = shifts
    .filter((s) => new Date(s.date) >= now && s.assignments.some((a) => a.userId === user?.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const isClockedIn = !!entry && !entry.clockOut;
  const onBreak = isClockedIn && !!entry.breakStart && !entry.breakEnd;
  const greeting = now.getHours() < 12 ? "Guten Morgen" : now.getHours() < 18 ? "Guten Tag" : "Guten Abend";

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{greeting},</p>
          <h1 className="text-xl font-bold text-gray-900">{user?.firstName} 👋</h1>
        </div>
        <button className="relative p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Bell size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Clock In/Out */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
        {isLoading ? (
          <div className="py-8 text-gray-400">Laden...</div>
        ) : (
          <>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {!isClockedIn ? "Bereit?" : onBreak ? "Pause läuft" : "Eingestempelt seit"}
            </p>
            <p className="text-4xl font-bold text-gray-900 mb-5 tabular-nums">
              {!isClockedIn ? new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : onBreak ? breakTimer : timer}
            </p>

            {/* Main button */}
            <button
              onClick={() => isClockedIn ? clockOut.mutate() : clockIn.mutate(undefined)}
              disabled={clockIn.isPending || clockOut.isPending}
              className={`w-32 h-32 rounded-full text-white font-bold text-lg shadow-lg transition-all active:scale-95 mx-auto flex items-center justify-center
                ${isClockedIn ? "bg-gray-800 hover:bg-gray-700" : "bg-[#8B1A1A] hover:bg-[#6B1414]"}`}
            >
              {clockIn.isPending || clockOut.isPending ? "..." : isClockedIn ? "Aus­stempeln" : "Ein­stempeln"}
            </button>

            {/* Break button */}
            {isClockedIn && (
              <button
                onClick={() => onBreak ? breakEnd.mutate() : breakStart.mutate()}
                disabled={breakStart.isPending || breakEnd.isPending}
                className={`mt-4 px-6 py-2 rounded-xl text-sm font-medium transition-colors
                  ${onBreak ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {onBreak ? "☕ Pause beenden" : "☕ Pause starten"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Next shift */}
      {nextShift && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Nächste Schicht</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: nextShift.color }}>
              {new Date(nextShift.date).getDate()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{nextShift.title}</p>
              <p className="text-sm text-gray-500">
                {new Date(nextShift.date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit" })} · {nextShift.startTime}–{nextShift.endTime}
              </p>
            </div>
          </div>
          {nextShift.assignments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Kollegen: {nextShift.assignments.map((a) => a.user.firstName).join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {/* Date card */}
      <div className="bg-[#8B1A1A] rounded-2xl p-4 text-white">
        <p className="text-sm opacity-80">{now.toLocaleDateString("de-DE", { weekday: "long" })}</p>
        <p className="text-2xl font-bold">
          {now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <p className="text-sm opacity-80 mt-1">KW {week}</p>
      </div>
    </div>
  );
}