import { useState } from "react";
import { useActiveEntries, useTimeEntries, useCorrectTimeEntry, useUsers } from "@/hooks/useApi";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Clock, Pencil, X } from "lucide-react";

function fmtMin(m: number) {
  const h = Math.floor(Math.abs(m) / 60);
  const min = Math.round(Math.abs(m) % 60);
  const sign = m < 0 ? "-" : "";
  return `${sign}${h}h ${String(min).padStart(2,"0")}m`;
}
function elapsed(clockIn: string) {
  const ms = Date.now() - new Date(clockIn).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2,"0")}m`;
}

export default function TimeTracking() {
  const now = new Date();
  const [tab, setTab] = useState<"live"|"month">("live");
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [editEntry, setEditEntry] = useState<{id:string;clockIn:string;clockOut:string;breakMinutes:number;note:string}|null>(null);

  const { data: active = [] } = useActiveEntries();
  const { data: users = [] } = useUsers();
  const { data: entries = [] } = useTimeEntries({ userId: selectedUser || undefined, month });
  const correct = useCorrectTimeEntry();

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry) return;
    await correct.mutateAsync({ id: editEntry.id, clockIn: editEntry.clockIn, clockOut: editEntry.clockOut, breakMinutes: editEntry.breakMinutes, note: editEntry.note });
    setEditEntry(null);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {[["live","🔴 Live"],["month","📊 Monat"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v as "live"|"month")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab===v ? "bg-[#8B1A1A] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* LIVE TAB */}
      {tab === "live" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{active.length} Mitarbeiter gerade eingestempelt</p>
          {active.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Niemand eingestempelt</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {active.map((e) => (
                <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={`${e.user.firstName} ${e.user.lastName}`} src={e.user.avatarUrl} size="md" />
                    <div>
                      <p className="font-medium text-gray-900">{e.user.firstName} {e.user.lastName}</p>
                      <p className="text-xs text-gray-400">seit {new Date(e.clockIn).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-mono text-gray-600">{elapsed(e.clockIn)}</span>
                    </div>
                  </div>
                  {e.breakStart && !e.breakEnd && (
                    <Badge label="☕ Pause" color="yellow" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MONTH TAB */}
      {tab === "month" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30">
              <option value="">Alle Mitarbeiter</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Datum</th>
                  {!selectedUser && <th className="text-left px-4 py-3 font-medium text-gray-600">Mitarbeiter</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Einstempel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ausstempel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pause</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Netto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Keine Einträge</td></tr>
                ) : entries.map((e) => {
                  const u = users.find((u) => u.id === e.userId);
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(e.clockIn).toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"})}</td>
                      {!selectedUser && <td className="px-4 py-3">{u ? `${u.firstName} ${u.lastName}` : "–"}</td>}
                      <td className="px-4 py-3 font-mono text-sm">{new Date(e.clockIn).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}</td>
                      <td className="px-4 py-3 font-mono text-sm">{e.clockOut ? new Date(e.clockOut).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}) : <Badge label="aktiv" color="green" />}</td>
                      <td className="px-4 py-3">{e.breakMinutes}min {e.autoBreak && <Badge label="auto" color="yellow" />}</td>
                      <td className="px-4 py-3 font-medium">{e.netMinutes ? fmtMin(e.netMinutes) : "–"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditEntry({
                          id: e.id,
                          clockIn: new Date(e.clockIn).toISOString().slice(0,16),
                          clockOut: e.clockOut ? new Date(e.clockOut).toISOString().slice(0,16) : "",
                          breakMinutes: e.breakMinutes,
                          note: e.note ?? "",
                        })} className="p-1.5 text-gray-400 hover:text-[#8B1A1A] hover:bg-[#8B1A1A]/10 rounded-lg">
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Clock size={18} /> Eintrag korrigieren</h2>
              <button onClick={() => setEditEntry(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCorrect} className="space-y-4">
              {[["Einstempel", "clockIn"], ["Ausstempel", "clockOut"]].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input type="datetime-local" value={(editEntry as Record<string, unknown>)[key] as string ?? ""}
                    onChange={(ev) => setEditEntry((f) => f ? { ...f, [key]: ev.target.value } : f)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pausenminuten</label>
                <input type="number" min={0} value={editEntry.breakMinutes}
                  onChange={(e) => setEditEntry((f) => f ? { ...f, breakMinutes: Number(e.target.value) } : f)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notiz</label>
                <input value={editEntry.note} onChange={(e) => setEditEntry((f) => f ? { ...f, note: e.target.value } : f)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditEntry(null)}>Abbrechen</Button>
                <Button type="submit" className="flex-1" disabled={correct.isPending}>Speichern</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}