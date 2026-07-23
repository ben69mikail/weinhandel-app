import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Document } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useDocuments(category?: string) {
  const q = category ? `?category=${category}` : "";
  return useQuery<Document[]>({
    queryKey: queryKeys.documents.byCategory(category),
    queryFn: () => api.get(`/documents${q}`).then((r) => r.data),
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Document>) => api.post("/documents", d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }: Partial<Document> & { id: string }) =>
      api.put(`/documents/${id}`, d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// Datei als Base64 lesen (nur die Nutzdaten, ohne "data:...;base64,"-Präfix).
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Datei-Upload als Base64 im JSON-Body. Kein Multipart — die Netlify-Function
// behandelt Multipart als UTF-8 und zerstört Binärdaten (PDF wurde weiß/kaputt).
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, title, category }: { file: File; title: string; category: string }) => {
      const dataBase64 = await fileToBase64(file);
      const mimeType = file.type || "application/octet-stream";
      return api
        .post("/documents/upload", { title, category, fileName: file.name, mimeType, dataBase64 })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// Download-URL für ein Dokument mit Datei (Token wird per fetch geladen, dann Blob)
export async function downloadDocument(id: string, fileName: string) {
  const res = await api.get(`/documents/${id}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
