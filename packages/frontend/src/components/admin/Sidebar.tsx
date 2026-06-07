import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Calendar, Clock, UmbrellaOff, CheckSquare,
  BarChart2, Users, FileText, CreditCard, Settings, LogOut, Wine
} from "lucide-react";

const nav = [
  { to: "/admin", icon: LayoutDashboard, label: "Übersicht", end: true },
  { to: "/admin/plan", icon: Calendar, label: "Plan" },
  { to: "/admin/timetracking", icon: Clock, label: "Arbeitszeiten" },
  { to: "/admin/absences", icon: UmbrellaOff, label: "Abwesenheiten" },
  { to: "/admin/checklists", icon: CheckSquare, label: "Checklisten" },
  { to: "/admin/reporting", icon: BarChart2, label: "Reporting" },
  { to: "/admin/employees", icon: Users, label: "Mitarbeiter" },
  { to: "/admin/documents", icon: FileText, label: "Dokumente" },
  { to: "/admin/payroll", icon: CreditCard, label: "Payroll / DATEV" },
  { to: "/admin/settings", icon: Settings, label: "Einstellungen" },
];

interface SidebarProps { collapsed: boolean; onToggle: () => void }

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  return (
    <aside className={cn("h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0", collapsed ? "w-16" : "w-60")}>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 gap-3 cursor-pointer" onClick={onToggle}>
        <div className="w-8 h-8 bg-[#8B1A1A] rounded-lg flex items-center justify-center shrink-0">
          <Wine size={16} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-[#8B1A1A] truncate">Weinhandel</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn("flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-[#8B1A1A]/10 text-[#8B1A1A] font-medium" : "text-gray-600 hover:bg-gray-100")
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 mx-2 mb-3 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut size={18} className="shrink-0" />
        {!collapsed && <span>Abmelden</span>}
      </button>
    </aside>
  );
}