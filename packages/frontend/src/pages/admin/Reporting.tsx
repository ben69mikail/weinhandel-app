import { useState } from "react";
import { useMonthlyReport } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Download, TrendingUp, Clock, Users } from "lucide-react";
import { useAuthStore } from "@/store/auth";

function fmtMin(m: number) {
  if (!m) return "0h 00m";
  const h = Math.floor(Math.abs(m) / 60);
  const min = Math.round(Math.abs(m) % 60);
  const sign = m < 0 ? "-" : "";
  return `${sign}${h}h ${String(min).padStart(2,"0")}m`;
}
function diffClass(diff: number) {
  if (diff > 0) return "text-green-600";
  if (diff < 0) return "text-red-600";
  return "text-gray-500";
}

export default function Reporting() {
  const { token } = useAuthStore();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [exporting, setExporting] = useState(false);

  const { data: report = [], isLoading } = useMonthlyReport(month);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/reporting/export-datev?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DATEV_${month}_Weinhandel.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  };

  const entries = report;
  const totalSoll = entries.reduce((s, e) => s + (e.sollMinutes ?? 0), 0);
  const totalIst = entries.reduce((s, e) => s + (e.netMinutes ?? 0), 0);
  const totalDiff = totalIst - totalSoll;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
        <Button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Download size={16} />
          {exporting ? "Exportiere…" : "DATEV CSV exportieren"}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Mitarbeiter", value: entries.length, icon:<Users size={18}/>, color:"text-blue-600 bg-blue-50" },
          { label:"Soll-Stunden", value: fmtMin(totalSoll), icon:<Clock size={18}/>, color:"text-gray-600 bg-gray-100" },
          { label:"Ist-Stunden", value: fmtMin(totalIst), icon:<Clock size={18}/>, color:"text-[#8B1A1A] bg-[#8B1A1A]/10" },
          { label:"Differenz", value: fmtMin(totalDiff), icon:<TrendingUp size={18}/>, color: totalDiff >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>{k.icon}</div>
            <p className="text-xs text-gray-500 mb-0.5">{k.label}</p>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Lade…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mitarbeiter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Schichten</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Soll</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ist</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Differenz</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Urlaub</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Keine Daten für {month}</td></tr>
              ) : entries.map((e) => {
                const diff = (e.netMinutes ?? 0) - (e.sollMinutes ?? 0);
                return (
                  <tr key={e.user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.user.firstName} {e.user.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{e.days ?? 0}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{fmtMin(e.sollMinutes ?? 0)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{fmtMin(e.netMinutes ?? 0)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${diffClass(diff)}`}>{diff >= 0 ? "+" : ""}{fmtMin(diff)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{0}d</td>
                  </tr>
                );
              })}
            </tbody>
            {entries.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-gray-700">Gesamt</td>
                  <td />
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{fmtMin(totalSoll)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">{fmtMin(totalIst)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${diffClass(totalDiff)}`}>{totalDiff >= 0 ? "+" : ""}{fmtMin(totalDiff)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}