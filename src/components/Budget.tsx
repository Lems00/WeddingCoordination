import { useState } from "react";
import { useApp } from "../store";
import type { BudgetExpense } from "../store";
import { cn } from "../utils/cn";
import { formatAriary } from "../utils/formatting";
import {
  Wallet,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  AlertCircle,
  Settings,
  TrendingDown,
} from "lucide-react";

const CATEGORIES = [
  "Coordination", "Lieu & Logistique", "Restauration", "Décoration",
  "Vidéo et photo", "Orchestre & Son", "Gâteaux", "Transport", "Autres",
];

export default function Budget() {
  const { currentProject: project, expenses, addExpense, updateExpense, deleteExpense, updateProject, currentUser, currentProjectId } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const canEdit = currentUser?.role === "admin" || currentUser?.role === "planner" || currentUser?.role === "super_admin";

  if (!project) return <div className="text-center py-12 text-slate-500">Aucun projet sélectionné</div>;

  const totalBudget = project.budget ?? 0;
  const totalPaid = expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0);
  const totalCommitted = totalPaid + totalPending;
  const remaining = totalBudget - totalCommitted;
  const budgetDefined = project.budget !== null && project.budget !== undefined;
  const spentPct = budgetDefined && totalBudget > 0 ? Math.min(100, (totalCommitted / totalBudget) * 100) : 0;
  const isOverBudget = budgetDefined && remaining < 0;
  const isNearBudget = budgetDefined && remaining >= 0 && remaining <= (totalBudget * 0.1); // 10%

  const byCategory = CATEGORIES.map((cat) => {
    const items = expenses.filter((e) => e.category === cat);
    const total = items.reduce((s, e) => s + e.amount, 0);
    return { category: cat, items, total };
  }).filter((c) => c.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Budget</h1>
          <p className="text-slate-500 mt-1">Suivi financier — {project.couple}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {canEdit && (
            <button
              onClick={() => setEditingBudget(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition"
            >
              <Settings className="w-4 h-4" />
              {budgetDefined ? "Modifier budget" : "Définir un budget"}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter dépense
            </button>
          )}
        </div>
      </div>

      {isOverBudget && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Budget dépassé !</p>
            <p className="text-sm text-red-700 mt-0.5">Les dépenses totales dépassent le budget de <strong>{formatAriary(Math.abs(remaining))}</strong></p>
          </div>
        </div>
      )}

      {isNearBudget && !isOverBudget && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Budget presque utilisé</p>
            <p className="text-sm text-amber-700 mt-0.5">Budget restant : <strong>{formatAriary(remaining)}</strong> ({(100 - spentPct).toFixed(0)}%)</p>
          </div>
        </div>
      )}

      {budgetDefined ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Budget total" value={formatAriary(totalBudget)} icon={<Wallet className="w-5 h-5" />} gradient="from-indigo-500 to-violet-600" bg="from-indigo-50 to-violet-50" iconColor="text-indigo-600" />
            <SummaryCard label="Payé" value={formatAriary(totalPaid)} icon={<ArrowUpRight className="w-5 h-5" />} gradient="from-emerald-500 to-teal-600" bg="from-emerald-50 to-teal-50" iconColor="text-emerald-600" />
            <SummaryCard label="En attente" value={formatAriary(totalPending)} icon={<ArrowDownRight className="w-5 h-5" />} gradient="from-amber-500 to-orange-600" bg="from-amber-50 to-orange-50" iconColor="text-amber-600" />
            <SummaryCard label="Reste à budgéter" value={formatAriary(remaining)} icon={<TrendingUp className="w-5 h-5" />} gradient={isOverBudget ? "from-red-500 to-pink-600" : "from-rose-500 to-pink-600"} bg={isOverBudget ? "from-red-50 to-pink-50" : "from-rose-50 to-pink-50"} iconColor={isOverBudget ? "text-red-600" : "text-rose-600"} warning={isOverBudget} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Utilisation du budget</h3>
              <span className={cn("text-sm font-semibold", isOverBudget ? "text-red-600" : "text-slate-700")}>{spentPct.toFixed(0)}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div className={cn("h-full transition", isOverBudget ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-emerald-500 to-emerald-400")} style={{ width: `${Math.min(100, (totalPaid / totalBudget) * 100)}%` }} />
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${Math.min(100 - (totalPaid / totalBudget) * 100, (totalPending / totalBudget) * 100)}%` }} />
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className={cn("w-2 h-2 rounded-full", isOverBudget ? "bg-red-500" : "bg-emerald-500")} /> Payé</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> En attente</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200" /> Disponible</span>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard label="Dépenses payées" value={formatAriary(totalPaid)} icon={<ArrowUpRight className="w-5 h-5" />} gradient="from-emerald-500 to-teal-600" bg="from-emerald-50 to-teal-50" iconColor="text-emerald-600" />
          <SummaryCard label="Dépenses en attente" value={formatAriary(totalPending)} icon={<ArrowDownRight className="w-5 h-5" />} gradient="from-amber-500 to-orange-600" bg="from-amber-50 to-orange-50" iconColor="text-amber-600" />
          <SummaryCard label="Total dépensé" value={formatAriary(totalCommitted)} icon={<TrendingDown className="w-5 h-5" />} gradient="from-slate-500 to-slate-600" bg="from-slate-50 to-slate-50" iconColor="text-slate-600" />
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mode</p>
              <p className="text-lg font-bold text-slate-900 mt-1">Suivi sans limite</p>
              <p className="text-xs text-slate-500 mt-2">Budget à définir</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Détail des dépenses</h2>
          <span className="ml-auto text-sm text-slate-500">{expenses.length} postes</span>
        </div>
        <div className="divide-y divide-slate-100">
          {expenses.map((e) => (
            <div key={e.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition group">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", e.paid ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400")}>
                {e.paid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{e.label}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{e.category}</span>
                  <span>{new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{formatAriary(e.amount)}</p>
                <p className={cn("text-xs", e.paid ? "text-emerald-600" : "text-amber-600")}>{e.paid ? "Payé" : "En attente"}</p>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setEditingExpense(e.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Supprimer cette dépense ?")) deleteExpense(e.id); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {expenses.length === 0 && <div className="px-6 py-12 text-center text-slate-400">Aucune dépense enregistrée</div>}
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Répartition par catégorie</h3>
          <div className="space-y-3">
            {byCategory.map((c) => {
              const pct = totalCommitted > 0 ? (c.total / totalCommitted) * 100 : 0;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-slate-700">{c.category}</span>
                    <span className="font-semibold text-slate-900">{formatAriary(c.total)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && canEdit && (
        <AddExpenseModal
          onClose={() => setShowAdd(false)}
          projectId={currentProjectId}
          onSave={(e: BudgetExpense) => { addExpense(e); setShowAdd(false); }}
        />
      )}

      {editingExpense && canEdit && (
        <EditExpenseModal
          expense={expenses.find((e) => e.id === editingExpense) || null}
          onClose={() => setEditingExpense(null)}
          onSave={(e: BudgetExpense) => { updateExpense(e); setEditingExpense(null); }}
        />
      )}

      {editingBudget && canEdit && project && (
        <EditBudgetModal
          project={project}
          onClose={() => setEditingBudget(false)}
          onSave={(budget: number | null) => { 
            updateProject(currentProjectId, { budget });
            setEditingBudget(false);
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, gradient, bg, iconColor, warning }: {
  label: string; value: string; icon: React.ReactNode; gradient: string; bg: string; iconColor: string; warning?: boolean;
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition group">
      <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition", gradient)} />
      <div className="relative">
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", bg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={cn("text-2xl font-bold mt-1", warning ? "text-red-600" : "text-slate-900")}>{value}</p>
      </div>
    </div>
  );
}

function AddExpenseModal({ onClose, onSave, projectId }: { onClose: () => void; onSave: (e: BudgetExpense) => void; projectId: string }) {
  const [form, setForm] = useState<{ label: string; category: string; amount: number; date: string; paid: boolean }>({
    label: "", category: "Autres", amount: 0, date: new Date().toISOString().split("T")[0], paid: false,
  });
  const handleSave = () => {
    if (!form.label || !form.amount) { alert("Label et montant requis"); return; }
    onSave({ id: `e_${Date.now()}`, project_id: projectId, ...form });
  };
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nouvelle dépense</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Description</span>
            <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Catégorie</span>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Montant (Ar)</span>
              <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} /></label>
          </div>
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Date</span>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-4 h-4 rounded text-indigo-600" />
            Marquer comme payé
          </label>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Ajouter</button>
        </div>
      </div>
    </div>
  );
}

function EditExpenseModal({ expense, onClose, onSave }: { expense: BudgetExpense | null; onClose: () => void; onSave: (e: BudgetExpense) => void }) {
  if (!expense) return null;

  const [form, setForm] = useState<BudgetExpense>(expense);

  const handleSave = () => {
    if (!form.label || !form.amount) { alert("Label et montant requis"); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Modifier la dépense</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Description</span>
            <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Catégorie</span>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Montant (Ar)</span>
              <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} /></label>
          </div>
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Date</span>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-4 h-4 rounded text-indigo-600" />
            Marquer comme payé
          </label>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-medium">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function EditBudgetModal({ project, onClose, onSave }: { project: any; onClose: () => void; onSave: (budget: number | null) => void }) {
  const [budget, setBudget] = useState<string>(project.budget?.toString() || "");
  const [mode, setMode] = useState<"defined" | "undefined">(project.budget !== null ? "defined" : "undefined");

  const handleSave = () => {
    if (mode === "undefined") {
      onSave(null);
    } else {
      const amount = parseFloat(budget);
      if (!budget || isNaN(amount) || amount < 0) {
        alert("Veuillez entrer un montant valide");
        return;
      }
      onSave(amount);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Configuration du budget</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => setMode("defined")}>
              <input type="radio" checked={mode === "defined"} onChange={() => setMode("defined")} className="w-4 h-4 text-indigo-600" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">Budget fixe</p>
                <p className="text-xs text-slate-500">Définir un budget connu au départ</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => setMode("undefined")}>
              <input type="radio" checked={mode === "undefined"} onChange={() => setMode("undefined")} className="w-4 h-4 text-indigo-600" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">Budget flexible</p>
                <p className="text-xs text-slate-500">Suivi des dépenses sans limite</p>
              </div>
            </label>
          </div>

          {mode === "defined" && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-2">Montant du budget (Ar)</span>
                <input
                  type="number"
                  className="input w-full text-lg font-semibold"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="ex: 5000000"
                  step="100000"
                />
              </label>
              <p className="text-xs text-slate-600 mt-2 px-2">
                💡 <strong>Budget fixe :</strong> Vous définissez un montant cible. Le système affichera l'utilisation en pourcentage et alertera si dépassement.
              </p>
            </div>
          )}

          {mode === "undefined" && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700 font-medium mb-2">Mode suivi flexible</p>
              <p className="text-xs text-slate-600">
                💡 <strong>Budget flexible :</strong> Aucune limite prédéfinie. Le système affiche uniquement les dépenses réelles. Idéal quand le budget est découvert au fil du temps.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
