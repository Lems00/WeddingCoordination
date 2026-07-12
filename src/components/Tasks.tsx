import { useState, useMemo } from "react";
import { useApp } from "../store";
import { STATUS_COLORS, PHASES, Task, TaskStatus, getAssigneeStyle, getTaskResponsible } from "../data";
import type { User } from "../store";
import { cn } from "../utils/cn";
import GanttView from "./GanttView";
import {
  Search,
  Plus,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  X,
  Edit2,
  Trash2,
  Save,
  Link,
  List,
  KanbanSquare,
  BarChart3,
  GripVertical,
  MoreVertical,
} from "lucide-react";

type ViewMode = "list" | "kanban" | "gantt";

const STATUSES: TaskStatus[] = ["À faire", "En cours", "Terminé", "Bloqué"];

export default function Tasks() {
  const { tasks, updateTaskStatus, addTask, updateTask, deleteTask, currentUser, users, currentProject } = useApp();
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("kanban");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "planner" || currentUser?.role === "super_admin";

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (phaseFilter !== "all" && t.phase !== phaseFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search && !t.task.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, search, phaseFilter, statusFilter]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const p of PHASES) groups[p] = [];
    filtered.forEach((t) => {
      if (groups[t.phase]) groups[t.phase].push(t);
    });
    return groups;
  }, [filtered]);

  const cycleStatus = (t: Task) => {
    if (!canEdit) return;
    const order: TaskStatus[] = ["À faire", "En cours", "Terminé"];
    const i = order.indexOf(t.status);
    const next = order[(i + 1) % order.length];
    updateTaskStatus(t.id, next);
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropToStatus = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/taskId");
    if (taskId) updateTaskStatus(taskId, status);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tâches & Planning</h1>
          <p className="text-slate-500 mt-1">{tasks.length} tâches · {tasks.filter((t) => t.status === "Terminé").length} terminées</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:from-indigo-700 hover:to-violet-700 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="all">Toutes phases</option>
              {PHASES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="all">Tous statuts</option>
              <option value="À faire">À faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
              <option value="Bloqué">Bloqué</option>
            </select>
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {([
              { id: "kanban", label: "Kanban", icon: KanbanSquare },
              { id: "list", label: "Liste", icon: List },
              { id: "gantt", label: "Gantt", icon: BarChart3 },
            ] as const).map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition flex items-center gap-1.5",
                    view === v.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanView
          tasks={filtered}
          users={users}
          canEdit={canEdit}
          onDragStart={onDragStart}
          onDropToStatus={onDropToStatus}
          onDragOver={onDragOver}
          onEdit={(t) => setEditingTask(t)}
          onDelete={(id) => { if (confirm(`Supprimer ${id} ?`)) deleteTask(id); }}
        />
      ) : view === "list" ? (
        <ListView
          groupedTasks={groupedTasks}
          canEdit={canEdit}
          users={users}
          editingTask={editingTask}
          onSetEditingTask={setEditingTask}
          onCycleStatus={cycleStatus}
          onUpdate={(t) => updateTask(t)}
          onDelete={(id) => { if (confirm(`Supprimer ${id} ?`)) deleteTask(id); }}
          phaseFilter={phaseFilter}
          filtered={filtered}
        />
      ) : (
        <GanttView tasks={filtered} users={users} currentProject={currentProject ?? undefined} />
      )}

      {showAddModal && canEdit && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onSave={(t) => { addTask(t); setShowAddModal(false); }}
          existingIds={tasks.map((t) => t.id)}
          users={users}
        />
      )}

      {editingTask && canEdit && (
        <EditTaskModal
          task={editingTask}
          users={users}
          onSave={(updated) => { updateTask(updated); setEditingTask(null); }}
          onCancel={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
//  KANBAN VIEW
// ============================================================================

function KanbanView({
  tasks, users, canEdit, onDragStart, onDropToStatus, onDragOver, onEdit, onDelete,
}: {
  tasks: Task[];
  users: User[];
  canEdit: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropToStatus: (e: React.DragEvent, status: TaskStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const byStatus = STATUSES.map((s) => ({ status: s, tasks: tasks.filter((t) => t.status === s) }));

  const columnStyles: Record<TaskStatus, { border: string; header: string; dot: string; bg: string }> = {
    "À faire": { border: "border-slate-300", header: "from-slate-100 to-slate-50", dot: "bg-slate-400", bg: "bg-slate-50/50" },
    "En cours": { border: "border-blue-300", header: "from-blue-100 to-blue-50", dot: "bg-blue-500", bg: "bg-blue-50/30" },
    "Terminé": { border: "border-emerald-300", header: "from-emerald-100 to-emerald-50", dot: "bg-emerald-500", bg: "bg-emerald-50/30" },
    "Bloqué": { border: "border-red-300", header: "from-red-100 to-red-50", dot: "bg-red-500", bg: "bg-red-50/30" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {byStatus.map(({ status, tasks: colTasks }) => {
        const style = columnStyles[status];
        return (
          <div
            key={status}
            onDrop={(e) => onDropToStatus(e, status)}
            onDragOver={onDragOver}
            className={cn(
              "rounded-2xl border-2 border-dashed p-3 min-h-[500px] transition",
              style.border, style.bg,
              canEdit && "hover:border-solid"
            )}
          >
            <div className={cn("rounded-xl bg-gradient-to-b p-3 mb-3 flex items-center justify-between shadow-sm", style.header)}>
              <div className="flex items-center gap-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", style.dot)} />
                <h3 className="font-semibold text-slate-900 text-sm">{status}</h3>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full">{colTasks.length}</span>
            </div>

            <div className="space-y-2">
              {colTasks.map((t) => {
                const responsibleName = getTaskResponsible(t, users);
                const assignee = getAssigneeStyle(responsibleName);
                return (
                  <div
                    key={t.id}
                    draggable={canEdit}
                    onDragStart={(e) => onDragStart(e, t.id)}
                    className={cn(
                      "bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition group",
                      canEdit && "cursor-grab active:cursor-grabbing"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {canEdit && <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate">{t.category}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 line-clamp-2">{t.task}</p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(t.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                          {t.predecessor && (
                            <span className="flex items-center gap-1">
                              <Link className="w-3 h-3" />
                              {t.predecessor.split(",")[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-2 ring-white"
                              style={{ backgroundColor: assignee.color }}
                              title={`${assignee.label} — ${responsibleName}`}
                            >
                              {assignee.code}
                            </div>
                            <span className="text-[11px] text-slate-600 truncate">{responsibleName}</span>
                          </div>
                          {canEdit && (
                            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                              <TaskMenu task={t} onEdit={onEdit} onDelete={onDelete} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Déposez une tâche ici
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
//  LIST VIEW
// ============================================================================

function ListView({
  groupedTasks, canEdit, users, onSetEditingTask, onCycleStatus, onDelete, phaseFilter, filtered,
}: {
  groupedTasks: Record<string, Task[]>;
  canEdit: boolean;
  users: User[];
  editingTask: Task | null;
  onSetEditingTask: (t: Task | null) => void;
  onCycleStatus: (t: Task) => void;
  onUpdate: (t: Task) => void;
  onDelete: (id: string) => void;
  phaseFilter: string;
  filtered: Task[];
}) {
  return (
    <div className="space-y-6">
      {PHASES.filter((p) => phaseFilter === "all" || phaseFilter === p).map((phase) => {
        const items = groupedTasks[phase] || [];
        if (items.length === 0) return null;
        return (
          <div key={phase} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={cn(
              "px-5 py-3 flex items-center justify-between",
              phase === "Préparation" && "bg-gradient-to-r from-indigo-50 to-indigo-50/50",
              phase === "Veille" && "bg-gradient-to-r from-amber-50 to-amber-50/50",
              phase === "Jour J" && "bg-gradient-to-r from-rose-50 to-rose-50/50",
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  phase === "Préparation" && "bg-indigo-500",
                  phase === "Veille" && "bg-amber-500",
                  phase === "Jour J" && "bg-rose-500",
                )} />
                <h3 className="font-semibold text-slate-900">{phase}</h3>
                <span className="text-xs text-slate-500">({items.length} tâches)</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((t) => {
                const sc = STATUS_COLORS[t.status];
                const responsibleName = getTaskResponsible(t, users);
                const assignee = getAssigneeStyle(responsibleName);
                return (
                  <div key={t.id} className="px-5 py-3 hover:bg-slate-50/50 transition group">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onCycleStatus(t)}
                        disabled={!canEdit}
                        aria-label={`Changer le statut — ${t.task} (actuellement ${t.status})`}
                        title={canEdit ? "Changer le statut" : undefined}
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0",
                          t.status === "Terminé" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-indigo-400",
                          !canEdit && "cursor-default"
                        )}
                      >
                        {t.status === "Terminé" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.id}</span>
                              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", sc.bg, sc.text)}>{t.status}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{t.category}</span>
                            </div>
                            <p className={cn("text-sm font-medium mt-1", t.status === "Terminé" ? "line-through text-slate-400" : "text-slate-800")}>{t.task}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(t.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                {" → "}
                                {new Date(t.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duration}</span>
                              {t.predecessor && <span className="flex items-center gap-1"><Link className="w-3 h-3" />{t.predecessor}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow ring-2 ring-white"
                              style={{ backgroundColor: assignee.color }}
                              title={`${assignee.label} — ${responsibleName}`}
                            >
                              {assignee.code}
                            </div>
                            {canEdit && (
                              <TaskMenu task={t} onEdit={onSetEditingTask} onDelete={onDelete} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <div className="text-center py-12 text-slate-400">Aucune tâche trouvée</div>}
    </div>
  );
}

function TaskMenu({ task, onEdit, onDelete }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Actions de la tâche"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Actions"
        className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-10">
          <button
            onClick={() => {
              onEdit(task);
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100 flex items-center gap-2 border-b border-slate-100"
          >
            <Edit2 className="w-4 h-4" /> Modifier
          </button>
          <button
            onClick={() => {
              onDelete(task.id);
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function EditTaskModal({ task, users, onSave, onCancel }: { task: Task; users: User[]; onSave: (t: Task) => void; onCancel: () => void }) {
  const [form, setForm] = useState(task);
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Modifier la tâche</h2>
          <button onClick={onCancel} aria-label="Fermer" title="Fermer" className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <Field label="Nom de la tâche"><input className="input" value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Statut">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                <option>À faire</option><option>En cours</option><option>Terminé</option><option>Bloqué</option>
              </select>
            </Field>
            <Field label="Assigner à">
              <select className="input" value={form.responsible_user_id || ""} onChange={(e) => {
                const u = users.find((x) => x.id === e.target.value);
                setForm({ ...form, responsible_user_id: e.target.value || null, responsible: u?.name || form.responsible });
              }}>
                <option value="">— Choisir —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date début"><input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Date fin"><input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Durée"><input className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
            <Field label="Catégorie"><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium flex items-center gap-1">
            <Save className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
//  ADD TASK MODAL
// ============================================================================

// Préfixe conventionnel par phase — cohérent avec les données existantes
// (Préparation → P, Veille → V, Jour J → J).
function prefixForPhase(phase: string): string {
  if (phase === "Veille") return "V";
  if (phase === "Jour J") return "J";
  return "P";
}

// Suggère le premier ID libre : comble d'abord les trous dans la
// numérotation existante (ex: P15 si P14 et P16 existent mais pas P15),
// sinon repart du prochain numéro après le maximum actuel.
function suggestNextTaskId(existingIds: string[], phase: string): string {
  const prefix = prefixForPhase(phase);
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  const nums = existingIds
    .map((id) => {
      const m = id.match(pattern);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  let next = 1;
  for (const n of nums) {
    if (n === next) next++;
    else if (n > next) break;
  }
  return `${prefix}${String(next).padStart(2, "0")}`;
}

function AddTaskModal({ onClose, onSave, existingIds, users }: {
  onClose: () => void; onSave: (t: Task) => void; existingIds: string[]; users: User[];
}) {
  const { currentProjectId } = useApp();
  const [idTouchedByUser, setIdTouchedByUser] = useState(false);
  const [form, setForm] = useState<Partial<Task>>({
    id: suggestNextTaskId(existingIds, "Préparation"), phase: "Préparation", category: "Coordination", task: "",
    duration: "1 jour", start_date: "2026-06-02", end_date: "2026-06-02",
    predecessor: "", responsible: "Coordinateur", responsible_user_id: null, status: "À faire",
  });

  const handlePhaseChange = (phase: string) => {
    setForm((f) => ({
      ...f,
      phase,
      // Ne recalcule l'ID suggéré que si l'utilisateur ne l'a pas modifié à la main.
      id: idTouchedByUser ? f.id : suggestNextTaskId(existingIds, phase),
    }));
  };

  const handleSave = () => {
    if (!form.id || !form.task) { alert("ID et nom requis"); return; }
    if (existingIds.includes(form.id!)) { alert("Cet ID existe déjà"); return; }
    onSave({
      ...form,
      id: form.id!,
      project_id: currentProjectId,
      task: form.task!,
      phase: form.phase || "Préparation",
      category: form.category || "Coordination",
      duration: form.duration || "1 jour",
      start_date: form.start_date || new Date().toISOString().split("T")[0],
      end_date: form.end_date || new Date().toISOString().split("T")[0],
      predecessor: form.predecessor || "",
      responsible: form.responsible || "Coordinateur",
      status: form.status || "À faire",
    } as Task);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nouvelle tâche</h2>
          <button onClick={onClose} aria-label="Fermer" title="Fermer" className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID">
              <input
                className="input"
                value={form.id || ""}
                onChange={(e) => { setIdTouchedByUser(true); setForm({ ...form, id: e.target.value }); }}
                placeholder="P44"
              />
            </Field>
            <Field label="Phase">
              <select className="input" value={form.phase} onChange={(e) => handlePhaseChange(e.target.value)}>
                {PHASES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Nom de la tâche"><input className="input" value={form.task || ""} onChange={(e) => setForm({ ...form, task: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie"><input className="input" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Assigner à">
              <select
                className="input"
                value={form.responsible_user_id || ""}
                onChange={(e) => {
                  const u = users.find((x) => x.id === e.target.value);
                  setForm({ ...form, responsible_user_id: e.target.value || null, responsible: u?.name || "" });
                }}
              >
                <option value="">— Choisir —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date début"><input type="date" className="input" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Date fin"><input type="date" className="input" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Durée"><input className="input" value={form.duration || ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
            <Field label="Prédécesseur"><input className="input" value={form.predecessor || ""} onChange={(e) => setForm({ ...form, predecessor: e.target.value })} placeholder="P01,P02" /></Field>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Créer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
