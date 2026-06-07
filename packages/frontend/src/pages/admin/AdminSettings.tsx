import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Save, CheckCircle } from "lucide-react";

export default function AdminSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<Record<string,string|number>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm({ ...settings } as Record<string,string|number>);
  }, [settings]);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(form as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) return <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Lade…</div>;

  const Field = ({ label, k, type = "text", placeholder = "" }: { label:string; k:string; type?:string; placeholder?:string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form[k] ?? "") as string} onChange={(e) => set(k, type==="number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30"/>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Unternehmen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Unternehmensname" k="businessName"/>
          <Field label="Adresse" k="businessAddress"/>
        </div>
      </div>

      {/* Shifts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Schichten & Pausen</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Standard Beginn" k="defaultShiftStart" type="time"/>
          <Field label="Standard Ende" k="defaultShiftEnd" type="time"/>
          <Field label="Auto-Pause nach (Std)" k="autoBreakAfterHours" type="number"/>
          <Field label="Pause Dauer (Min)" k="autoBreakMinutes" type="number"/>
        </div>
      </div>

      {/* DATEV */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-1">DATEV</h2>
        <p className="text-xs text-gray-400 mb-4">Für den monatlichen automatischen Export</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mandantennummer" k="datevClientNumber" placeholder="z.B. 12345"/>
          <Field label="Beraternummer" k="datevConsultantNumber" placeholder="z.B. 9876"/>
        </div>
      </div>

      {/* Email / SMTP */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-1">E-Mail (SMTP)</h2>
        <p className="text-xs text-gray-400 mb-4">Für Benachrichtigungen und DATEV-Versand</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Absender-E-Mail" k="emailFrom" type="email" placeholder="admin@weinhandel.de"/>
          <Field label="SMTP Host" k="smtpHost" placeholder="smtp.gmail.com"/>
          <Field label="SMTP Port" k="smtpPort" type="number" placeholder="587"/>
          <Field label="SMTP Benutzer" k="smtpUser" type="email"/>
          <Field label="SMTP Passwort" k="smtpPassword" type="password" placeholder="(unverändert lassen = bleibt)"/>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateSettings.isPending} className="flex items-center gap-2">
          <Save size={16}/> Speichern
        </Button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium"><CheckCircle size={16}/> Gespeichert</span>}
      </div>
    </form>
  );
}