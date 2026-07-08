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

// Datei-Upload (multipart) — nutzt dieselbe axios-Instanz (Token via Interceptor)
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title, category }: { file: File; title: string; category: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("category", category);
      return api.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
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
