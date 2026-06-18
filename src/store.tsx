import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  User,
  Project,
  Task,
  Vendor,
  BudgetExpense,
  Notification,
  TaskStatus,
  DEFAULT_USERS,
  DEFAULT_PROJECTS,
  DEFAULT_TASKS,
  DEFAULT_PRESTATAIRES,
  DEFAULT_BUDGET_EXPENSES,
  DEFAULT_NOTIFICATIONS,
} from "./data";
import { api, setToken } from "./apiClient";
import { visibleProjectsFor } from "./access";

// Re-export data types
export type { User, Project, Task, Vendor, BudgetExpense, Notification };
export type { BudgetExpense as BudgetExpenseType };

const STORAGE_KEY = "wedding_saas_state_v2";

// Bascule localStorage (démo) <-> API D1. Activée via .env : VITE_USE_API=true.
// Permet une migration réversible (cf. Jalon 2 du plan « Fondations d'abord »).
const USE_API = import.meta.env.VITE_USE_API === "true";

/**
 * Lance une synchronisation API en arrière-plan (mutations optimistes).
 * No-op en mode localStorage. Les erreurs sont journalisées ; l'appelant a
 * déjà mis à jour l'état local, et les rechargements par projet resynchronisent.
 */
function apiSync(run: () => Promise<unknown>) {
  if (!USE_API) return;
  run().catch((e) => console.error("[api] synchronisation échouée :", e));
}

interface PersistedState {
  users: User[];
  projects: Project[];
  tasks: Task[];
  vendors: Vendor[];
  expenses: BudgetExpense[];
  notifications: Notification[];
  currentUserId: string | null;
  currentProjectId: string | null;
}

function loadState(): PersistedState {
  // En mode API, ignorer localStorage au démarrage pour éviter les données périmées
  // MAIS charger le currentUserId (la session utilisateur)
  if (USE_API) {
    let currentUserId = null;
    try {
      const session = localStorage.getItem("wedding_saas_session");
      if (session) {
        const parsed = JSON.parse(session);
        currentUserId = parsed.currentUserId;
      }
    } catch {}
    return {
      users: [],
      projects: [],
      tasks: [],
      vendors: [],
      expenses: [],
      notifications: [],
      currentUserId,
      currentProjectId: null,
    };
  }

  // En mode localStorage seulement (démo), charger les données persistées
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    users: DEFAULT_USERS,
    projects: DEFAULT_PROJECTS,
    tasks: DEFAULT_TASKS,
    vendors: DEFAULT_PRESTATAIRES,
    expenses: DEFAULT_BUDGET_EXPENSES,
    notifications: DEFAULT_NOTIFICATIONS,
    currentUserId: null,
    currentProjectId: null,
  };
}

interface AppState {
  currentUser: User | null;
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;

  users: User[];
  projects: Project[];
  tasks: Task[];
  allTasks: Task[];
  vendors: Vendor[];
  allVendors: Vendor[];
  expenses: BudgetExpense[];
  notifications: Notification[];

  currentProject: Project | null;

  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  setUserTheme: (userId: string, theme: string) => void;

  addProject: (project: Project) => void;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;

  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;

  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (vendorId: string) => void;

  addExpense: (expense: BudgetExpense) => void;
  updateExpense: (expense: BudgetExpense) => void;
  deleteExpense: (id: string) => void;

  pushNotification: (n: Omit<Notification, "id" | "is_read" | "created_at">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;

  getProjectById: (id: string) => Project | undefined;
  getUserById: (id: string) => User | undefined;
  projectsForCurrentUser: Project[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isPlanner: boolean;
  isClient: boolean;
  canEdit: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const [users, setUsers] = useState<User[]>(initial.users);
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  const [tasksState, setTasksState] = useState<Task[]>(initial.tasks);
  const [vendorsState, setVendorsState] = useState<Vendor[]>(initial.vendors);
  const [expensesState, setExpensesState] = useState<BudgetExpense[]>(initial.expenses);
  const [notifications, setNotifications] = useState<Notification[]>(initial.notifications);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initial.currentUserId);
  const [currentProjectId, setCurrentProjectIdState] = useState<string>(
    initial.currentProjectId || initial.projects[0]?.id || ""
  );
  const [loading, setLoading] = useState<boolean>(false);

  // En mode API, NE PAS persister les données métier en localStorage
  // (la source de vérité est D1). Seule la session utilisateur est préservée.
  // En mode localStorage, persister l'état complet pour la démo.
  useEffect(() => {
    if (USE_API) {
      // En mode API : ne persister que le currentUserId (pour la session)
      try {
        localStorage.setItem("wedding_saas_session", JSON.stringify({ currentUserId }));
      } catch {}
      return;
    }

    // En mode localStorage : persister tout
    const state: PersistedState = {
      users, projects, tasks: tasksState, vendors: vendorsState,
      expenses: expensesState, notifications,
      currentUserId, currentProjectId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [users, projects, tasksState, vendorsState, expensesState, notifications, currentUserId, currentProjectId]);

  const currentUser = currentUserId ? users.find((u) => u.id === currentUserId) || null : null;

  const effectiveProjectId = projects.find((p) => p.id === currentProjectId)
    ? currentProjectId
    : projects[0]?.id || "";
  const currentProject = projects.find((p) => p.id === effectiveProjectId) || null;

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdmin = currentUser?.role === "admin";
  const isPlanner = currentUser?.role === "planner";
  const isClient = currentUser?.role === "client";
  const canEdit = isSuperAdmin || isAdmin || isPlanner;

  const projectsForCurrentUser: Project[] = visibleProjectsFor(currentUser, projects);

  useEffect(() => {
    if (currentUser && !projectsForCurrentUser.find((p) => p.id === effectiveProjectId)) {
      const first = projectsForCurrentUser[0];
      if (first) setCurrentProjectIdState(first.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const setCurrentProjectId = useCallback((id: string) => setCurrentProjectIdState(id), []);

  // ==========================================================================
  //  Chargement depuis l'API (mode USE_API)
  // ==========================================================================

  /** Charge les collections globales (utilisateurs, projets, notifications). */
  const loadAllForUser = useCallback(async (userId: string) => {
    if (!USE_API) return;
    setLoading(true);
    try {
      const [us, projs, notifs] = await Promise.all([
        api.listUsers(),
        api.listProjects(),
        api.listNotifications(userId),
      ]);
      setUsers(us);
      setProjects(projs);
      setNotifications(notifs);
    } catch (e) {
      console.error("[api] chargement initial échoué :", e);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Charge les données d'un projet (tâches, prestataires, dépenses) et les fusionne. */
  const loadProjectData = useCallback(async (projectId: string) => {
    if (!USE_API || !projectId) return;
    try {
      const [tasks, vendors, expenses] = await Promise.all([
        api.listTasks(projectId),
        api.listVendors(projectId),
        api.listExpenses(projectId),
      ]);
      setTasksState((prev) => [...prev.filter((t) => t.project_id !== projectId), ...tasks]);
      setVendorsState((prev) => [...prev.filter((v) => v.project_id !== projectId), ...vendors]);
      setExpensesState((prev) => [...prev.filter((e) => e.project_id !== projectId), ...expenses]);
    } catch (e) {
      console.error("[api] chargement du projet échoué :", e);
    }
  }, []);

  // Restaure la session au montage si un utilisateur + un token sont présents.
  useEffect(() => {
    if (USE_API && currentUserId) {
      loadAllForUser(currentUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharge les données scopées quand le projet courant change.
  useEffect(() => {
    if (USE_API && effectiveProjectId) loadProjectData(effectiveProjectId);
  }, [effectiveProjectId, loadProjectData]);

  // Synchronise les données au focus (permet à plusieurs appareils d'être à jour).
  useEffect(() => {
    const handleFocus = () => {
      if (USE_API && currentUserId && effectiveProjectId) {
        console.log("[sync] Synchronisation au focus...");
        loadAllForUser(currentUserId);
        loadProjectData(effectiveProjectId);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [currentUserId, effectiveProjectId, loadAllForUser, loadProjectData]);

  const scopedTasks = tasksState.filter((t) => t.project_id === effectiveProjectId);
  const scopedVendors = vendorsState.filter((v) => v.project_id === effectiveProjectId);
  const scopedExpenses = expensesState.filter((e) => e.project_id === effectiveProjectId);
  const scopedNotifications = currentUser
    ? notifications.filter((n) => n.user_id === currentUser.id)
    : [];
  const unreadCount = scopedNotifications.filter((n) => !n.is_read).length;

  const login = async (username: string, password: string): Promise<boolean> => {
    if (USE_API) {
      try {
        const res = await api.login(username, password);
        if (!res.ok || !res.token) return false;
        setToken(res.token);
        await loadAllForUser(res.user.id);
        setCurrentUserId(res.user.id);
        return true;
      } catch (e) {
        console.error("[api] login échoué :", e);
        return false;
      }
    }

    // Mode localStorage (démo) : comparaison en clair côté client.
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (user) {
      setCurrentUserId(user.id);
      const visible = visibleProjectsFor(user, projects);
      if (visible.length > 0 && !visible.find((p) => p.id === currentProjectId)) {
        setCurrentProjectIdState(visible[0].id);
      }
      return true;
    }
    return false;
  };
  const logout = () => {
    setCurrentUserId(null);
    setUsers([]);
    setProjects([]);
    setTasksState([]);
    setVendorsState([]);
    setExpensesState([]);
    setNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("wedding_saas_session");
    } catch {}
    if (USE_API) setToken(null);
  };

  const getProjectById = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);
  const getUserById = useCallback((id: string) => users.find((u) => u.id === id), [users]);

  const pushNotification = useCallback((n: Omit<Notification, "id" | "is_read" | "created_at">) => {
    const newN: Notification = {
      ...n,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newN, ...prev]);
    apiSync(() => api.createNotification(newN));
  }, []);

  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
    apiSync(() => api.createUser(user));
    if (user.role === "planner" || user.role === "admin") {
      pushNotification({
        user_id: user.id,
        project_id: null,
        type: "info",
        title: "Bienvenue dans l'équipe",
        message: `Votre compte ${user.role === "admin" ? "agence" : "planner"} a été créé.`,
        related_entity_type: null,
        related_entity_id: null,
      });
    }
  };
  const updateUser = (user: User) => {
    const oldUser = users.find((u) => u.id === user.id);
    const nameChanged = oldUser && oldUser.name !== user.name;

    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));

    // Synchroniser les changements de nom dans les tâches et autres entités
    if (nameChanged) {
      setTasksState((prev) =>
        prev.map((t) => (t.responsible_user_id === user.id ? { ...t } : t))
      );
    }

    apiSync(() => api.updateUser(user));
  };
  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    // Supprimer aussi les assignations de projets et tâches de cet utilisateur
    setTasksState((prev) => prev.map((t) => (t.responsible_user_id === userId ? { ...t, responsible_user_id: null } : t)));
    apiSync(() => api.deleteUser(userId));
  };
  const setUserTheme = (userId: string, theme: string) => {
    let updated: User | undefined;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        updated = { ...u, theme: theme as User["theme"] };
        return updated;
      })
    );
    apiSync(() => (updated ? api.updateUser(updated) : Promise.resolve()));
  };

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
    apiSync(() => api.createProject(project));
    project.assigned_planners.forEach((pid) => {
      pushNotification({
        user_id: pid,
        project_id: project.id,
        type: "project_assigned",
        title: "Nouveau projet assigné",
        message: `Vous avez été assigné(e) au projet « ${project.name} ».`,
        related_entity_type: "project",
        related_entity_id: project.id,
      });
    });
  };
  const updateProject = (projectId: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...patch } : p)));
    apiSync(() => {
      const existing = projects.find((p) => p.id === projectId);
      if (!existing) return Promise.resolve();
      return api.updateProject({ ...existing, ...patch });
    });
  };
  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasksState((prev) => prev.filter((t) => t.project_id !== projectId));
    setVendorsState((prev) => prev.filter((v) => v.project_id !== projectId));
    setExpensesState((prev) => prev.filter((e) => e.project_id !== projectId));
    apiSync(() => api.deleteProject(projectId));
  };

  const addTask = (task: Task) => {
    setTasksState((prev) => [...prev, task]);
    apiSync(() => api.createTask(task));
    if (task.responsible_user_id) {
      pushNotification({
        user_id: task.responsible_user_id,
        project_id: task.project_id,
        type: "task_assigned",
        title: "Nouvelle tâche assignée",
        message: `Vous avez été assigné(e) à « ${task.task} ».`,
        related_entity_type: "task",
        related_entity_id: task.id,
      });
    }
  };
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const target = tasksState.find((t) => t.id === taskId);
    if (target?.responsible_user_id) {
      pushNotification({
        user_id: target.responsible_user_id,
        project_id: target.project_id,
        type: "task_status",
        title: `Tâche : ${status}`,
        message: `« ${target.task} » est maintenant ${status}.`,
        related_entity_type: "task",
        related_entity_id: taskId,
      });
    }
    setTasksState((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    if (target) apiSync(() => api.updateTaskStatus(taskId, target.project_id, status));
  };
  const updateTask = (taskOrId: Task | string, updates?: Partial<Task>) => {
    // Supporter deux signatures : updateTask(task) ou updateTask(id, {updates})
    let taskId: string;
    let newTask: Task | null = null;

    if (typeof taskOrId === "string") {
      taskId = taskOrId;
      if (!updates) return;
      const existing = tasksState.find((t) => t.id === taskId);
      if (!existing) return;
      newTask = { ...existing, ...updates };
    } else {
      taskId = taskOrId.id;
      newTask = taskOrId;
    }

    setTasksState((prev) => prev.map((t) => (t.id === taskId ? newTask! : t)));
    if (newTask) {
      apiSync(() => api.updateTask(newTask!));
    }
  };
  const deleteTask = (taskId: string) => {
    const target = tasksState.find((t) => t.id === taskId);
    setTasksState((prev) => prev.filter((t) => t.id !== taskId));
    apiSync(() => api.deleteTask(taskId, target?.project_id));
  };

  const addVendor = (vendor: Vendor) => {
    setVendorsState((prev) => [...prev, vendor]);
    apiSync(() => api.createVendor(vendor));
    const proj = projects.find((p) => p.id === vendor.project_id);
    if (proj) {
      proj.assigned_planners.forEach((pid) => {
        pushNotification({
          user_id: pid,
          project_id: vendor.project_id,
          type: "vendor_added",
          title: "Prestataire ajouté",
          message: `${vendor.name} (${vendor.role}) a été ajouté au projet.`,
          related_entity_type: "vendor",
          related_entity_id: vendor.id,
        });
      });
    }
  };
  const updateVendor = (vendor: Vendor) => {
    setVendorsState((prev) => prev.map((v) => (v.id === vendor.id ? vendor : v)));
    apiSync(() => api.updateVendor(vendor));
  };
  const deleteVendor = (id: string) => {
    setVendorsState((prev) => prev.filter((v) => v.id !== id));
    apiSync(() => api.deleteVendor(id));
  };

  const addExpense = (expense: BudgetExpense) => {
    setExpensesState((prev) => [...prev, expense]);
    apiSync(() => api.createExpense(expense));
    const proj = projects.find((p) => p.id === expense.project_id);
    if (proj) {
      proj.assigned_planners.forEach((pid) => {
        pushNotification({
          user_id: pid,
          project_id: expense.project_id,
          type: "budget_added",
          title: "Nouvelle dépense",
          message: `${expense.label} — ${expense.amount.toLocaleString("fr-FR")} Ar (${expense.paid ? "payé" : "en attente"}).`,
          related_entity_type: "expense",
          related_entity_id: expense.id,
        });
      });
    }
  };
  const updateExpense = (expense: BudgetExpense) => {
    setExpensesState((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    apiSync(() => api.updateExpense(expense));
  };
  const deleteExpense = (id: string) => {
    setExpensesState((prev) => prev.filter((e) => e.id !== id));
    apiSync(() => api.deleteExpense(id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    apiSync(() => api.markNotificationRead(id));
  };
  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setNotifications((prev) =>
      prev.map((n) => (n.user_id === uid ? { ...n, is_read: true } : n))
    );
    apiSync(() => api.markAllNotificationsRead(uid));
  };

  const value: AppState = {
    currentUser,
    currentProjectId: effectiveProjectId,
    setCurrentProjectId,
    login,
    logout,
    loading,
    users,
    projects,
    tasks: scopedTasks,
    allTasks: tasksState,
    vendors: scopedVendors,
    allVendors: vendorsState,
    expenses: scopedExpenses,
    notifications: scopedNotifications,
    currentProject,
    addUser,
    updateUser,
    deleteUser,
    setUserTheme,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addVendor,
    updateVendor,
    deleteVendor,
    addExpense,
    updateExpense,
    deleteExpense,
    pushNotification,
    markNotificationRead,
    markAllNotificationsRead,
    unreadCount,
    getProjectById,
    getUserById,
    projectsForCurrentUser,
    isSuperAdmin,
    isAdmin,
    isPlanner,
    isClient,
    canEdit,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
