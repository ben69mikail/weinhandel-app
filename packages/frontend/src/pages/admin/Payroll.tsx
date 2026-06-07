import { useState } from "react";
import { useTipCalculations, useCalculateTip, useUsers } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Plus, Trash2, Euro } from "lucide-react";

export default function Payroll() {
  const { data: calcs = [] } = useTipCalculations();
  const { data: users = [] } = useUsers();
  const calcTip = useCalculateTip();

  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [total, setTotal] = useState("");
  const [workers, setWorkers] = useState<{ userId:string; hoursWorked:number }[]>([]);
  const [result, setResult] = useState<typeof calcs[number] | null>(null);

  const addWorker = () => setWorkers((w) => [...w, { userId:"", hoursWorked:8 }]);
  const removeWorker = (i:number) => setWorkers((w) => w.filter((_,idx) => idx!==i));

  const handleCalc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!total || workers.length === 0 || workers.some((w) => !w.userId)) return;
    const res = await calcTip.mutateAsync({ shiftDate:date, totalTip:Number(total), workers });
    setResult(res);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calculator */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Euro size={16}/> Trinkgeld berechnen</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <form onSubmit={handleCalc} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gesamt (€)</label>
                <input type="number" step="0.01" min="0" required value={total} onChange={(e) => setTotal(e.target.value)} placeholder="z.B. 87.50" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"/>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Mitarbeiter</label>
                <button type="button" onClick={addWorker} className="text-xs text-[#8B1A1A] font-medium flex items-center gap-1"><Plus size={12}/> Hinzufügen</button>
              </div>
              {workers.map((w, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={w.userId} onChange={(e) => setWorkers((ws) => ws.map((x,idx) => idx===i ? { ...x, userId:e.target.value } : x))} className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none" required>
                    <option value="">Mitarbeiter…</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                  <input type="number" step="0.5" min="0.5" value={w.hoursWorked} onChange={(e) => setWorkers((ws) => ws.map((x,idx) => idx===i ? { ...x, hoursWorked:Number(e.target.value) } : x))} className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"/>
                  <span className="text-xs text-gray-400">h</span>
                  <button type="button" onClick={() => removeWorker(i)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                </div>
              ))}
              {workers.length === 0 && <p className="text-sm text-gray-400">Noch niemand hinzugefügt</p>}
            </div>
            <Button type="submit" className="w-full" disabled={calcTip.isPending || !total || workers.length===0}>Berechnen & Speichern</Button>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Ergebnis — {result.totalTip.toFixed(2)} €</h3>
            <div className="space-y-2">
              {result.entries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <Avatar name={`${e.user.firstName} ${e.user.lastName}`} size="sm"/>
                  <span className="flex-1 text-sm text-gray-700">{e.user.firstName} {e.user.lastName}</span>
                  <span className="text-sm text-gray-400">{e.hoursWorked}h</span>
                  <span className="font-semibold text-[#8B1A1A]">{e.tipAmount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Letzte Berechnungen</h2>
        <div className="space-y-3">
          {calcs.length === 0 && <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Noch keine Berechnungen</div>}
          {calcs.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{new Date(c.shiftDate).toLocaleDateString("de-DE")}</span>
                <span className="font-bold text-[#8B1A1A]">{c.totalTip.toFixed(2)} €</span>
              </div>
              <div className="space-y-1">
                {c.entries.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm text-gray-600">
                    <span>{e.user.firstName} {e.user.lastName} ({e.hoursWorked}h)</span>
                    <span className="font-medium">{e.tipAmount.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}