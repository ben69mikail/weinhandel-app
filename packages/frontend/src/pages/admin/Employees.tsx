import { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useGrantTempAdmin, useRevokeAdmin, User } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Plus, Pencil, Trash2, X, Search, ShieldCheck, ShieldOff, Clock } from "lucide-react";

const SKILLS = ["Weinverkauf", "Service", "Bar", "Küche", "Kasse", "Events"];

const emptyForm = {
  firstName: "", lastName: "", email: "", password: "", phone: "",
  address: "", birthday: "", role: "EMPLOYEE" as "ADMIN" | "EMPLOYEE",
  employeeType: "PARTTIME" as "PARTTIME" | "MINIJOB", monthlyHours: 80,
  skills: [] as string[], personnelNumber: "", isActive: true,
};

export default function Employees() {
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");
  const [tempAdminModal, setTempAdminModal] = useState<User | null>(null);
  const [tempUntil, setTempUntil] = useState("");
  const grantTempAdmin = useGrantTempAdmin();
  const revokeAdmin = useRevokeAdmin();

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setError(""); setDrawerOpen(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ ...emptyForm, ...u, password: "", birthday: u.birthday ? u.birthday.slice(0, 10) : "" });
    setError(""); setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      if (editing) {
        await updateUser.mutateAsync({ id: editing.id, ...form });
      } else {
        await createUser.mutateAsync(form);
      }
      setDrawerOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Fehler beim Speichern");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Mitarbeiter wirklich deaktivieren?")) return;
    await deleteUser.mutateAsync(id);
  };

  const toggleSkill = (s: string) =>
    setForm((f) => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{users.length} Mitarbeiter</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Mitarbeiter anlegen</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30"
          placeholder="Suchen..."
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Laden...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Typ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Soll-Std/Mo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Skills</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={u.employeeType === "PARTTIME" ? "Teilzeit" : "Minijob"} color={u.employeeType === "PARTTIME" ? "blue" : "yellow"} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">{u.monthlyHours ?? "–"} Std</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.skills.slice(0, 3).map((s) => <Badge key={s} label={s} color="wine" />)}
                      {u.skills.length > 3 && <Badge label={`+${u.skills.length - 3}`} color="gray" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={u.isActive ? "Aktiv" : "Inaktiv"} color={u.isActive ? "green" : "gray"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {u.tempAdminUntil && (
                        <span title={`Admin bis ${new Date(u.tempAdminUntil).toLocaleString("de-DE")}`} className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          <Clock size={10}/>{new Date(u.tempAdminUntil).toLocaleDateString("de-DE")}
                        </span>
                      )}
                      {u.role === "EMPLOYEE" ? (
                        <button title="Temp. Admin gewähren" onClick={() => { setTempAdminModal(u); setTempUntil(""); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><ShieldCheck size={14}/></button>
                      ) : u.tempAdminUntil ? (
                        <button title="Admin entziehen" onClick={() => revokeAdmin.mutate(u.id)} className="p-1.5 text-amber-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><ShieldOff size={14}/></button>
                      ) : null}
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-[#8B1A1A] hover:bg-[#8B1A1A]/10 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Keine Mitarbeiter gefunden</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Mitarbeiter bearbeiten" : "Mitarbeiter anlegen"}</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                {[["Vorname*", "firstName"], ["Nachname*", "lastName"]].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input required value={(form as Record<string,unknown>)[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">E-Mail*</label>
                <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
              </div>

              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Passwort* (min. 8 Zeichen)</label>
                  <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Typ</label>
                  <select value={form.employeeType} onChange={(e) => setForm((f) => ({ ...f, employeeType: e.target.value as "PARTTIME" | "MINIJOB" }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30">
                    <option value="PARTTIME">Teilzeit</option>
                    <option value="MINIJOB">Minijob</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Soll-Std/Monat</label>
                  <input type="number" value={form.monthlyHours} onChange={(e) => setForm((f) => ({ ...f, monthlyHours: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefon</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Geburtsdatum</label>
                  <input type="date" value={form.birthday} onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Personalnummer (DATEV)</label>
                <input value={form.personnelNumber} onChange={(e) => setForm((f) => ({ ...f, personnelNumber: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Kompetenzen</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((s) => (
                    <button type="button" key={s} onClick={() => toggleSkill(s)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.skills.includes(s) ? "bg-[#8B1A1A] text-white border-[#8B1A1A]" : "border-gray-300 text-gray-600 hover:border-[#8B1A1A]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {editing && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Aktiv</label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>Abbrechen</Button>
                <Button type="submit" className="flex-1" disabled={createUser.isPending || updateUser.isPending}>
                  {createUser.isPending || updateUser.isPending ? "Speichern..." : "Speichern"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temp Admin Modal */}
      {tempAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><ShieldCheck size={18} className="text-[#8B1A1A]"/> Temporärer Admin</h3>
            <p className="text-sm text-gray-500 mb-4">{tempAdminModal.firstName} {tempAdminModal.lastName} — Admin bis:</p>
            <input type="datetime-local" value={tempUntil} onChange={(e) => setTempUntil(e.target.value)}
              min={new Date().toISOString().slice(0,16)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 mb-4"/>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setTempAdminModal(null)}>Abbrechen</Button>
              <Button className="flex-1" disabled={!tempUntil || grantTempAdmin.isPending}
                onClick={async () => {
                  await grantTempAdmin.mutateAsync({ id: tempAdminModal.id, until: tempUntil });
                  setTempAdminModal(null); setTempUntil("");
                }}>
                Gewähren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}