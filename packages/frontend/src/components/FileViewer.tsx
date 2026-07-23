import { useEffect, useState } from "react";
import { X, Download, Loader2, FileWarning } from "lucide-react";
import { api } from "@/lib/api";
import { downloadDocument } from "@/hooks/useDocuments";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLS = "application/vnd.ms-excel";

type Kind = "pdf" | "word" | "excel" | "unsupported";

// Reine Zuordnung MIME → Anzeigeart. .doc (Legacy) ist im Browser nicht
// zuverlässig darstellbar → Download-Fallback.
export function viewerKind(mimeType: string | null | undefined): Kind {
  switch (mimeType) {
    case PDF:
      return "pdf";
    case DOCX:
      return "word";
    case XLSX_MIME:
    case XLS:
      return "excel";
    default:
      return "unsupported";
  }
}

interface Props {
  docId: string;
  title: string;
  fileName: string;
  mimeType: string | null;
  onClose: () => void;
  allowDownload?: boolean;
}

// In-App-Betrachter für hochgeladene Dokumente (PDF/Word/Excel).
// PDF wird über die Inline-URL /view im <iframe> vom nativen Browser-PDF-Viewer
// gerendert (funktioniert Desktop + Mobile, ohne pdf.js-Worker). Word/Excel
// werden clientseitig zu HTML gerendert (mammoth / SheetJS).
export default function FileViewer({ docId, title, fileName, mimeType, onClose, allowDownload }: Props) {
  const kind = viewerKind(mimeType);
  const [loading, setLoading] = useState(kind !== "pdf"); // PDF lädt im iframe selbst
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const viewUrl = `/api/documents/${docId}/view?token=${encodeURIComponent(token ?? "")}`;

  useEffect(() => {
    if (kind !== "word" && kind !== "excel") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/documents/${docId}/download`, { responseType: "blob" });
        const buf = await (res.data as Blob).arrayBuffer();
        if (cancelled) return;
        if (kind === "word") {
          const mammoth = (await import("mammoth")).default ?? (await import("mammoth"));
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          if (!cancelled) setHtml(result.value);
        } else {
          const XLSX = await import("xlsx");
          const wb = XLSX.read(buf, { type: "array" });
          const parts = wb.SheetNames.map(
            (name) =>
              `<h3 class="xlsx-sheet-title">${name}</h3>` + XLSX.utils.sheet_to_html(wb.Sheets[name]),
          );
          if (!cancelled) setHtml(parts.join(""));
        }
      } catch {
        if (!cancelled) setError("Dokument konnte nicht geladen werden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docId, kind]);

  return (
    <div className="fixed inset-0 bg-[#F9F5F0] z-[60] flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
        <h2 className="font-semibold text-gray-900 truncate flex-1">{title}</h2>
        {allowDownload && (
          <button onClick={() => downloadDocument(docId, fileName)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600" title="Herunterladen">
            <Download size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-2 pointer-events-none">
            <Loader2 size={20} className="animate-spin" /> Lädt…
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 p-6 text-center">
            <FileWarning size={28} className="text-red-500" />
            <p>{error}</p>
            <button onClick={() => downloadDocument(docId, fileName)} className="mt-2 px-4 py-2 bg-[#8B1A1A] text-white rounded-xl text-sm flex items-center gap-2"><Download size={16} /> Herunterladen</button>
          </div>
        )}

        {!error && kind === "unsupported" && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 p-6 text-center">
            <FileWarning size={28} className="text-amber-500" />
            <p>Dieses Format ({fileName}) kann nicht in der App angezeigt werden.</p>
            <button onClick={() => downloadDocument(docId, fileName)} className="px-4 py-2 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium flex items-center gap-2"><Download size={16} /> Herunterladen</button>
          </div>
        )}

        {!error && kind === "pdf" && (
          <iframe title={title} src={viewUrl} className="w-full h-full border-0 bg-white" />
        )}

        {!error && (kind === "word" || kind === "excel") && html !== null && (
          <div className="file-viewer-content max-w-3xl mx-auto p-5 bg-white my-4 rounded-lg shadow-sm overflow-y-auto max-h-full" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  );
}
