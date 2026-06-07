import { useState } from "react";
import { useVacations, useUpdateVacation, useDeleteVacation } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Check, X, Trash2 } from "lucide-react";

const statusColor: Record<string, "yellow"|"green"|"red"> = { PENDING:"yellow", APPROVED:"green", REJECTED:"red" };
const statusLabel: Record<string, string> = { PENDING:"Ausstehend", APPROVED:"Genehmigt", REJECTED:"Abgelehnt" };
const typeLabel: Record<string, string> = { VACATION:"Urlaub", SICK:"Krank", SPECIAL:"Sonderurlaub" };

export default function Absences() {
  const { data: requests = [], isLoading } = useVacations();
  const updateVacation = useUpdateVacation();
  const deleteVacation = useDeleteVacation();
  const [filter, setFilter] = useState<"ALL"|"PENDING"|"APPROVED"|"REJECTED">("PENDING");
  const [adminNote, setAdminNote] = useState<Record<string,string>>({});

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  const handleDecision = async (id: string, status: "APPROVED"|"REJECTED") => {
    await updateVacation.mutateAsync({ id, status, adminNote: adminNote[id] ?? "" });
  };

  const days = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(ms / 86400000) + 1;
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {(["PENDING","ALL","APPROVED","REJECTED"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter===f ? "bg-[#8B1A1A] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {f==="ALL"?"Alle":statusLabel[f]} {f!=="ALL" && <span className="ml-1 text-xs opacity-70">{requests.filter(r=>r.status===f).length}</span>}
          </button>
        ))}
      </div>

      {isLoading ? <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Lade…</div> : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Keine Anfragen</div>
          )}
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <Avatar name={`${r.user.firstName} ${r.user.lastName}`} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{r.user.firstName} {r.user.lastName}</span>
                    <Badge label={typeLabel[r.type]} color="blue" />
                    <Badge label={statusLabel[r.status]} color={statusColor[r.status]} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(r.startDate).toLocaleDateString("de-DE")} – {new Date(r.endDate).toLocaleDateString("de-DE")}
                    <span className="ml-2 text-gray-400">({days(r.startDate, r.endDate)} Tage)</span>
                  </p>
                  {r.note && <p className="text-sm text-gray-500 mt-1">„{r.note}"</p>}
                  {r.adminNote && <p className="text-xs text-gray-400 mt-1">Admin: {r.adminNote}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {r.status === "PENDING" && (<>
                    <Button size="sm" variant="primary" onClick={() => handleDecision(r.id, "APPROVED")}
                      disabled={updateVacation.isPending} className="flex items-center gap-1">
                      <Check size={14} /> Genehmigen
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDecision(r.id, "REJECTED")}
                      disabled={updateVacation.isPending} className="flex items-center gap-1">
                      <X size={14} /> Ablehnen
                    </Button>
                  </>)}
                  <button onClick={() => deleteVacation.mutate(r.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {r.status === "PENDING" && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <input value={adminNote[r.id] ?? ""} onChange={(e) => setAdminNote((a) => ({ ...a, [r.id]: e.target.value }))}
                    placeholder="Notiz für Mitarbeiter (optional)…"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}