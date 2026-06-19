import { useApp } from "../store";
import { STATUS_COLORS, PHASES } from "../data";
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Wallet,
  ListChecks,
  Flag,
  Briefcase,
} from "lucide-react";
import { cn } from "../utils/cn";

export default function Dashboard() {
  const { currentProject: project, tasks, vendors, users, expenses } = useApp();

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        Aucun projet accessible. Contactez votre coordinateur.
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Terminé").length;
  const inProgressTasks = tasks.filter((t) => t.status === "En cours").length;
  const todoTasks = tasks.filter((t) => t.status === "À faire").length;
  const blockedTasks = tasks.filter((t) => t.status === "Bloqué").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalBudget = project.budget ?? 0;
  const committed = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = totalBudget - committed;

  const daysLeft = Math.max(0, Math.ceil((new Date(project.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const phaseStats = PHASES.map((phase) => {
    const phaseTasks = tasks.filter((t) => t.phase === phase);
    const done = phaseTasks.filter((t) => t.status === "Terminé").length;
    return {
      phase,
      total: phaseTasks.length,
      done,
      progress: phaseTasks.length > 0 ? Math.round((done / phaseTasks.length) * 100) : 0,
    };
  });

  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== "Terminé")
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 6);

  const statCards = [
    { label: "Jours restants", value: daysLeft, suffix: "jours", icon: Calendar, gradient: "from-rose-500 to-pink-600", bg: "from-rose-50 to-pink-50", iconColor: "text-rose-600" },
    { label: "Tâches terminées", value: `${completedTasks}/${totalTasks}`, suffix: `${progress}%`, icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600", bg: "from-emerald-50 to-teal-50", iconColor: "text-emerald-600" },
    { label: "Budget restant", value: remaining.toLocaleString("fr-FR") + " Ar", suffix: `sur ${totalBudget.toLocaleString("fr-FR")} Ar`, icon: Wallet, gradient: "from-indigo-500 to-violet-600", bg: "from-indigo-50 to-violet-50", iconColor: "text-indigo-600" },
    { label: "Prestataires", value: vendors.length, suffix: `${vendors.filter((v) => v.statut === "Confirmé").length} confirmés`, icon: Users, gradient: "from-amber-500 to-orange-600", bg: "from-amber-50 to-orange-50", iconColor: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: project.color + "20" }}>
              <Briefcase className="w-5 h-5" style={{ color: project.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.couple}</h1>
              <p className="text-slate-500 text-sm">
                {new Date(project.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {project.venue}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-700">{project.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition group">
              <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition", card.gradient)} />
              <div className="relative">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", card.bg)}>
                  <Icon className={cn("w-5 h-5", card.iconColor)} />
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.suffix}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Progression globale</h2>
              <p className="text-sm text-slate-500">Avancement par phase</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
          </div>

          <div className="space-y-4">
            {phaseStats.map((ps) => (
              <div key={ps.phase}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      ps.phase === "Préparation" && "bg-indigo-500",
                      ps.phase === "Veille" && "bg-amber-500",
                      ps.phase === "Jour J" && "bg-rose-500",
                    )} />
                    <span className="text-sm font-medium text-slate-700">{ps.phase}</span>
                  </div>
                  <span className="text-sm text-slate-500">{ps.done}/{ps.total} · {ps.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      ps.phase === "Préparation" && "bg-gradient-to-r from-indigo-500 to-indigo-400",
                      ps.phase === "Veille" && "bg-gradient-to-r from-amber-500 to-amber-400",
                      ps.phase === "Jour J" && "bg-gradient-to-r from-rose-500 to-rose-400",
                    )}
                    style={{ width: `${ps.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="grid grid-cols-4 gap-3">
              <StatusBadge label="À faire" count={todoTasks} color="bg-slate-400" />
              <StatusBadge label="En cours" count={inProgressTasks} color="bg-blue-500" />
              <StatusBadge label="Terminé" count={completedTasks} color="bg-emerald-500" />
              <StatusBadge label="Bloqué" count={blockedTasks} color="bg-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Équipe projet</h2>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {[...project.assigned_planners, ...project.assigned_clients].map((uid) => {
              const u = users.find((x) => x.id === uid);
              if (!u) return null;
              return (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md" style={{ backgroundColor: u.color }}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500">
                      {u.role === "admin" ? "Coordinateur" : u.role === "planner" ? "Planner" : u.role === "super_admin" ? "Super admin" : "Client"}
                    </p>
                  </div>
                  {project.assigned_planners.includes(u.id) && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                      Planner
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-indigo-600" />
              Prochaines tâches
            </h2>
            <p className="text-sm text-slate-500">Les tâches à venir les plus proches</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingTasks.map((t) => {
            const sc = STATUS_COLORS[t.status];
            return (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{t.id}</span>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", sc.bg, sc.text)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                    {t.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-3">{t.task}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>{t.category}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(t.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-xs text-slate-600 flex-1">{label}</span>
      <span className="text-xs font-semibold text-slate-900">{count}</span>
    </div>
  );
}
