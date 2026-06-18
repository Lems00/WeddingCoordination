import { useState, useMemo } from "react";
import { useApp } from "../store";
import { STATUS_COLORS, PHASES, Task, TaskStatus, getAssigneeStyle, getResponsibleName } from "../data";
import type { User } from "../store";
import { cn } from "../utils/cn";
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
  Users,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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

  // Légende des codes couleur de l'équipe assignée (uniques dans les tâches courantes)
  const assigneeLegend = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getAssigneeStyle>>();
    tasks.forEach((t) => {
      const responsibleName = getResponsibleName(t.responsible_user_id, users);
      const s = getAssigneeStyle(responsibleName);
      if (!map.has(s.label)) map.set(s.label, s);
    });
    return Array.from(map.values());
  }, [tasks, users]);

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

      {/* Légende des codes couleur de l'équipe */}
      {assigneeLegend.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Codes couleur de l'équipe
          </p>
          <div className="flex flex-wrap gap-2.5">
            {assigneeLegend.map((a) => (
              <div key={a.label} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: a.color }}
                >
                  {a.code}
                </span>
                <span className="text-xs font-medium text-slate-700">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <GanttView tasks={filtered} users={users} deadline={currentProject?.date} />
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
                const responsibleName = getResponsibleName(t.responsible_user_id, users);
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
  groupedTasks, canEdit, users, editingTask, onSetEditingTask, onCycleStatus, onUpdate, onDelete, phaseFilter, filtered,
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
                const responsibleName = getResponsibleName(t.responsible_user_id, users);
                const assignee = getAssigneeStyle(responsibleName);
                return (
                  <div key={t.id} className="px-5 py-3 hover:bg-slate-50/50 transition group">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onCycleStatus(t)}
                        disabled={!canEdit}
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
          <button onClick={onCancel} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
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

function AddTaskModal({ onClose, onSave, existingIds, users }: {
  onClose: () => void; onSave: (t: Task) => void; existingIds: string[]; users: User[];
}) {
  const { currentProjectId } = useApp();
  const [form, setForm] = useState<Partial<Task>>({
    id: "", phase: "Préparation", category: "Coordination", task: "",
    duration: "1 jour", start_date: "2026-06-02", end_date: "2026-06-02",
    predecessor: "", responsible: "Coordinateur", responsible_user_id: null, status: "À faire",
  });

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
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID"><input className="input" value={form.id || ""} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="P44" /></Field>
            <Field label="Phase">
              <select className="input" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
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

// ============================================================================
//  GANTT VIEW
// ============================================================================

type GanttZoom = "day" | "week" | "month";

function GanttView({ tasks, users, deadline }: { tasks: Task[], users: User[], deadline?: string }) {
  const [zoom, setZoom] = useState<GanttZoom>("week");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showLegend, setShowLegend] = useState(false);

  const allDates = tasks.flatMap((t) => [new Date(t.start_date), new Date(t.end_date)]);
  if (allDates.length === 0) return <div className="text-center py-12 text-slate-400">Aucune tâche</div>;

  const DAY_MS = 1000 * 60 * 60 * 24;

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  let maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Si deadline existe, utiliser la plus tard entre la deadline et la dernière tâche
  if (deadline) {
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    if (deadlineDate.getTime() > maxDate.getTime()) {
      maxDate = deadlineDate;
    }
  }

  // Normalize to midnight
  minDate.setHours(0, 0, 0, 0);
  maxDate.setHours(0, 0, 0, 0);
  // Padding : 2 jours avant, aucun après (la deadline termine à l'extrémité droite)
  minDate.setDate(minDate.getDate() - 2);
  // Pas de padding à droite - la deadline est à l'extrémité du viewport
  const totalDays = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / DAY_MS));

  // Pixels per day depending on zoom level
  const PX_PER_DAY: Record<GanttZoom, number> = { day: 48, week: 16, month: 5 };
  const pxPerDay = PX_PER_DAY[zoom];
  const timelineWidth = totalDays * pxPerDay;

  // Build ticks depending on zoom
  const ticks: { date: Date; leftPx: number; major: boolean; label: string }[] = [];
  if (zoom === "day") {
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      ticks.push({
        date: d,
        leftPx: i * pxPerDay,
        major: d.getDate() === 1,
        label: d.toLocaleDateString("fr-FR", { day: "numeric", weekday: "short" }),
      });
    }
  } else if (zoom === "week") {
    // tick at each Monday
    const start = new Date(minDate);
    const dow = (start.getDay() + 6) % 7; // 0 = Monday
    start.setDate(start.getDate() - dow);
    for (let d = new Date(start); d <= maxDate; d.setDate(d.getDate() + 7)) {
      const offsetDays = Math.round((d.getTime() - minDate.getTime()) / DAY_MS);
      ticks.push({
        date: new Date(d),
        leftPx: offsetDays * pxPerDay,
        major: d.getDate() <= 7,
        label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      });
    }
  } else {
    // month: tick at 1st of each month
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    for (let d = new Date(start); d <= maxDate; d.setMonth(d.getMonth() + 1)) {
      const offsetDays = Math.round((d.getTime() - minDate.getTime()) / DAY_MS);
      ticks.push({
        date: new Date(d),
        leftPx: offsetDays * pxPerDay,
        major: true,
        label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      });
    }
  }

  const getTaskLeftPx = (t: Task) =>
    Math.round((new Date(t.start_date).setHours(0, 0, 0, 0) - minDate.getTime()) / DAY_MS) * pxPerDay;
  const getTaskWidthPx = (t: Task) => {
    const days = Math.max(1, Math.round((new Date(t.end_date).setHours(0, 0, 0, 0) - new Date(t.start_date).setHours(0, 0, 0, 0)) / DAY_MS) + 1);
    return days * pxPerDay;
  };

  // Today line position
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayInRange = today >= minDate && today <= maxDate;
  const todayLeftPx = Math.round((today.getTime() - minDate.getTime()) / DAY_MS) * pxPerDay;

  const sorted = [...tasks].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const zoomOptions: { id: GanttZoom; label: string }[] = [
    { id: "day", label: "Jour" },
    { id: "week", label: "Semaine" },
    { id: "month", label: "Mois" },
  ];

  const toggleTaskExpand = (taskId: string) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setExpandedTasks(newSet);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" />Diagramme de Gantt</h2>
          <p className="text-sm text-slate-500">Chronologie visuelle des tâches</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {todayInRange && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Aujourd'hui
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Affichage :</span>
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {zoomOptions.map((z) => (
              <button
                key={z.id}
                onClick={() => setZoom(z.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition",
                  zoom === z.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {z.label}
              </button>
            ))}
          </div>
          {/* Legend menu */}
          <div className="relative">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition"
              title="Afficher la légende"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showLegend && (
              <div className="absolute right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg z-20 p-3 min-w-max">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Légende
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-slate-400 to-slate-300" />
                    <span className="text-xs text-slate-600">À faire</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-400" />
                    <span className="text-xs text-slate-600">En cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-xs text-slate-600">Terminé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-red-400" />
                    <span className="text-xs text-slate-600">Bloqué</span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-1.5 mt-1.5">
                    <span className="w-3 h-0.5 bg-red-500" />
                    <span className="text-xs text-slate-600">Date du jour</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gantt Container with fixed left column + scrollable right area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Fixed (224px) */}
        <div className="w-56 flex-shrink-0 flex flex-col border-r border-slate-100">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tâche</span>
          </div>
          {/* Scrollable task list */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-indigo-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-600">
            {PHASES.map((phase) => {
              const phaseTasks = sorted.filter((t) => t.phase === phase);
              if (phaseTasks.length === 0) return null;
              return (
                <div key={phase}>
                  {/* Phase header */}
                  <div className="bg-slate-50/50 border-b border-slate-100 px-4 py-2 sticky top-0 z-5">
                    <span className={cn("text-xs font-bold uppercase tracking-wider",
                      phase === "Préparation" && "text-indigo-600",
                      phase === "Veille" && "text-amber-600",
                      phase === "Jour J" && "text-rose-600",
                    )}>{phase}</span>
                  </div>
                  {/* Tasks in phase */}
                  {phaseTasks.map((t) => (
                    <div key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition px-3 py-2 flex items-center gap-1.5">
                      <button
                        onClick={() => toggleTaskExpand(t.id)}
                        className="flex-shrink-0 p-0.5 hover:bg-slate-200 rounded transition"
                        title={expandedTasks.has(t.id) ? "Masquer détails" : "Afficher détails"}
                      >
                        {expandedTasks.has(t.id) ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono font-bold text-slate-600 truncate">{t.id}</div>
                        <div className="text-xs text-slate-700 truncate hidden sm:block">{t.task}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Scrollable (H + V) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline header - sticky top */}
          <div className="bg-white border-b border-slate-200 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-indigo-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-600">
            <div className="relative h-12" style={{ width: timelineWidth, minWidth: "100%" }}>
              {ticks.map((tick, i) => (
                <div key={i} className="absolute top-0 bottom-0" style={{ left: tick.leftPx }}>
                  <div className={cn("h-full w-px", tick.major ? "bg-slate-300" : "bg-slate-200")} />
                  <span className={cn(
                    "absolute top-1 left-1 text-[10px] font-medium whitespace-nowrap",
                    tick.major ? "text-slate-700 font-semibold" : "text-slate-500"
                  )}>
                    {tick.label}
                  </span>
                </div>
              ))}
              {/* Today line in header */}
              {todayInRange && (
                <div className="absolute top-0 bottom-0 z-20" style={{ left: todayLeftPx }}>
                  <div className="w-0.5 h-full bg-red-500" />
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white shadow" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline content - scrollable both directions */}
          <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-indigo-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-600 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-indigo-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-600">
            <div className="relative" style={{ width: timelineWidth, minHeight: "100%" }}>
              {/* Today vertical line */}
              {todayInRange && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500/70 z-10 pointer-events-none"
                  style={{ left: todayLeftPx }}
                />
              )}

              {/* Phases and tasks */}
              {PHASES.map((phase) => {
                const phaseTasks = sorted.filter((t) => t.phase === phase);
                if (phaseTasks.length === 0) return null;
                return (
                  <div key={phase}>
                    {/* Phase header */}
                    <div className="bg-slate-50/50 border-b border-slate-100 h-10 flex items-center relative">
                      {ticks.map((tick, i) => (
                        <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-100" style={{ left: tick.leftPx }} />
                      ))}
                    </div>

                    {/* Task rows */}
                    {phaseTasks.map((t) => {
                      const leftPx = getTaskLeftPx(t);
                      const widthPx = getTaskWidthPx(t);
                      const isExpanded = expandedTasks.has(t.id);
                      const responsibleName = getResponsibleName(t.responsible_user_id, users);
                      const assignee = getAssigneeStyle(responsibleName);

                      return (
                        <div key={t.id}>
                          {/* Task bar row - fixed height 40px */}
                          <div className="border-b border-slate-50 hover:bg-slate-50/50 transition h-10 relative">
                            {/* Grid background */}
                            {ticks.map((tick, i) => (
                              <div key={i} className={cn("absolute top-0 bottom-0 w-px", tick.major ? "bg-slate-100" : "bg-slate-50")} style={{ left: tick.leftPx }} />
                            ))}

                            {/* Task bar */}
                            <div
                              className={cn("absolute top-1.5 bottom-1.5 rounded-md shadow-sm flex items-center gap-1.5 pl-1.5 pr-2 text-white text-[10px] font-medium overflow-hidden whitespace-nowrap hover:shadow-md transition cursor-pointer",
                                t.status === "Terminé" && "bg-emerald-500",
                                t.status === "En cours" && "bg-gradient-to-r from-blue-500 to-blue-400",
                                t.status === "À faire" && "bg-gradient-to-r from-slate-400 to-slate-300",
                                t.status === "Bloqué" && "bg-gradient-to-r from-red-500 to-red-400",
                              )}
                              style={{ left: leftPx, width: Math.max(pxPerDay, widthPx) }}
                              title={`${t.id} — ${t.task} (${t.status}) · ${assignee.label}`}
                            >
                              {widthPx > 24 && (
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ring-1 ring-white/40"
                                  style={{ backgroundColor: assignee.color }}
                                >
                                  {assignee.code}
                                </span>
                              )}
                              {widthPx > 60 && <span className="truncate">{responsibleName}</span>}
                            </div>
                          </div>

                          {/* Expanded details row */}
                          {isExpanded && (
                            <div className="bg-blue-50/30 border-b border-slate-100 px-3 py-2 relative">
                              {ticks.map((tick, i) => (
                                <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-50" style={{ left: tick.leftPx }} />
                              ))}
                              <div className="relative z-1 flex flex-wrap gap-2 text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-600">Responsable:</span>
                                  <span className="text-slate-700">{responsibleName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-600">Durée:</span>
                                  <span className="text-slate-700">{t.duration}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-600">Statut:</span>
                                  <span className="text-slate-700">{t.status}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
