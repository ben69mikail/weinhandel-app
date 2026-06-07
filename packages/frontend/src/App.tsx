import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import { AdminLayout } from "./layouts/AdminLayout";
import { MobileLayout } from "./layouts/MobileLayout";
import Overview from "./pages/admin/Overview";
import Plan from "./pages/admin/Plan";
import Employees from "./pages/admin/Employees";
import TimeTracking from "./pages/admin/TimeTracking";
import Absences from "./pages/admin/Absences";
import Checklists from "./pages/admin/Checklists";
import Reporting from "./pages/admin/Reporting";
import Documents from "./pages/admin/Documents";
import Payroll from "./pages/admin/Payroll";
import AdminSettings from "./pages/admin/AdminSettings";
import MobileDashboard from "./pages/mobile/Dashboard";
import MyPlan from "./pages/mobile/MyPlan";
import OpenShifts from "./pages/mobile/OpenShifts";
import AvailabilityPage from "./pages/mobile/Availability";
import MobileVacation from "./pages/mobile/Vacation";
import EventCalendar from "./pages/mobile/EventCalendar";
import Profile from "./pages/mobile/Profile";
import Resources from "./pages/mobile/Resources";
import { RequireAuth, RequireAdmin, RedirectIfAuth } from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<RedirectIfAuth />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Mobile employee routes */}
          <Route element={<RequireAuth />}>
            <Route element={<MobileLayout />}>
              <Route path="/" element={<MobileDashboard />} />
              <Route path="/plan" element={<MyPlan />} />
              <Route path="/shifts/open" element={<OpenShifts />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/vacation" element={<MobileVacation />} />
              <Route path="/events" element={<EventCalendar />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Overview />} />
              <Route path="/admin/plan" element={<Plan />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/timetracking" element={<TimeTracking />} />
              <Route path="/admin/absences" element={<Absences />} />
              <Route path="/admin/checklists" element={<Checklists />} />
              <Route path="/admin/reporting" element={<Reporting />} />
              <Route path="/admin/documents" element={<Documents />} />
              <Route path="/admin/payroll" element={<Payroll />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}