import { useAuthStore } from "@/store/auth";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LogOut, Lock, Bell } from "lucide-react";

export default function Profile() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { clearAuth(); navigate("/login"); };

  if (!user) return null;
  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Mein Profil</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
        <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="lg" />
        <div>
          <p className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex gap-2 mt-1">
            <Badge label={user.role === "ADMIN" ? "Admin" : "Mitarbeiter"} color={user.role === "ADMIN" ? "wine" : "blue"} />
            <Badge label={user.employeeType === "PARTTIME" ? "Teilzeit" : "Minijob"} color="gray" />
          </div>
        </div>
      </div>

      {user.skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Kompetenzen</p>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((s) => <Badge key={s} label={s} color="wine" />)}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50">
          <Lock size={18} className="text-gray-400" /> Passwort ändern
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50">
          <Bell size={18} className="text-gray-400" /> Push-Benachrichtigungen
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50">
          <LogOut size={18} /> Abmelden
        </button>
      </div>
    </div>
  );
}