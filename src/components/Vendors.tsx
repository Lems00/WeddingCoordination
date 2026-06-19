import { useState } from "react";
import { useApp } from "../store";
import { Vendor } from "../data";
import { cn } from "../utils/cn";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  Package,
} from "lucide-react";

export default function Vendors() {
  const { vendors, addVendor, updateVendor, deleteVendor, currentUser, tasks, currentProjectId } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const canEdit = currentUser?.role === "admin";

  const filtered = vendors.filter((v) => {
    if (statusFilter !== "all" && v.statut !== statusFilter) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getTaskCount = (vendorName: string) => {
    // Lien vendor <-> tasks via le libellé `responsible` (les noms de prestataires
    // correspondent aux libellés de responsable, cf. données D1).
    const target = vendorName.trim().toLowerCase();
    return tasks.filter((t) => (t.responsible || "").trim().toLowerCase() === target).length;
  };

  const confirmedCount = vendors.filter((v) => v.statut === "Confirmé").length;
  const searchingCount = vendors.filter((v) => v.statut === "En recherche").length;

  const COLORS = ["#4318FF", "#05CD99", "#FFCE20", "#EE5D50", "#7551FF", "#FF6B35", "#00BCD4", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Prestataires</h1>
          <p className="text-slate-500 mt-1">
            {vendors.length} prestataires · {confirmedCount} confirmés · {searchingCount} en recherche
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter prestataire
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un prestataire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {[
              { v: "all", label: "Tous" },
              { v: "Confirmé", label: "Confirmés" },
              { v: "En recherche", label: "En recherche" },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setStatusFilter(f.v)}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition",
                  statusFilter === f.v ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => {
          const taskCount = getTaskCount(v.name);
          return (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: v.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
                      style={{ backgroundColor: v.color }}
                    >
                      {v.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{v.name}</h3>
                      <p className="text-sm text-slate-500 truncate">{v.role}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0",
                    v.statut === "Confirmé" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {v.statut === "Confirmé" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {v.statut}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tâches assignées</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-400" />
                      {taskCount}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Statut</p>
                    <p className="text-sm font-bold text-slate-900">{v.statut}</p>
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setEditing(v)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Modifier
                    </button>
                    <button
                      onClick={() => { if (confirm(`Supprimer ${v.name} ?`)) deleteVendor(v.id); }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">Aucun prestataire trouvé</div>
      )}

      {/* Add/Edit modal */}
      {(showAdd || editing) && (
        <VendorModal
          vendor={editing}
          projectId={currentProjectId}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSave={(v) => {
            if (editing) updateVendor(v);
            else addVendor({ ...v, id: v.id || `v_${Date.now()}`, project_id: currentProjectId, color: v.color || COLORS[vendors.length % COLORS.length] });
            setShowAdd(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function VendorModal({ vendor, onClose, onSave, projectId }: { vendor: Vendor | null; onClose: () => void; onSave: (v: Vendor) => void; projectId: string }) {
  const [form, setForm] = useState<Vendor>(vendor || {
    id: "",
    project_id: projectId,
    name: "",
    role: "",
    color: "#4318FF",
    statut: "Confirmé",
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{vendor ? "Modifier" : "Ajouter"} prestataire</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Nom</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Rôle / Spécialité</span>
            <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Statut</span>
              <select className="input" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                <option>Confirmé</option>
                <option>En recherche</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Couleur</span>
              <input type="color" className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </label>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// unused import cleanup
void Phone;
void Mail;
