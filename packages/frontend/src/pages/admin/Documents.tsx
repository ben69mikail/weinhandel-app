import { useState } from "react";
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument, useUploadDocument, downloadDocument } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2, X, Eye, Upload, Download, FileText } from "lucide-react";

const CATS = ["WINE_LIST","FOOD_MENU","DRINKS_MENU","SPECIAL_MENU","RECIPE","CHECKLIST","DRESSCODE","SERVICE_PROTOCOL","HYGIENE","EMPLOYEE_INFO","OTHER"];
const CAT_LABEL: Record<string,string> = { WINE_LIST:"Weinkarte", FOOD_MENU:"Speisekarte", DRINKS_MENU:"Getränkekarte", SPECIAL_MENU:"Sonderkarte", RECIPE:"Rezept", CHECKLIST:"Checkliste", DRESSCODE:"Dresscode", SERVICE_PROTOCOL:"Serviceprotokoll", HYGIENE:"Hygiene", EMPLOYEE_INFO:"Mitarbeiterinfo", OTHER:"Sonstiges" };

const empty = { title:"", category:"WINE_LIST", content:"", isPublished:true, sortOrder:0 };

export default function Documents() {
  const [catFilter, setCatFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ ...empty });
  const [preview, setPreview] = useState<string|null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", category: "WINE_LIST", file: null as File | null });
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useDocuments(catFilter === "ALL" ? undefined : catFilter);
  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const deleteDoc = useDeleteDocument();
  const uploadDoc = useUploadDocument();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!uploadForm.file) { setUploadError("Bitte Datei auswählen"); return; }
    try {
      await uploadDoc.mutateAsync({ file: uploadForm.file, title: uploadForm.title, category: uploadForm.category });
      setShowUpload(false);
      setUploadForm({ title: "", category: "WINE_LIST", file: null });
    } catch (err: any) {
      setUploadError(err?.response?.data?.message ?? "Upload fehlgeschlagen");
    }
  };

  const openCreate = () => { setEditId(null); setForm({ ...empty }); setShowForm(true); };
  const openEdit = (d: typeof docs[number]) => { setEditId(d.id); setForm({ title:d.title, category:d.category, content:d.content??"", isPublished:d.isPublished, sortOrder:d.sortOrder }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) await updateDoc.mutateAsync({ id:editId, ...form });
    else await createDoc.mutateAsync(form);
    setShowForm(false); setEditId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
          <option value="ALL">Alle Kategorien</option>
          {CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
        <Button size="sm" variant="secondary" onClick={() => { setShowUpload(true); setUploadError(null); }} className="flex items-center gap-1 ml-auto"><Upload size={14}/> Datei hochladen</Button>
        <Button size="sm" onClick={openCreate} className="flex items-center gap-1"><Plus size={14}/> Dokument</Button>
      </div>

      {showUpload && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Datei hochladen (PDF, Word, Excel)</h3>
            <button onClick={() => setShowUpload(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16}/></button>
          </div>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titel</label>
                <input required value={uploadForm.title} onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
                <select value={uploadForm.category} onChange={(e) => setUploadForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                  {CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Datei</label>
              <input type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setUploadForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#8B1A1A]/10 file:text-[#8B1A1A] file:text-sm file:font-medium hover:file:bg-[#8B1A1A]/20"/>
              <p className="text-xs text-gray-400 mt-1">Max. 10 MB. Erlaubt: PDF, Word (.doc/.docx), Excel (.xls/.xlsx)</p>
            </div>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowUpload(false)}>Abbrechen</Button>
              <Button type="submit" className="flex-1" disabled={uploadDoc.isPending}>{uploadDoc.isPending ? "Lädt hoch…" : "Hochladen"}</Button>
            </div>
          </form>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editId ? "Bearbeiten" : "Neues Dokument"}</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titel</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title:e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category:e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                  {CATS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Inhalt (Markdown)</label>
              <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content:e.target.value }))} rows={10} className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 resize-y"/>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished:e.target.checked }))} className="rounded"/>
                Veröffentlicht
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button type="submit" className="flex-1" disabled={createDoc.isPending || updateDoc.isPending}>Speichern</Button>
            </div>
          </form>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-semibold">Vorschau</span>
              <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-6 prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm text-gray-700">{preview}</div>
          </div>
        </div>
      )}

      {isLoading ? <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Lade…</div> : (
        <div className="space-y-2">
          {docs.length === 0 && <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Keine Dokumente</div>}
          {docs.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {d.fileName && <FileText size={15} className="text-[#8B1A1A] flex-shrink-0"/>}
                  <span className="font-medium text-gray-900">{d.title}</span>
                  <Badge label={CAT_LABEL[d.category] ?? d.category} color="blue"/>
                  {!d.isPublished && <Badge label="Entwurf" color="gray"/>}
                </div>
                {d.fileName && <p className="text-sm text-gray-400 truncate mt-0.5">{d.fileName}{d.fileSize ? ` · ${(d.fileSize/1024/1024).toFixed(1)} MB` : ""}</p>}
                {d.content && <p className="text-sm text-gray-400 truncate mt-0.5">{d.content.slice(0,80)}…</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {d.fileName && <button onClick={() => downloadDocument(d.id, d.fileName!)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Download size={14}/></button>}
                {d.content && <button onClick={() => setPreview(d.content ?? null)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={14}/></button>}
                <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-[#8B1A1A] hover:bg-[#8B1A1A]/10 rounded-lg"><Pencil size={14}/></button>
                <button onClick={() => deleteDoc.mutate(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}