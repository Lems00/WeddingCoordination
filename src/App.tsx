import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./store";
import Login from "./components/Login";
import Sidebar, { Page } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Tasks from "./components/Tasks";
import CalendarView from "./components/CalendarView";
import Conducteur from "./components/Conducteur";
import Vendors from "./components/Vendors";
import Budget from "./components/Budget";
import Team from "./components/Team";
import Projects from "./components/Projects";
import Settings from "./components/Settings";
import NotificationsPanel from "./components/NotificationsPanel";
import { Menu, CalendarHeart, PanelLeftOpen } from "lucide-react";

function AppShell() {
  const { currentUser, currentProject, loading } = useApp();
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("eventflow_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("eventflow_sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  // Apply theme to body whenever user/theme changes
  useEffect(() => {
    const theme = currentUser?.theme || "light";
    document.body.className = `theme-${theme}`;
  }, [currentUser?.theme, currentUser?.id]);

  if (!currentUser) {
    return <Login />;
  }

  if (loading && !currentProject) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--bg-main)", color: "var(--text-muted)" }}
      >
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm">Chargement de votre espace…</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "tasks": return <Tasks />;
      case "calendar": return <CalendarView />;
      case "conducteur": return <Conducteur />;
      case "vendors": return <Vendors />;
      case "budget": return <Budget />;
      case "team": return <Team />;
      case "projects": return <Projects />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  };

  const handleNavigate = (p: Page) => {
    setPage(p);
    setSidebarOpen(false);
  };

  const pageTitle: Record<Page, string> = {
    dashboard: "Tableau de bord",
    tasks: "Tâches",
    calendar: "Calendrier",
    conducteur: "Conducteur Jour J",
    vendors: "Prestataires",
    budget: "Budget",
    team: "Équipe",
    projects: "Projets",
    settings: "Paramètres",
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-main)", color: "var(--text-primary)" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <Sidebar
          currentPage={page}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5" />
            </button>
            {sidebarCollapsed && (
              <button
                onClick={toggleCollapse}
                className="hidden lg:block p-2 rounded-lg hover:bg-slate-100 transition"
                title="Déployer la barre latérale"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <CalendarHeart className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-400">/</span>
              </div>
              <h2 className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{pageTitle[page]}</h2>
              {currentProject && (page !== "projects" && page !== "settings" && page !== "team") && (
                <>
                  <span className="text-slate-400">/</span>
                  <span className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{currentProject.couple}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <NotificationsPanel />
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white"
                style={{ backgroundColor: currentUser.color }}
                title={currentUser.name}
              >
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
