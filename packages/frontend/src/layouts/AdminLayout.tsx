import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";

const titles: Record<string, string> = {
  "/admin": "Übersicht",
  "/admin/plan": "Schichtplanung",
  "/admin/timetracking": "Arbeitszeiten",
  "/admin/absences": "Abwesenheiten",
  "/admin/checklists": "Checklisten",
  "/admin/reporting": "Reporting",
  "/admin/employees": "Mitarbeiter",
  "/admin/documents": "Dokumente",
  "/admin/payroll": "Payroll / DATEV",
  "/admin/settings": "Einstellungen",
};

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] ?? "Admin";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}