import {
  LayoutDashboard,
  ListTodo,
  Users,
  Wallet,
  CalendarHeart,
  LogOut,
  Calendar,
  MapPin,
  ChevronRight,
  ChevronDown,
  Briefcase,
  FolderKanban,
  Palette,
  Settings,
  Flag,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useApp } from "../store";
import { cn } from "../utils/cn";
import { PROJECT_STATUS_LABELS } from "../data";
import { useState } from "react";
import { THEMES, ThemeId } from "../themes";

export type Page = "dashboard" | "tasks" | "calendar" | "conducteur" | "vendors" | "budget" | "team" | "projects" | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems: { id: Page; label: string; icon: React.ElementType; adminOnly?: boolean; superAdminOnly?: boolean }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "tasks", label: "Tâches & Planning", icon: ListTodo },
  { id: "calendar", label: "Calendrier", icon: Calendar },
  { id: "conducteur", label: "Conducteur Jour J", icon: Flag },
  { id: "vendors", label: "Prestataires", icon: Users },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "projects", label: "Projets", icon: FolderKanban, adminOnly: true },
  { id: "team", label: "Équipe", icon: Users, adminOnly: true },
];

export default function Sidebar({ currentPage, onNavigate, collapsed = false, onToggleCollapse }: SidebarProps) {
  const {
    currentUser,
    currentProject: project,
    logout,
    projectsForCurrentUser,
    currentProjectId,
    setCurrentProjectId,
    setUserTheme,
    isSuperAdmin,
    isAdmin,
  } = useApp();

  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const daysLeft = project ? Math.max(0, Math.ceil((new Date(project.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const visibleMenu = menuItems.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdmin && !isSuperAdmin) return false;
    return true;
  });

  // ==========================================================================
  //  COLLAPSED (rail) MODE
  // ==========================================================================
  if (collapsed) {
    return (
      <aside className="flex flex-col w-20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white h-screen sticky top-0 items-center">
        {/* Logo + expand button */}
        <div className="pt-6 pb-4 border-b border-white/5 w-full flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CalendarHeart className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Déployer la barre latérale"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        </div>

        {/* Current project indicator */}
        <div className="py-3 border-b border-white/5 w-full flex justify-center">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow"
            style={{ backgroundColor: project?.color || "#64748b" }}
            title={project ? project.couple : "Aucun projet"}
          >
            <Briefcase className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Navigation icons */}
        <nav className="flex-1 py-4 w-full flex flex-col items-center gap-1.5 overflow-y-auto no-scrollbar">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-xl transition group relative",
                  active
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 shadow-lg">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer icons */}
        <div className="py-4 w-full flex flex-col items-center gap-2 border-t border-white/5">
          <button
            onClick={() => onNavigate("settings")}
            title="Paramètres"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
            style={{ backgroundColor: currentUser?.color || "#4318FF" }}
            title={currentUser?.name}
          >
            {currentUser?.name.charAt(0)}
          </div>
          <button
            onClick={logout}
            title="Déconnexion"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
    );
  }

  // ==========================================================================
  //  EXPANDED (full) MODE
  // ==========================================================================
  return (
    <aside className="flex flex-col w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white h-screen sticky top-0">
      {/* Logo + collapse button */}
      <div className="px-6 pt-7 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CalendarHeart className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg tracking-tight">EventFlow</h1>
            <p className="text-xs text-slate-400">Pro Edition</p>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition hidden lg:block"
              title="Réduire la barre latérale"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Project picker */}
      <div className="px-4 py-4 border-b border-white/5">
        <button
          onClick={() => setShowProjectPicker(!showProjectPicker)}
          className="w-full rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 hover:bg-white/10 transition text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center shadow" style={{ backgroundColor: project?.color || "#64748b" }}>
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Projet</p>
                <p className="font-semibold text-sm truncate">
                  {project ? project.couple : "—"}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition", showProjectPicker && "rotate-180")} />
          </div>

          {project && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(project.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{project.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    style={{ width: `${Math.max(5, Math.min(95, 100 - (daysLeft / 45) * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-indigo-300 whitespace-nowrap">J-{daysLeft}</span>
              </div>
            </div>
          )}
        </button>

        {showProjectPicker && (
          <div className="mt-2 rounded-xl bg-slate-800 border border-white/10 overflow-hidden shadow-xl">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-white/5">
              Mes projets ({projectsForCurrentUser.length})
            </p>
            <div className="max-h-60 overflow-y-auto">
              {projectsForCurrentUser.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentProjectId(p.id); setShowProjectPicker(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition",
                    p.id === currentProjectId && "bg-indigo-500/10"
                  )}
                >
                  <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.couple}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {PROJECT_STATUS_LABELS[p.status]}
                    </p>
                  </div>
                  {p.id === currentProjectId && (
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">Navigation</p>
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group",
                active
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-400 group-hover:text-white")} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className={cn("w-3.5 h-3.5 transition", active ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
            </button>
          );
        })}
      </nav>

      {/* Theme switcher */}
      <div className="px-4 py-2 border-t border-white/5">
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition"
          >
            <Palette className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-left">Thème</span>
            <span className="text-xs text-slate-500 capitalize">{currentUser?.theme || "light"}</span>
          </button>
          {showThemePicker && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-1 z-10">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (currentUser) {
                      setUserTheme(currentUser.id, t.id as ThemeId);
                      document.body.className = `theme-${t.id}`;
                    }
                    setShowThemePicker(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left hover:bg-white/5 transition",
                    currentUser?.theme === t.id && "bg-indigo-500/20 text-white"
                  )}
                >
                  <div className="flex -space-x-1 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.preview.bg }} />
                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.preview.accent }} />
                  </div>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User section */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
            style={{ backgroundColor: currentUser?.color || "#4318FF" }}
          >
            {currentUser?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-400">
              {isSuperAdmin ? "Super admin" : isAdmin ? "Agence" : currentUser?.role === "planner" ? "Planner" : "Client"}
            </p>
          </div>
          <button
            onClick={() => onNavigate("settings")}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
