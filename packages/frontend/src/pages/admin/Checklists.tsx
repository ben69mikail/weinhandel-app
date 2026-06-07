import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCompleteTask } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2, CheckCircle, Circle, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const CATEGORIES = ["Allgemein","Öffnen","Schließen","Küche","Bar","Hygiene"];
const priorityLabel: Record<number,string> = {1:"Normal",2:"Hoch",3:"Dringend"};
const priorityColor: Record<number,"gray"|"yellow"|"red"> = {1:"gray",2:"yellow",3:"red"};

export default function Checklists() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<null|{id:string;title:string;description:string;dueDate:string;priority:number;category:string}>(null);

  const { data: tasks = [], isLoading } = useTasks(date);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();

  const emptyForm = { title:"", description:"", dueDate:date, priority:1, category:"Allgemein" };
  const [form, setForm] = useState({ ...emptyForm });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTask) {
      await updateTask.mutateAsync({ id: editTask.id, ...form });
      setEditTask(null);
    } else {
      await createTask.mutateAsync(form);
      setShowForm(false);
      setForm({ ...emptyForm });
    }
  };

  const isCompleted = (task: import("@/hooks/useApi").Task) =>
    task.completions.some((c: { userId: string; status: string }) => c.userId === user?.id && c.status === "DONE");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
        {isAdmin && !showForm && (
          <Button size="sm" onClick={() => { setShowForm(true); setForm({ ...emptyForm, dueDate: date }); }} className="flex items-center gap-1">
            <Plus size={14} /> Aufgabe erstellen
          </Button>
        )}
      </div>

      {/* Create/edit form */}
      {(showForm || editTask) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{editTask ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</h3>
            <button onClick={() => { setShowForm(false); setEditTask(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Titel" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Beschreibung (optional)" rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 resize-none" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kategorie</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priorität</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none">
                  {[1,2,3].map((p) => <option key={p} value={p}>{priorityLabel[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setEditTask(null); }}>Abbrechen</Button>
              <Button type="submit" className="flex-1" disabled={createTask.isPending || updateTask.isPending}>Speichern</Button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Lade…</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Keine Aufgaben für {new Date(date).toLocaleDateString("de-DE")}</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const done = isCompleted(task);
            return (
              <div key={task.id} className={`bg-white rounded-xl border p-4 transition-opacity ${done ? "opacity-60 border-green-200" : "border-gray-200"}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => !done && completeTask.mutate({ id: task.id })}
                    className={`mt-0.5 flex-shrink-0 ${done ? "text-green-500" : "text-gray-300 hover:text-[#8B1A1A]"}`}>
                    {done ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${done ? "line-through text-gray-400" : "text-gray-900"}`}>{task.title}</span>
                      <Badge label={task.category} color="blue" />
                      {task.priority > 1 && <Badge label={priorityLabel[task.priority]} color={priorityColor[task.priority]} />}
                    </div>
                    {task.description && <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>}
                    {task.completions.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">✓ {task.completions.map((c) => c.user.firstName).join(", ")}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditTask({ id: task.id, title: task.title, description: task.description ?? "", dueDate: task.dueDate?.slice(0,10) ?? date, priority: task.priority, category: task.category }); setForm({ title: task.title, description: task.description ?? "", dueDate: task.dueDate?.slice(0,10) ?? date, priority: task.priority, category: task.category }); }}
                        className="p-1.5 text-gray-400 hover:text-[#8B1A1A] hover:bg-[#8B1A1A]/10 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => deleteTask.mutate(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}