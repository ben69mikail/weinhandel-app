import { useState } from "react";
import { useVacations, useCreateVacation, useDeleteVacation } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus } from "lucide-react";

const statusColor: Record<string, "yellow"|"green"|"red"> = { PENDING:"yellow", APPROVED:"green", REJECTED:"red" };
const statusLabel: Record<string, string> = { PENDING:"Ausstehend", APPROVED:"Genehmigt", REJECTED:"Abgelehnt" };
const typeLabel: Record<string, string> = { VACATION:"Urlaub", SICK:"Krankmeldung", SPECIAL:"Sonderurlaub" };

export default function MobileVacation() {
  const { data: requests = [] } = useVacations();
  const createVacation = useCreateVacation();
  const deleteVacation = useDeleteVacation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ startDate: "", endDate: "", type: "VACATION", note: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.startDate || !form.endDate) return setError("Bitte Datum auswählen");
    if (new Date(form.endDate) < new Date(form.startDate)) return setError("Enddatum vor Startdatum");
    try {
      await createVacation.mutateAsync(form);
      setShowForm(false);
      setForm({ startDate: "", endDate: "", type: "VACATION", note: "" });
    } catch { setError("Fehler beim Senden"); }
  };

  const days = (start: string, end: string) => Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Abwesenheiten</h1>
        <Button size="sm" onClick={() => setShowForm(true)} className="flex items-center gap-1">
          <Plus size={14} /> Neu
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Antrag stellen</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Art</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30">
                <option value="VACATION">Urlaub</option>
                <option value="SICK">Krankmeldung</option>
                <option value="SPECIAL">Sonderurlaub</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Von</label>
                <input type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bis</label>
                <input type="date" required value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notiz (optional)</label>
              <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2} placeholder="Für den Chef…"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 resize-none" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setError(""); }}>Abbrechen</Button>
              <Button type="submit" className="flex-1" disabled={createVacation.isPending}>Senden</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">Noch keine Anträge</div>
        ) : requests.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge label={typeLabel[r.type]} color="blue" />
                  <Badge label={statusLabel[r.status]} color={statusColor[r.status]} />
                </div>
                <p className="font-medium text-gray-900">
                  {new Date(r.startDate).toLocaleDateString("de-DE")} – {new Date(r.endDate).toLocaleDateString("de-DE")}
                  <span className="ml-1.5 text-sm text-gray-400">({days(r.startDate, r.endDate)} Tage)</span>
                </p>
                {r.note && <p className="text-sm text-gray-500 mt-0.5">„{r.note}"</p>}
                {r.adminNote && <p className="text-sm text-[#8B1A1A] mt-0.5">Chef: {r.adminNote}</p>}
              </div>
              {r.status === "PENDING" && (
                <button onClick={() => deleteVacation.mutate(r.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}