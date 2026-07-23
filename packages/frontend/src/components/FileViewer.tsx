import { useEffect, useState } from "react";
import { X, Download, Loader2, FileWarning } from "lucide-react";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import { downloadDocument } from "@/hooks/useDocuments";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC = "application/msword";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLS = "application/vnd.ms-excel";

type Kind = "pdf" | "word" | "excel" | "unsupported";

// Reine Zuordnung MIME → Anzeigeart. Bewusst simpel; .doc (Legacy) ist im
// Browser nicht darstellbar → Download-Fallback.
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
  /** Download-Button anzeigen (z.B. Admin). Default: nein. */
  allowDownload?: boolean;
}

// In-App-Betrachter für hochgeladene Dokumente (PDF/Word/Excel).
export default function FileViewer({ docId, title, fileName, mimeType, onClose, allowDownload }: Props) {
  const kind = viewerKind(mimeType);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (kind === "unsupported") {
          setLoading(false);
          return;
        }
        const res = await api.get(`/documents/${docId}/download`, { responseType: "blob" });
        const blob = res.data as Blob;
        if (kind === "pdf") {
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) setPdfUrl(objectUrl);
        } else if (kind === "word") {
          const buf = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          if (!cancelled) setHtml(result.value);
        } else if (kind === "excel") {
          const buf = await blob.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array" });
          const parts = wb.SheetNames.map(
            (name) =>
              `<h3 class="xlsx-sheet-title">${name}</h3>` +
              XLSX.utils.sheet_to_html(wb.Sheets[name]),
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
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId, kind]);

  return (
    <div className="fixed inset-0 bg-[#F9F5F0] z-[60] flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
        <h2 className="font-semibold text-gray-900 truncate flex-1">{title}</h2>
        {allowDownload && (
          <button
            onClick={() => downloadDocument(docId, fileName)}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600"
            title="Herunterladen"
          >
            <Download size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> Lädt…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 p-6 text-center">
            <FileWarning size={28} className="text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && kind === "unsupported" && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 p-6 text-center">
            <FileWarning size={28} className="text-amber-500" />
            <p>Dieses Format ({fileName}) kann nicht in der App angezeigt werden.</p>
            <button
              onClick={() => downloadDocument(docId, fileName)}
              className="px-4 py-2 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Download size={16} /> Herunterladen
            </button>
          </div>
        )}

        {!loading && !error && kind === "pdf" && pdfUrl && (
          <iframe title={title} src={pdfUrl} className="w-full h-full border-0" />
        )}

        {!loading && !error && (kind === "word" || kind === "excel") && html !== null && (
          <div
            className="file-viewer-content max-w-3xl mx-auto p-5 bg-white my-4 rounded-lg shadow-sm"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
