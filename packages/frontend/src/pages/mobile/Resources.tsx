import { useState } from "react";
import { useDocuments, downloadDocument } from "@/hooks/useApi";
import { BookOpen, Wine, UtensilsCrossed, CheckSquare, Shield, Calendar, Shirt, Phone, X, ChevronRight, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CATS = [
  { key:"WINE_LIST", icon:Wine, label:"Weinkarte", color:"bg-[#8B1A1A]" },
  { key:"FOOD_MENU", icon:UtensilsCrossed, label:"Speisekarte", color:"bg-amber-600" },
  { key:"CHECKLIST", icon:CheckSquare, label:"Checklisten", color:"bg-green-600" },
  { key:"DRESSCODE", icon:Shirt, label:"Dresscode", color:"bg-blue-600" },
  { key:"SERVICE_PROTOCOL", icon:Phone, label:"Protokoll", color:"bg-purple-600" },
  { key:"HYGIENE", icon:Shield, label:"Hygiene", color:"bg-red-600" },
  { key:"RECIPE", icon:BookOpen, label:"Rezepte", color:"bg-orange-600" },
  { key:"__EVENTS__", icon:Calendar, label:"Eventkalender", color:"bg-indigo-600" },
  { key:"OTHER", icon:BookOpen, label:"Sonstiges", color:"bg-gray-600" },
];

function DocViewer({ category, label, onClose }: { category: string; label: string; onClose: () => void }) {
  const { data: docs = [], isLoading } = useDocuments(category);
  const [openDoc, setOpenDoc] = useState<typeof docs[number] | null>(null);

  if (openDoc) return (
    <div className="fixed inset-0 bg-[#F9F5F0] z-50 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
        <button onClick={() => setOpenDoc(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-xl"><X size={20}/></button>
        <h2 className="font-semibold text-gray-900 truncate">{openDoc.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{openDoc.content ?? "Kein Inhalt"}</pre>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#F9F5F0] z-50 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-xl"><X size={20}/></button>
        <h2 className="font-semibold text-gray-900">{label}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading && <p className="text-center text-gray-400 py-10">Lade…</p>}
        {!isLoading && docs.length === 0 && <p className="text-center text-gray-400 py-10">Noch keine Inhalte</p>}
        {docs.map((d) => (
          <button key={d.id} onClick={() => d.fileName ? downloadDocument(d.id, d.fileName) : setOpenDoc(d)} className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 text-left hover:shadow-sm active:scale-95 transition-all">
            {d.fileName && <FileText size={18} className="text-[#8B1A1A] flex-shrink-0"/>}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-900 block truncate">{d.title}</span>
              {d.fileName && <span className="text-xs text-gray-400">{d.fileName}{d.fileSize ? ` · ${(d.fileSize/1024/1024).toFixed(1)} MB` : ""}</span>}
            </div>
            {d.fileName ? <Download size={16} className="text-gray-400 flex-shrink-0"/> : <ChevronRight size={16} className="text-gray-400"/>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState<{ key:string; label:string } | null>(null);
  const navigate = useNavigate();
  const handleCat = (key: string, label: string) => {
    if (key === "__EVENTS__") { navigate("/events"); return; }
    setActiveCategory({ key, label });
  };
  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Info-Hub</h1>
      <div className="grid grid-cols-2 gap-3">
        {CATS.map(({ key, icon:Icon, label, color }) => (
          <button key={key} onClick={() => handleCat(key, label)} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow active:scale-95">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}><Icon size={22} className="text-white"/></div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>
      {activeCategory && <DocViewer category={activeCategory.key} label={activeCategory.label} onClose={() => setActiveCategory(null)}/>}
    </div>
  );
}