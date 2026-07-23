import { NotificationBell } from "@/components/admin/NotificationBell";
import { useTheme } from "@/store/theme";
import { Moon, Sun, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";
import { useNavigate } from "react-router-dom";

interface TopBarProps { title: string }

export function TopBar({ title }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
      <h1 className="text-lg font-semibold text-gray-800 flex-1">{title}</h1>
      <div className="relative hidden md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 w-56" placeholder="Suchen..." />
      </div>
      <button onClick={toggle} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
      <NotificationBell />
      {user && (
        <div className="flex items-center gap-2">
          {isAdmin && (
            // Ansicht-Umschalter: aktuell Admin (links). Klick → Mitarbeiter-Ansicht.
            <button
              onClick={() => navigate("/")}
              title="Zur Mitarbeiter-Ansicht wechseln"
              className="hidden sm:flex items-center gap-2 mr-1 px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              <span className="text-[11px] font-semibold text-[#8B1A1A]">Admin</span>
              <span className="relative w-9 h-5 bg-[#8B1A1A] rounded-full transition-colors">
                <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform" />
              </span>
              <span className="text-[11px] font-medium text-gray-400">Mitarbeiter</span>
            </button>
          )}
          <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" />
          <span className="text-sm font-medium text-gray-700 hidden md:block">{user.firstName}</span>
        </div>
      )}
    </header>
  );
}