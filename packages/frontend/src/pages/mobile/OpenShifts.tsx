import { useOpenShifts, useApplyShift } from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";
import { Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const TYPE_LABELS: Record<string, string> = { REGULAR:"Regulär",EVENT:"Event",TASTING:"Verkostung",CONCERT:"Konzert",HOLIDAY_COVERAGE:"Notfall" };

export default function OpenShifts() {
  const { data: shifts = [], isLoading } = useOpenShifts();
  const apply = useApplyShift();
  const user = useAuthStore((s) => s.user);

  const hasApplied = (shiftId: string) =>
    shifts.find((s) => s.id === shiftId)?.assignments.some((a) => a.userId === user?.id);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Schichtbörse</h1>
        <p className="text-sm text-gray-500">{shifts.length} offene Schichten</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-gray-500">Keine offenen Schichten</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((s) => {
            const applied = hasApplied(s.id);
            const free = s.maxWorkers - s.assignments.length;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-1.5" style={{ backgroundColor: s.color }} />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{s.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(s.date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
                      </p>
                    </div>
                    <Badge label={TYPE_LABELS[s.type] ?? s.type} color="wine" />
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Clock size={14} className="text-gray-400" />{s.startTime}–{s.endTime}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-gray-400" />{s.location}</span>
                    <span className="flex items-center gap-1"><Users size={14} className="text-gray-400" />{free} Platz{free !== 1 ? "plätze" : ""} frei</span>
                  </div>

                  {s.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.requiredSkills.map((sk) => <Badge key={sk} label={sk} color="gray" />)}
                    </div>
                  )}

                  <Button
                    onClick={() => !applied && apply.mutate(s.id)}
                    disabled={applied || apply.isPending || free <= 0}
                    variant={applied ? "secondary" : "primary"}
                    className="w-full justify-center"
                    size="sm"
                  >
                    {applied ? "✓ Beworben" : free <= 0 ? "Ausgebucht" : "Jetzt bewerben"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}