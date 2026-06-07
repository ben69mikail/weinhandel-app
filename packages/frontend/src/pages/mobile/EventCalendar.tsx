import { useEvents } from "@/hooks/useApi";

const TYPE_COLOR: Record<string,string> = { GENERAL:"bg-indigo-500", BIRTHDAY:"bg-pink-500", TASTING:"bg-[#8B1A1A]", CONCERT:"bg-purple-500", TEAM_EVENT:"bg-green-500", HOLIDAY:"bg-amber-500" };
const TYPE_LABEL: Record<string,string> = { GENERAL:"Allgemein", BIRTHDAY:"Geburtstag", TASTING:"Weinprobe", CONCERT:"Konzert", TEAM_EVENT:"Team-Event", HOLIDAY:"Feiertag" };

export default function EventCalendar() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
  const { data: events = [], isLoading } = useEvents(from, to);

  const grouped: Record<string, typeof events> = {};
  events.forEach((e) => {
    const key = new Date(e.date).toLocaleDateString("de-DE",{ weekday:"long", day:"2-digit", month:"long" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Eventkalender</h1>
      {isLoading && <p className="text-center text-gray-400 py-10">Lade…</p>}
      {!isLoading && events.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">Keine Events in den nächsten 3 Monaten</div>
      )}
      {Object.entries(grouped).map(([day, evs]) => (
        <div key={day}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{day}</p>
          <div className="space-y-2">
            {evs.map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
                <div className={`w-2 self-stretch rounded-full flex-shrink-0 ${TYPE_COLOR[ev.type] ?? "bg-gray-400"}`}/>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{ev.title}</p>
                  {ev.description && <p className="text-sm text-gray-500 mt-0.5">{ev.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">{TYPE_LABEL[ev.type]}{ev.endDate ? ` · bis ${new Date(ev.endDate).toLocaleDateString("de-DE")}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}