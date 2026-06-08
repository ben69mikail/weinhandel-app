import { useUsers, useShifts, useAllAvailability } from "@/hooks/useApi";
import { Users, Calendar, Clock, AlertCircle } from "lucide-react";

function KPICard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Overview() {
  const { data: users = [] } = useUsers();
  const now = new Date();
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  const weekStr = `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: shifts = [] } = useShifts({ week: weekStr });
  const { data: allAvails = [] } = useAllAvailability(monthStr);

  const todayShifts = shifts.filter((s) => isSameDay(new Date(s.date), now));
  const parttime = users.filter((u) => u.employeeType === "PARTTIME").length;
  const minijob = users.filter((u) => u.employeeType === "MINIJOB").length;

  // Availability this week (next 7 days)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Today's available employees
  const todayAvails = allAvails.filter((a) => isSameDay(new Date(a.date), now) && a.type === "AVAILABLE");
  const todayUnavails = allAvails.filter((a) => isSameDay(new Date(a.date), now) && a.type === "UNAVAILABLE");

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Mitarbeiter gesamt" value={users.length} color="bg-[#8B1A1A]" />
        <KPICard icon={Calendar} label="Schichten heute" value={todayShifts.length} color="bg-blue-500" />
        <KPICard icon={Clock} label="Teilzeit" value={parttime} color="bg-amber-500" />
        <KPICard icon={AlertCircle} label="Minijobber" value={minijob} color="bg-purple-500" />
      </div>

      {/* Verfügbarkeit heute + diese Woche */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Verfügbarkeit heute */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#166534" }} />
            Verfügbarkeit heute
            <span className="text-xs font-normal text-gray-400 ml-auto">
              {now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
            </span>
          </h3>
          {todayAvails.length === 0 && todayUnavails.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">Noch keine Einträge für heute</p>
          ) : (
            <div className="space-y-2 mt-3">
              {todayAvails.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(20,83,45,0.08)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "#166534" }}>
                    {a.user.firstName[0]}{a.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.user.firstName} {a.user.lastName}</p>
                    {a.startTime && a.endTime && (
                      <p className="text-xs" style={{ color: "#166534" }}>{a.startTime} – {a.endTime}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-white px-2 py-0.5 rounded"
                    style={{ backgroundColor: "#166534" }}>Verfügbar</span>
                </div>
              ))}
              {todayUnavails.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-red-500">
                    {a.user.firstName[0]}{a.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.user.firstName} {a.user.lastName}</p>
                  </div>
                  <span className="text-xs font-semibold text-white px-2 py-0.5 rounded bg-red-500">Nicht da</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verfügbarkeit diese Woche */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Verfügbarkeit — nächste 7 Tage</h3>
          <div className="space-y-2">
            {weekDays.map((d, i) => {
              const dayAvails = allAvails.filter((a) => isSameDay(new Date(a.date), d) && a.type === "AVAILABLE");
              if (dayAvails.length === 0) return null;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="text-xs text-gray-400 w-16 shrink-0 pt-1">
                    {d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {dayAvails.map((a) => (
                      <span key={a.id} className="text-[11px] text-white px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "#166534" }}>
                        {a.user.firstName} {a.startTime ? `${a.startTime}–${a.endTime}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            {weekDays.every((d) => allAvails.filter((a) => isSameDay(new Date(a.date), d) && a.type === "AVAILABLE").length === 0) && (
              <p className="text-sm text-gray-400">Keine Verfügbarkeiten für diese Woche eingetragen</p>
            )}
          </div>
        </div>
      </div>

      {/* Schichten + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Schichten diese Woche</h3>
          {shifts.length === 0 ? (
            <p className="text-sm text-gray-400">Keine Schichten diese Woche geplant.</p>
          ) : (
            <div className="space-y-2">
              {shifts.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-gray-700 flex-1">{s.title}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })} · {s.startTime}–{s.endTime}
                  </span>
                  <span className="text-xs text-gray-400">{s.assignments.length}/{s.maxWorkers}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Team</h3>
          <div className="space-y-3">
            {users.slice(0, 6).map((u) => {
              const todayAvail = allAvails.find((a) => isSameDay(new Date(a.date), now) && a.userId === u.id);
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: todayAvail?.type === "AVAILABLE" ? "#166534" : todayAvail?.type === "UNAVAILABLE" ? "#ef4444" : "#8B1A1A" }}>
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400">{u.employeeType === "PARTTIME" ? "Teilzeit" : "Minijob"}{u.monthlyHours ? ` · ${u.monthlyHours} Std/Mo` : ""}</p>
                  </div>
                  {todayAvail && (
                    <span className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: todayAvail.type === "AVAILABLE" ? "#166534" : "#ef4444" }}>
                      {todayAvail.type === "AVAILABLE"
                        ? (todayAvail.startTime ? `${todayAvail.startTime}–${todayAvail.endTime}` : "Frei")
                        : "Nicht da"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
