import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LogOut, Lock, Bell, X, Check } from "lucide-react";
import { pushStatus, subscribePush, unsubscribePush, sendTestPush } from "@/lib/push";

export default function Profile() {
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { clearAuth(); navigate("/login"); };

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  const [pushOpen, setPushOpen] = useState(false);
  const [pushState, setPushState] = useState<"unsupported" | "denied" | "subscribed" | "ready" | "loading">("loading");
  const [pushMsg, setPushMsg] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  const openPush = async () => {
    setPushOpen(true); setPushMsg("");
    setPushState(await pushStatus());
  };
  const enablePush = async () => {
    setPushBusy(true); setPushMsg("");
    try { await subscribePush(); setPushState("subscribed"); setPushMsg("Benachrichtigungen aktiviert."); }
    catch (e) { setPushMsg((e as Error).message || "Aktivieren fehlgeschlagen"); }
    finally { setPushBusy(false); }
  };
  const disablePush = async () => {
    setPushBusy(true); setPushMsg("");
    try { await unsubscribePush(); setPushState("ready"); setPushMsg("Benachrichtigungen deaktiviert."); }
    catch { setPushMsg("Deaktivieren fehlgeschlagen"); }
    finally { setPushBusy(false); }
  };
  const testPush = async () => {
    setPushBusy(true); setPushMsg("");
    try { await sendTestPush(); setPushMsg("Test-Benachrichtigung gesendet."); }
    catch { setPushMsg("Test fehlgeschlagen"); }
    finally { setPushBusy(false); }
  };

  const changePassword = async () => {
    setPwError("");
    if (pw.next.length < 8) { setPwError("Neues Passwort mind. 8 Zeichen"); return; }
    if (pw.next !== pw.confirm) { setPwError("Passwörter stimmen nicht überein"); return; }
    setPwBusy(true);
    try {
      // Bewusst raw fetch statt api-Instanz: deren 401-Interceptor würde bei
      // falschem aktuellem Passwort ausloggen.
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? localStorage.getItem("token") ?? ""}` },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      if (res.status === 401) { setPwError("Aktuelles Passwort ist falsch"); return; }
      if (!res.ok) { setPwError("Ändern fehlgeschlagen"); return; }
      const data = await res.json();
      // Neues Token übernehmen (das alte wurde serverseitig widerrufen).
      if (data.token && user) setAuth(user, data.token);
      setPwOk(true);
      setPw({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPwOpen(false); setPwOk(false); }, 1400);
    } catch {
      setPwError("Netzwerkfehler");
    } finally {
      setPwBusy(false);
    }
  };

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
        <button onClick={() => { setPwOpen(true); setPwError(""); setPwOk(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50">
          <Lock size={18} className="text-gray-400" /> Passwort ändern
        </button>
        <button onClick={openPush} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50">
          <Bell size={18} className="text-gray-400" /> Push-Benachrichtigungen
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50">
          <LogOut size={18} /> Abmelden
        </button>
      </div>

      {/* Passwort-ändern-Modal */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Passwort ändern</h3>
              <button onClick={() => setPwOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            {pwOk ? (
              <div className="flex flex-col items-center gap-2 py-4 text-green-600">
                <Check size={32} /> <p className="text-sm font-medium">Passwort geändert</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="password" placeholder="Aktuelles Passwort" value={pw.current}
                  onChange={(e) => setPw((f) => ({ ...f, current: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                <input type="password" placeholder="Neues Passwort (mind. 8 Zeichen)" value={pw.next}
                  onChange={(e) => setPw((f) => ({ ...f, next: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                <input type="password" placeholder="Neues Passwort bestätigen" value={pw.confirm}
                  onChange={(e) => setPw((f) => ({ ...f, confirm: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                <button onClick={changePassword} disabled={pwBusy || !pw.current || !pw.next}
                  className="w-full py-2 bg-[#8B1A1A] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {pwBusy ? "Ändere…" : "Passwort ändern"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Push-Benachrichtigungen-Modal */}
      {pushOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Push-Benachrichtigungen</h3>
              <button onClick={() => setPushOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Werde benachrichtigt bei neuen Schichten und wichtigen Infos.</p>

            {pushState === "loading" && <p className="text-sm text-gray-400">Lädt…</p>}
            {pushState === "unsupported" && <p className="text-sm text-amber-600">Dein Browser unterstützt keine Push-Benachrichtigungen.</p>}
            {pushState === "denied" && <p className="text-sm text-amber-600">Benachrichtigungen sind im Browser blockiert. Bitte in den Website-Einstellungen erlauben.</p>}

            {(pushState === "ready" || pushState === "subscribed") && (
              <div className="space-y-2">
                {pushState === "ready" ? (
                  <button onClick={enablePush} disabled={pushBusy}
                    className="w-full py-2 bg-[#8B1A1A] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {pushBusy ? "Aktiviere…" : "Aktivieren"}
                  </button>
                ) : (
                  <>
                    <button onClick={testPush} disabled={pushBusy}
                      className="w-full py-2 bg-[#8B1A1A] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                      {pushBusy ? "…" : "Test-Benachrichtigung senden"}
                    </button>
                    <button onClick={disablePush} disabled={pushBusy}
                      className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50">
                      Deaktivieren
                    </button>
                  </>
                )}
              </div>
            )}
            {pushMsg && <p className="text-sm text-gray-600 mt-3">{pushMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
