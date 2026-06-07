import { NotificationBell } from "@/components/admin/NotificationBell";
import { useTheme } from "@/store/theme";
import { Moon, Sun, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";

interface TopBarProps { title: string }

export function TopBar({ title }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const { dark, toggle } = useTheme();
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
          <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" />
          <span className="text-sm font-medium text-gray-700 hidden md:block">{user.firstName}</span>
        </div>
      )}
    </header>
  );
}