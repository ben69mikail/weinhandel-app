import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications, useMarkAllRead, useMarkRead } from "@/hooks/useApi";

export function NotificationBell() {
  const { data: notifs = [] } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
        <Bell size={20}/>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#8B1A1A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Benachrichtigungen</span>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="text-xs text-[#8B1A1A] font-medium hover:underline">Alle lesen</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Keine Benachrichtigungen</p>
            ) : notifs.map((n) => (
              <button key={n.id} onClick={() => !n.isRead && markOne.mutate(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-[#8B1A1A]/5" : ""}`}>
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#8B1A1A] flex-shrink-0 mt-1.5"/>}
                  {n.isRead && <span className="w-2 h-2 flex-shrink-0"/>}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString("de-DE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}