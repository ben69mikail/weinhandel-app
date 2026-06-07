import { Outlet, NavLink } from "react-router-dom";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { Home, Calendar, Umbrella, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/plan", icon: Calendar, label: "Plan" },
  { to: "/vacation", icon: Umbrella, label: "Urlaub" },
  { to: "/resources", icon: BookOpen, label: "Info" },
  { to: "/profile", icon: User, label: "Profil" },
];

export function MobileLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9F5F0]">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <PwaInstallPrompt />
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40">
        <div className="flex">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) =>
              cn("flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors",
                isActive ? "text-[#8B1A1A]" : "text-gray-400")
            }>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}