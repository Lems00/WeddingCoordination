import { useState } from "react";
import { useApp } from "../store";
import { cn } from "../utils/cn";
import { formatAriary } from "../utils/formatting";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "../data";
import {
  Plus,
  Calendar,
  MapPin,
  Briefcase,
  Wallet,
  Trash2,
  Edit2,
  X,
  User as UserIcon,
  Heart,
} from "lucide-react";

export default function Projects() {
  const { projects, addProject, updateProject, deleteProject, users, currentUser, setCurrentProjectId, projectsForCurrentUser } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const planners = users.filter((u) => u.role === "planner" || u.role === "admin");
  const canEdit = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projets</h1>
          <p className="text-slate-500 mt-1">{projects.length} projets au total · {projectsForCurrentUser.length} visibles pour vous</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition"
          >
            <Plus className="w-4 h-4" />
            Nouveau projet
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => {
          const daysLeft = Math.max(0, Math.ceil((new Date(p.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          const assignedPlanners = p.assigned_planners.map((id) => users.find((u) => u.id === id)).filter(Boolean);
          const assignedClients = p.assigned_clients.map((id) => users.find((u) => u.id === id)).filter(Boolean);
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition overflow-hidden group">
              <div className="h-2" style={{ backgroundColor: p.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0" style={{ backgroundColor: p.color + "20" }}>
                      <Heart className="w-6 h-6" style={{ color: p.color }} fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{p.couple}</h3>
                      <span className={cn("inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded mt-1", PROJECT_STATUS_COLORS[p.status])}>
                        {PROJECT_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(p.id)} title="Modifier le projet" className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditing(p.id)} title="Assigner des utilisateurs" className="p-1.5 rounded hover:bg-indigo-100 text-indigo-600">
                        <UserIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Supprimer le projet ${p.couple} ? Toutes les données seront perdues.`)) deleteProject(p.id); }} title="Supprimer le projet" className="p-1.5 rounded hover:bg-red-100 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span className="ml-auto font-semibold text-indigo-600">J-{daysLeft}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{p.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span>Budget : {formatAriary(p.budget)}</span>
                  </div>
                </div>

                {p.notes && <p className="text-xs text-slate-500 line-clamp-2 mb-4 italic">{p.notes}</p>}

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Planificateurs ({assignedPlanners.length})
                    </p>
                    <div className="flex -space-x-2">
                      {assignedPlanners.map((u) => u && (
                        <div key={u.id} title={u.name} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow ring-2 ring-white" style={{ backgroundColor: u.color }}>
                          {u.name.charAt(0)}
                        </div>
                      ))}
                      {assignedPlanners.length === 0 && <span className="text-xs text-slate-400 italic">Aucun</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      Clients ({assignedClients.length})
                    </p>
                    <div className="flex -space-x-2">
                      {assignedClients.map((u) => u && (
                        <div key={u.id} title={u.name} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow ring-2 ring-white" style={{ backgroundColor: u.color }}>
                          {u.name.charAt(0)}
                        </div>
                      ))}
                      {assignedClients.length === 0 && <span className="text-xs text-slate-400 italic">Aucun</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setCurrentProjectId(p.id); }}
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 text-sm font-medium hover:from-indigo-100 hover:to-violet-100 transition"
                >
                  Ouvrir le projet
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(showAdd || editing) && (
        <ProjectModal
          project={editing ? projects.find((p) => p.id === editing) || null : null}
          planners={planners}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSave={(p) => {
            if (editing) updateProject(editing, p);
            else addProject(p as any);
            setShowAdd(false);
            setEditing(null);
          }}
          agencyId={currentUser?.agency_id || "agency_default"}
        />
      )}
    </div>
  );
}

function ProjectModal({ project, planners, onClose, onSave, agencyId }: {
  project: any;
  planners: any[];
  onClose: () => void;
  onSave: (p: any) => void;
  agencyId: string;
}) {
  const [form, setForm] = useState(project || {
    id: `proj_${Date.now()}`,
    agency_id: agencyId,
    name: "",
    couple: "",
    date: "",
    venue: "",
    status: "brouillon",
    color: "#4318FF",
    assigned_planners: [],
    assigned_clients: [],
    budget: 10000,
    notes: "",
  });

  const togglePlanner = (id: string) => {
    const cur = form.assigned_planners as string[];
    setForm({
      ...form,
      assigned_planners: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  };

  const toggleClient = (id: string) => {
    const cur = form.assigned_clients as string[];
    setForm({
      ...form,
      assigned_clients: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{project ? "Modifier" : "Nouveau"} projet</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Nom des mariés</span>
            <input className="input" value={form.couple} onChange={(e) => setForm({ ...form, couple: e.target.value, name: e.target.value })} placeholder="Ny Andry & Jenny" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Date</span>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Lieu</span>
              <input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Budget (Ar)</span>
              <input type="number" className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) })} /></label>
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Couleur</span>
              <input type="color" className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label>
          </div>
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Statut</span>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="brouillon">Brouillon</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </label>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">👥 Assigner aux planificateurs</p>
            <div className="space-y-1">
              {planners.map((p) => {
                const assigned = form.assigned_planners.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={assigned} onChange={() => togglePlanner(p.id)} className="w-4 h-4 rounded text-indigo-600" />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: p.color }}>{p.name.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.role}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">💑 Assigner aux clients (mariés)</p>
            <div className="space-y-1">
              {planners.filter(u => u.role === "client").map((u) => {
                const assigned = form.assigned_clients.includes(u.id);
                return (
                  <label key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={assigned} onChange={() => toggleClient(u.id)} className="w-4 h-4 rounded text-indigo-600" />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: u.color }}>{u.name.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.role}</p>
                    </div>
                  </label>
                );
              })}
              {planners.filter(u => u.role === "client").length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">Aucun client disponible</p>
              )}
            </div>
          </div>

          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Notes</span>
            <textarea className="input min-h-20" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
