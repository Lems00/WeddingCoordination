/**
 * Client API front-end (JavaScript) pour les Cloudflare Pages Functions.
 *
 * Ce module est la SEULE frontière entre le store React (formes « front »)
 * et l'API D1 (formes « base de données »). Il contient :
 *   1. un transport HTTP minimal (request) avec injection du token d'auth ;
 *   2. une COUCHE DE MAPPING bidirectionnelle par entité — c'est ici que sont
 *      réconciliés les écarts de schéma front <-> DB :
 *        - tâche : front `task`/`responsible`  <-> DB `name`/`responsible_name`
 *        - prestataire : front `statut` (libellé)  <-> DB `statut` (code)
 *        - booléens front (`paid`, `is_read`)  <-> entiers 0/1 en DB
 *   3. l'objet `api` exposant des méthodes qui renvoient/acceptent déjà des
 *      objets au format front (le store n'a jamais à connaître le schéma DB).
 *
 * Fichier en .js volontairement : portable tel quel vers Cloudflare.
 */

const BASE = "/api";
const TOKEN_KEY = "wedding_saas_token";

// --- Token de session (posé par login, voir Jalon 1) ---------------------
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erreur API (${res.status})`);
  }
  return res.json();
}

// ===========================================================================
//  MAPPERS — DB <-> front
// ===========================================================================

// --- Prestataires : statut code <-> libellé affiché ---
const VENDOR_STATUT_TO_LABEL = {
  confirme: "Confirmé",
  en_recherche: "En recherche",
  contacte: "Contacté",
  refuse: "Refusé",
};
const VENDOR_LABEL_TO_STATUT = Object.fromEntries(
  Object.entries(VENDOR_STATUT_TO_LABEL).map(([code, label]) => [label, code])
);

// --- Tâches ---
function taskFromDb(row) {
  return {
    id: row.id,
    project_id: row.project_id,
    phase: row.phase,
    category: row.category || "",
    task: row.name,
    duration: row.duration || "",
    start_date: row.start_date,
    end_date: row.end_date,
    predecessor: row.predecessor || "",
    responsible: row.responsible_name || "",
    responsible_user_id: row.responsible_user_id || null,
    status: row.status,
  };
}
function taskToApi(t) {
  return {
    id: t.id,
    project_id: t.project_id,
    phase: t.phase,
    category: t.category,
    name: t.task,
    duration: t.duration,
    start_date: t.start_date,
    end_date: t.end_date,
    predecessor: t.predecessor || "",
    responsible_name: t.responsible || "",
    responsible_user_id: t.responsible_user_id || null,
    status: t.status,
  };
}

// --- Prestataires ---
function vendorFromDb(row) {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    role: row.role || "",
    color: row.color || "#4318FF",
    statut: VENDOR_STATUT_TO_LABEL[row.statut] || row.statut,
  };
}
function vendorToApi(v) {
  return {
    id: v.id,
    project_id: v.project_id,
    name: v.name,
    role: v.role,
    color: v.color,
    statut: VENDOR_LABEL_TO_STATUT[v.statut] || "en_recherche",
  };
}

// --- Dépenses ---
function expenseFromDb(row) {
  return {
    id: row.id,
    project_id: row.project_id,
    label: row.label,
    category: row.category || "",
    amount: Number(row.amount || 0),
    date: row.date,
    paid: !!row.paid,
  };
}
function expenseToApi(e) {
  return {
    id: e.id,
    project_id: e.project_id,
    label: e.label,
    category: e.category,
    amount: e.amount,
    date: e.date,
    paid: !!e.paid,
  };
}

// --- Notifications ---
function notificationFromDb(row) {
  return { ...row, is_read: !!row.is_read };
}

// --- Projets (les tableaux d'assignation sont déjà fournis par l'API) ---
function projectFromDb(row) {
  return {
    ...row,
    assigned_planners: row.assigned_planners || [],
    assigned_clients: row.assigned_clients || [],
  };
}

// ===========================================================================
//  API — méthodes au format front
// ===========================================================================

export const api = {
  health: () => request("/health"),

  // --- Auth ---
  login: (username, password) =>
    request("/auth", { method: "POST", body: JSON.stringify({ username, password }) }),

  // --- Utilisateurs ---
  listUsers: () => request("/users").then((d) => d.users || []),
  createUser: (user) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify({ ...user, password_hash: user.password || "" }),
    }),
  updateUser: (user) =>
    request("/users", {
      method: "PUT",
      body: JSON.stringify({ ...user, ...(user.password ? { password_hash: user.password } : {}) }),
    }),
  deleteUser: (id) => request(`/users?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  // --- Projets ---
  listProjects: () => request("/projects").then((d) => (d.projects || []).map(projectFromDb)),
  createProject: (project) =>
    request("/projects", { method: "POST", body: JSON.stringify(project) }),
  updateProject: (project) =>
    request("/projects", { method: "PUT", body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/projects?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  // --- Tâches ---
  listTasks: (projectId) =>
    request(`/tasks${projectId ? `?project_id=${encodeURIComponent(projectId)}` : ""}`).then(
      (d) => (d.tasks || []).map(taskFromDb)
    ),
  createTask: (task) =>
    request("/tasks", { method: "POST", body: JSON.stringify(taskToApi(task)) }),
  updateTask: (task) =>
    request("/tasks", { method: "PUT", body: JSON.stringify(taskToApi(task)) }),
  updateTaskStatus: (id, projectId, status) =>
    request("/tasks", {
      method: "PUT",
      body: JSON.stringify({ id, project_id: projectId, status }),
    }),
  deleteTask: (id, projectId) =>
    request(
      `/tasks?id=${encodeURIComponent(id)}${projectId ? `&project_id=${encodeURIComponent(projectId)}` : ""}`,
      { method: "DELETE" }
    ),

  // --- Prestataires ---
  listVendors: (projectId) =>
    request(`/vendors?project_id=${encodeURIComponent(projectId)}`).then((d) =>
      (d.vendors || []).map(vendorFromDb)
    ),
  createVendor: (vendor) =>
    request("/vendors", { method: "POST", body: JSON.stringify(vendorToApi(vendor)) }),
  updateVendor: (vendor) =>
    request("/vendors", { method: "PUT", body: JSON.stringify(vendorToApi(vendor)) }),
  deleteVendor: (id) => request(`/vendors?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  // --- Budget / dépenses ---
  listExpenses: (projectId) =>
    request(`/budget?project_id=${encodeURIComponent(projectId)}`).then((d) =>
      (d.expenses || []).map(expenseFromDb)
    ),
  createExpense: (expense) =>
    request("/budget", { method: "POST", body: JSON.stringify(expenseToApi(expense)) }),
  updateExpense: (expense) =>
    request("/budget", { method: "PUT", body: JSON.stringify(expenseToApi(expense)) }),
  deleteExpense: (id) => request(`/budget?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  // --- Notifications ---
  listNotifications: (userId) =>
    request(`/notifications?user_id=${encodeURIComponent(userId)}`).then((d) =>
      (d.notifications || []).map(notificationFromDb)
    ),
  createNotification: (n) =>
    request("/notifications", { method: "POST", body: JSON.stringify(n) }),
  markNotificationRead: (id) =>
    request("/notifications", { method: "PATCH", body: JSON.stringify({ id }) }),
  markAllNotificationsRead: (userId) =>
    request("/notifications", {
      method: "PATCH",
      body: JSON.stringify({ markAll: true, user_id: userId }),
    }),

  // --- Conducteur (jours + phases) ---
  // GET renvoie déjà l'arborescence au format front (ConducteurJour[]) — pas de mapping ici.
  listConducteur: (projectId) =>
    request(`/conducteurs?project_id=${encodeURIComponent(projectId)}`).then((d) => d.jours || []),
  createJour: (projectId, jour) =>
    request("/conducteurs", { method: "POST", body: JSON.stringify({ ...jour, project_id: projectId }) }),
  updateJour: (jour) =>
    request("/conducteurs", { method: "PUT", body: JSON.stringify(jour) }),
  deleteJour: (id) => request(`/conducteurs?id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  createPhase: (jourId, phase) =>
    request("/conducteur-phases", { method: "POST", body: JSON.stringify({ ...phase, jour_id: jourId }) }),
  updatePhase: (phase) =>
    request("/conducteur-phases", { method: "PUT", body: JSON.stringify(phase) }),
  updatePhaseCompleted: (id, completed) =>
    request("/conducteur-phases", {
      method: "PUT",
      body: JSON.stringify({ id, completedOnly: completed }),
    }),
  deletePhase: (id) => request(`/conducteur-phases?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// Exportés pour les tests unitaires (couche de mapping pure, sans réseau).
export {
  taskFromDb,
  taskToApi,
  vendorFromDb,
  vendorToApi,
  expenseFromDb,
  expenseToApi,
  notificationFromDb,
  projectFromDb,
  VENDOR_STATUT_TO_LABEL,
  VENDOR_LABEL_TO_STATUT,
};
