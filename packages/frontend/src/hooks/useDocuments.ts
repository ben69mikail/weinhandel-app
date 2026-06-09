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
