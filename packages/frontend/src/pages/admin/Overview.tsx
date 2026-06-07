import { useUsers, useShifts } from "@/hooks/useApi";
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

export default function Overview() {
  const { data: users = [] } = useUsers();
  const now = new Date();
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  const { data: shifts = [] } = useShifts({ week: `${now.getFullYear()}-W${String(week).padStart(2, "0")}` });

  const todayShifts = shifts.filter((s) => new Date(s.date).toDateString() === now.toDateString());
  const parttime = users.filter((u) => u.employeeType === "PARTTIME").length;
  const minijob = users.filter((u) => u.employeeType === "MINIJOB").length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Mitarbeiter gesamt" value={users.length} color="bg-[#8B1A1A]" />
        <KPICard icon={Calendar} label="Schichten heute" value={todayShifts.length} color="bg-blue-500" />
        <KPICard icon={Clock} label="Teilzeit" value={parttime} color="bg-amber-500" />
        <KPICard icon={AlertCircle} label="Minijobber" value={minijob} color="bg-purple-500" />
      </div>

      {/* This week */}
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
            {users.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#8B1A1A]/10 flex items-center justify-center text-xs font-semibold text-[#8B1A1A]">
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-400">{u.employeeType === "PARTTIME" ? "Teilzeit" : "Minijob"}{u.monthlyHours ? ` · ${u.monthlyHours} Std/Mo` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}