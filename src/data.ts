import { SqlUserRole, SqlProjectStatus } from "./schema";
import type { ThemeId } from "./themes";

export type UserRole = SqlUserRole;
export type ProjectStatus = SqlProjectStatus;
export type TaskStatus = "À faire" | "En cours" | "Terminé" | "Bloqué";

export interface User {
  id: string;
  agency_id: string | null; // NULL pour super_admin
  username: string;
  password: string;
  name: string;
  role: UserRole;
  color: string;
  theme: ThemeId;
}

export interface Project {
  id: string;
  agency_id: string;
  name: string;
  couple: string;
  date: string;
  venue: string;
  status: ProjectStatus;
  color: string;
  assigned_planners: string[]; // User IDs (planners ou admin)
  assigned_clients: string[];  // User IDs (clients / mariés)
  budget: number | null;
  notes: string;
}

export interface Task {
  id: string;
  project_id: string;        // FK -> projects.id
  phase: string;
  category: string;
  task: string;
  duration: string;
  start_date: string;
  end_date: string;
  predecessor: string;
  responsible_user_id: string | null; // FK optionnelle -> users.id
  responsible?: string;               // Libellé du responsable (prestataire/rôle) — miroir de la colonne DB responsible_name
  status: TaskStatus;
}

export interface Vendor {
  id: string;
  project_id: string;        // FK -> projects.id
  name: string;
  role: string;
  color: string;
  statut: string;
}

export interface BudgetExpense {
  id: string;
  project_id: string;        // FK -> projects.id
  label: string;
  category: string;
  amount: number;
  date: string;
  paid: boolean;
}

export type NotificationType =
  | "task_assigned"
  | "task_status"
  | "vendor_added"
  | "budget_added"
  | "project_assigned"
  | "mention"
  | "comment"
  | "due_soon"
  | "info";

export interface Notification {
  id: string;
  user_id: string;           // destinataire
  project_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type: "task" | "vendor" | "project" | "expense" | null;
  related_entity_id: string | null;
  created_at: string;
}

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  "À faire": { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  "En cours": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "Terminé": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Bloqué": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export const PHASES = ["Préparation", "Veille", "Jour J"] as const;

// ============================================================================
//  Codes couleur des responsables / équipe assignée aux tâches
// ----------------------------------------------------------------------------
//  Chaque rôle ou type de responsable a une couleur dédiée et une initiale.
//  Exemple : (C) Coordinateur → rond bleu, (M) Mariés → rond rose, etc.
//  Cette table sert de référence visuelle commune (légende, badges, avatars).
// ============================================================================
export interface AssigneeStyle {
  code: string;      // initiale affichée dans le rond, ex: "C"
  label: string;     // libellé complet, ex: "Coordinateur"
  color: string;     // couleur hex du rond
}

// Mapping par mot-clé contenu dans le nom du responsable (insensible à la casse).
// L'ordre compte : la première correspondance gagne.
export const ASSIGNEE_RULES: { match: string[]; style: AssigneeStyle }[] = [
  { match: ["coordinateur", "coordination", "lems", "régie", "regie"], style: { code: "C", label: "Coordinateur", color: "#2563EB" } }, // Bleu
  { match: ["marié", "marie", "mariés", "maries", "couple"], style: { code: "M", label: "Mariés", color: "#EC4899" } },                 // Rose
  { match: ["sophie"], style: { code: "S", label: "Sophie (Planner)", color: "#06B6D4" } },                                              // Cyan
  { match: ["karim"], style: { code: "K", label: "Karim (Planner)", color: "#F59E0B" } },                                                // Ambre
  { match: ["planner", "planificateur"], style: { code: "P", label: "Planner", color: "#8B5CF6" } },                                     // Violet
  { match: ["mi rec", "mirec", "vidéo", "video", "photo"], style: { code: "V", label: "Vidéo & Photo", color: "#4318FF" } },             // Indigo
  { match: ["vazaha", "cuisine", "traiteur", "restauration"], style: { code: "T", label: "Traiteur / Cuisine", color: "#EE5D50" } },     // Rouge corail
  { match: ["album music", "orchestre"], style: { code: "O", label: "Orchestre", color: "#05CD99" } },                                   // Vert
  { match: ["mre", "son", "sonorisation", "église", "eglise"], style: { code: "N", label: "Son & Église", color: "#FFCE20" } },          // Jaune
  { match: ["jennya", "décor", "decor"], style: { code: "D", label: "Décoration", color: "#7551FF" } },                                  // Violet clair
  { match: ["fx", "effets", "pyrotechnie"], style: { code: "X", label: "Effets spéciaux", color: "#FF6B35" } },                          // Orange
  { match: ["lumière", "lumieres", "lumiere", "éclairage", "eclairage"], style: { code: "L", label: "Lumières", color: "#00BCD4" } },    // Turquoise
  { match: ["pâtisserie", "patisserie", "gâteau", "gateau"], style: { code: "G", label: "Pâtisserie", color: "#D946EF" } },              // Magenta
];

const FALLBACK_PALETTE = ["#64748B", "#0EA5E9", "#14B8A6", "#A855F7", "#F43F5E", "#84CC16", "#F97316"];

// Hash stable d'une chaîne -> index palette (pour responsables inconnus)
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Retourne le style (code, label, couleur) d'un responsable à partir de son nom.
 * Cherche d'abord une règle métier connue, sinon génère une couleur stable.
 */
export function getAssigneeStyle(name: string | null | undefined): AssigneeStyle {
  if (!name || !name.trim()) {
    return { code: "?", label: "Non assigné", color: "#94A3B8" };
  }
  const lower = name.toLowerCase();
  for (const rule of ASSIGNEE_RULES) {
    if (rule.match.some((m) => lower.includes(m))) {
      return rule.style;
    }
  }
  // Fallback : initiale = première lettre, couleur stable selon le hash du nom
  const color = FALLBACK_PALETTE[hashString(lower) % FALLBACK_PALETTE.length];
  return { code: name.trim().charAt(0).toUpperCase(), label: name, color };
}

/**
 * Retourne le nom du responsable d'une tâche basé sur son responsible_user_id.
 * Si l'utilisateur n'existe pas, retourne "Non assigné".
 */
export function getResponsibleName(responsibleUserId: string | null, users: User[]): string {
  if (!responsibleUserId) return "Non assigné";
  const user = users.find((u) => u.id === responsibleUserId);
  return user?.name || "Non assigné";
}

/**
 * Nom du responsable d'une tâche pour l'affichage : privilégie le libellé libre
 * `responsible` (prestataire/rôle issu de la DB), sinon résout via le FK user_id.
 */
export function getTaskResponsible(task: Task, users: User[]): string {
  if (task.responsible && task.responsible.trim()) return task.responsible.trim();
  return getResponsibleName(task.responsible_user_id, users);
}

// ============================================================================
//  Données de démonstration
// ============================================================================

export const DEFAULT_AGENCY_ID = "agency_lems_2026";

export const DEFAULT_USERS: User[] = [
  {
    id: "sa_001",
    agency_id: null,
    username: "superadmin",
    password: "Super2026",
    name: "Super Administrateur",
    role: "super_admin",
    color: "#7c3aed",
    theme: "night",
  },
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    agency_id: DEFAULT_AGENCY_ID,
    username: "admin",
    password: "Admin2026",
    name: "Coordinateur (Lems)",
    role: "admin",
    color: "#4318FF",
    theme: "light",
  },
  {
    id: "p_lem_002",
    agency_id: DEFAULT_AGENCY_ID,
    username: "sophie",
    password: "Planner2026",
    name: "Sophie (Planner)",
    role: "planner",
    color: "#06b6d4",
    theme: "blue",
  },
  {
    id: "p_lem_003",
    agency_id: DEFAULT_AGENCY_ID,
    username: "karim",
    password: "Planner2026",
    name: "Karim (Planner)",
    role: "planner",
    color: "#f59e0b",
    theme: "rose",
  },
  {
    id: "b23f8c88-1234-4bc1-9c8a-7dd89be30b22",
    agency_id: null,
    username: "marie",
    password: "mariage2026",
    name: "Mariée",
    role: "client",
    color: "#05CD99",
    theme: "rose",
  },
  {
    id: "c45f9d99-5678-4cd2-ad9b-8ee90cf41c33",
    agency_id: null,
    username: "marie2",
    password: "mariage2026",
    name: "Marié",
    role: "client",
    color: "#FFCE20",
    theme: "lavender",
  },
];

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj_nj2026",
    agency_id: DEFAULT_AGENCY_ID,
    name: "Ny Andry & Jenny",
    couple: "Ny Andry & Jenny",
    date: "2026-07-16",
    venue: "Antananarivo",
    status: "en_cours",
    color: "#4318FF",
    assigned_planners: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "p_lem_002"],
    assigned_clients: ["b23f8c88-1234-4bc1-9c8a-7dd89be30b22", "c45f9d99-5678-4cd2-ad9b-8ee90cf41c33"],
    budget: 15000,
    notes: "Coordination générale du mariage de Ny Andry et Jenny.",
  },
  {
    id: "proj_cl2026",
    agency_id: DEFAULT_AGENCY_ID,
    name: "Chloé & Lucas",
    couple: "Chloé & Lucas",
    date: "2026-09-12",
    venue: "Biarritz",
    status: "en_cours",
    color: "#e11d48",
    assigned_planners: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "p_lem_003"],
    assigned_clients: [],
    budget: 28000,
    notes: "Mariage basque en plein air — 120 invités.",
  },
  {
    id: "proj_am2027",
    agency_id: DEFAULT_AGENCY_ID,
    name: "Aminata & Marc",
    couple: "Aminata & Marc",
    date: "2027-02-14",
    venue: "Dakar",
    status: "brouillon",
    color: "#f59e0b",
    assigned_planners: ["p_lem_003"],
    assigned_clients: [],
    budget: 18500,
    notes: "Projet en phase de découverte, premier RDV le 15 mars 2026.",
  },
];

const RAW_DEFAULT_TASKS: Task[] = [
  { id: "P01", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Signature du contrat de coordination", duration: "1 jour", start_date: "2026-06-02", end_date: "2026-06-02", predecessor: "", responsible_user_id: null, status: "En cours" },
  { id: "P02", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Réunion de cadrage avec les mariés", duration: "1 jour", start_date: "2026-06-03", end_date: "2026-06-03", predecessor: "P01", responsible_user_id: null, status: "Terminé" },
  { id: "P03", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Visite technique du lieu", duration: "1 jour", start_date: "2026-06-04", end_date: "2026-06-04", predecessor: "P02", responsible_user_id: null, status: "Terminé" },
  { id: "P04", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique", task: "Inventaire tables et chaises avec le propriétaire", duration: "1 jour", start_date: "2026-07-14", end_date: "2026-07-14", predecessor: "P03", responsible_user_id: null, status: "À faire" },
  { id: "P05", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique", task: "Test de la puissance électrique du lieu", duration: "1 jour", start_date: "2026-06-04", end_date: "2026-06-04", predecessor: "P03", responsible_user_id: null, status: "À faire" },
  { id: "P06", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Confirmation Mi Rec Production (vidéo et photo). Signature de contrat", duration: "3 jours", start_date: "2026-06-05", end_date: "2026-06-09", predecessor: "P01", responsible_user_id: null, status: "À faire" },
  { id: "P07", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Confirmation Vazaha (cuisine)", duration: "3 jours", start_date: "2026-06-03", end_date: "2026-06-05", predecessor: "P01", responsible_user_id: null, status: "Terminé" },
  { id: "P08", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Confirmation Album Music (orchestre)", duration: "3 jours", start_date: "2026-06-03", end_date: "2026-06-05", predecessor: "P01", responsible_user_id: null, status: "À faire" },
  { id: "P09", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Confirmation MRE (église et sonorisation)", duration: "3 jours", start_date: "2026-06-03", end_date: "2026-06-05", predecessor: "P01", responsible_user_id: null, status: "À faire" },
  { id: "P10", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Confirmation Jennya (décoration)", duration: "3 jours", start_date: "2026-06-03", end_date: "2026-06-05", predecessor: "P01", responsible_user_id: null, status: "Terminé" },
  { id: "P11", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique invités", task: "Clôture définitive de la liste des invités", duration: "5 jours", start_date: "2026-06-03", end_date: "2026-06-08", predecessor: "P02", responsible_user_id: null, status: "À faire" },
  { id: "P12", project_id: "proj_nj2026", phase: "Préparation", category: "Protocole", task: "Définition du protocole Vodiondry avec les familles", duration: "5 jours", start_date: "2026-06-09", end_date: "2026-06-13", predecessor: "P02", responsible_user_id: null, status: "À faire" },
  { id: "P13", project_id: "proj_nj2026", phase: "Préparation", category: "Protocole", task: "Confirmation de l'officier d'état civil", duration: "3 jours", start_date: "2026-06-09", end_date: "2026-06-11", predecessor: "P03", responsible_user_id: null, status: "À faire" },
  { id: "P14", project_id: "proj_nj2026", phase: "Préparation", category: "Protocole", task: "Confirmation des pasteurs Jocelyn et Solofo", duration: "3 jours", start_date: "2026-06-09", end_date: "2026-06-11", predecessor: "P02", responsible_user_id: null, status: "À faire" },
  { id: "P15", project_id: "proj_nj2026", phase: "Préparation", category: "Son", task: "Vérifier périmètre sonore MRE pour les 3 cérémonies", duration: "2 jours", start_date: "2026-06-09", end_date: "2026-06-10", predecessor: "P09", responsible_user_id: null, status: "À faire" },
  { id: "P16", project_id: "proj_nj2026", phase: "Préparation", category: "Son", task: "Recherche prestataire sonorisation complémentaire (le cas échéant)", duration: "4 jours", start_date: "2026-06-11", end_date: "2026-06-14", predecessor: "P15", responsible_user_id: null, status: "À faire" },
  { id: "P17", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Recherche prestataire effets spéciaux", duration: "5 jours", start_date: "2026-06-09", end_date: "2026-06-13", predecessor: "P03", responsible_user_id: null, status: "En cours" },
  { id: "P18", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Recherche prestataire écrans géants", duration: "5 jours", start_date: "2026-06-09", end_date: "2026-06-13", predecessor: "P03", responsible_user_id: null, status: "Terminé" },
  { id: "P19", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Recherche prestataire jeux de lumières", duration: "5 jours", start_date: "2026-06-09", end_date: "2026-06-13", predecessor: "P03", responsible_user_id: null, status: "En cours" },
  { id: "P20", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Recherche spectacle cirque style Aladin pour l'entrée des mariés", duration: "5 jours", start_date: "2026-06-09", end_date: "2026-06-13", predecessor: "P02", responsible_user_id: null, status: "En cours" },
  { id: "P21", project_id: "proj_nj2026", phase: "Préparation", category: "Prestataires", task: "Confirmation DJ (le cas échéant)", duration: "3 jours", start_date: "2026-06-09", end_date: "2026-06-11", predecessor: "P02", responsible_user_id: null, status: "À faire" },
  { id: "P22", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique invités", task: "Envoi des invitations", duration: "2 jours", start_date: "2026-06-09", end_date: "2026-06-10", predecessor: "P11", responsible_user_id: null, status: "À faire" },
  { id: "P23", project_id: "proj_nj2026", phase: "Préparation", category: "Restauration", task: "Validation finale du menu avec Vazaha", duration: "3 jours", start_date: "2026-06-16", end_date: "2026-06-18", predecessor: "P07", responsible_user_id: null, status: "À faire" },
  { id: "P24", project_id: "proj_nj2026", phase: "Préparation", category: "Restauration", task: "Validation de la carte des boissons", duration: "2 jours", start_date: "2026-06-19", end_date: "2026-06-20", predecessor: "P23", responsible_user_id: null, status: "À faire" },
  { id: "P25", project_id: "proj_nj2026", phase: "Préparation", category: "Gâteaux", task: "Commande et acompte pièce montée", duration: "1 jour", start_date: "2026-06-16", end_date: "2026-06-16", predecessor: "P02", responsible_user_id: null, status: "À faire" },
  { id: "P26", project_id: "proj_nj2026", phase: "Préparation", category: "Gâteaux", task: "Commande des boîtes, barquettes et sacs personnalisés", duration: "4 jours", start_date: "2026-06-16", end_date: "2026-06-19", predecessor: "P02", responsible_user_id: null, status: "À faire" },
  { id: "P27", project_id: "proj_nj2026", phase: "Préparation", category: "Décoration", task: "Validation du plan de décoration avec Jennya", duration: "5 jours", start_date: "2026-06-16", end_date: "2026-06-20", predecessor: "P10", responsible_user_id: null, status: "À faire" },
  { id: "P28", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique", task: "Location des tables hautes pour cocktail", duration: "3 jours", start_date: "2026-06-17", end_date: "2026-06-19", predecessor: "P03", responsible_user_id: null, status: "À faire" },
  { id: "P29", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique", task: "Location vaisselle, couverts et verrerie", duration: "3 jours", start_date: "2026-06-17", end_date: "2026-06-19", predecessor: "P07", responsible_user_id: null, status: "À faire" },
  { id: "P30", project_id: "proj_nj2026", phase: "Préparation", category: "Sécurité", task: "Autorisations lanternes et pyrotechnie", duration: "5 jours", start_date: "2026-06-16", end_date: "2026-06-20", predecessor: "P17", responsible_user_id: null, status: "À faire" },
  { id: "P31", project_id: "proj_nj2026", phase: "Préparation", category: "Lanternes", task: "Commande des lanternes pour le lancer", duration: "3 jours", start_date: "2026-06-22", end_date: "2026-06-24", predecessor: "P17", responsible_user_id: null, status: "À faire" },
  { id: "P32", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique invités", task: "Suivi des confirmations de présence", duration: "5 jours", start_date: "2026-06-23", end_date: "2026-06-27", predecessor: "P22", responsible_user_id: null, status: "À faire" },
  { id: "P33", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique invités", task: "Relance des invités non répondants", duration: "3 jours", start_date: "2026-06-26", end_date: "2026-06-28", predecessor: "P32", responsible_user_id: null, status: "À faire" },
  { id: "P34", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Réunion intermédiaire avec les mariés", duration: "1 jour", start_date: "2026-06-25", end_date: "2026-06-25", predecessor: "P12", responsible_user_id: null, status: "À faire" },
  { id: "P35", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique invités", task: "Finalisation du plan de table", duration: "4 jours", start_date: "2026-06-30", end_date: "2026-07-03", predecessor: "P33", responsible_user_id: null, status: "À faire" },
  { id: "P36", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Rédaction du conducteur heure par heure", duration: "4 jours", start_date: "2026-06-30", end_date: "2026-07-03", predecessor: "P34", responsible_user_id: null, status: "À faire" },
  { id: "P37", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Validation du conducteur avec les mariés", duration: "2 jours", start_date: "2026-07-04", end_date: "2026-07-05", predecessor: "P36", responsible_user_id: null, status: "À faire" },
  { id: "P38", project_id: "proj_nj2026", phase: "Préparation", category: "Sécurité", task: "Vérification accès, issues de secours, extincteurs", duration: "1 jour", start_date: "2026-07-07", end_date: "2026-07-07", predecessor: "P03", responsible_user_id: null, status: "À faire" },
  { id: "P39", project_id: "proj_nj2026", phase: "Préparation", category: "Lanternes", task: "Réception et test des lanternes", duration: "2 jours", start_date: "2026-07-14", end_date: "2026-07-14", predecessor: "P31", responsible_user_id: null, status: "À faire" },
  { id: "P40", project_id: "proj_nj2026", phase: "Préparation", category: "Barquettes", task: "Commande et réception des barquettes à emporter", duration: "3 jours", start_date: "2026-07-08", end_date: "2026-07-10", predecessor: "P23", responsible_user_id: null, status: "À faire" },
  { id: "P41", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Briefing final avec tous les prestataires", duration: "2 jours", start_date: "2026-07-13", end_date: "2026-07-14", predecessor: "P37", responsible_user_id: null, status: "À faire" },
  { id: "P42", project_id: "proj_nj2026", phase: "Préparation", category: "Coordination", task: "Préparation des fiches missions par prestataire", duration: "2 jours", start_date: "2026-07-11", end_date: "2026-07-12", predecessor: "P37", responsible_user_id: null, status: "À faire" },
  { id: "P43", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique", task: "Vérification finale de toutes les commandes", duration: "1 jour", start_date: "2026-07-14", end_date: "2026-07-14", predecessor: "P41", responsible_user_id: null, status: "À faire" },
  { id: "T75", project_id: "proj_nj2026", phase: "Préparation", category: "Logistique invités", task: "Distribution des faire-part d'invitation", duration: "7 jours", start_date: "2026-06-08", end_date: "2026-06-13", predecessor: "P11", responsible_user_id: null, status: "À faire" },
  { id: "V01", project_id: "proj_nj2026", phase: "Veille", category: "Décoration", task: "Livraison du matériel de décoration", duration: "2 heures", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "P27", responsible_user_id: null, status: "À faire" },
  { id: "V02", project_id: "proj_nj2026", phase: "Veille", category: "Décoration", task: "Installation complète de la décoration", duration: "6 heures", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "V01", responsible_user_id: null, status: "À faire" },
  { id: "V03", project_id: "proj_nj2026", phase: "Veille", category: "Lumières", task: "Livraison du matériel jeux de lumières", duration: "1 heure", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "P19", responsible_user_id: null, status: "À faire" },
  { id: "V04", project_id: "proj_nj2026", phase: "Veille", category: "Lumières", task: "Installation des jeux de lumières", duration: "4 heures", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "V03", responsible_user_id: null, status: "À faire" },
  { id: "V05", project_id: "proj_nj2026", phase: "Veille", category: "Lumières", task: "Tests et réglages des lumières", duration: "1 heure", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "V04", responsible_user_id: null, status: "À faire" },
  { id: "V06", project_id: "proj_nj2026", phase: "Veille", category: "Orchestre", task: "Livraison du matériel orchestre", duration: "1 heure", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "P08", responsible_user_id: null, status: "À faire" },
  { id: "V07", project_id: "proj_nj2026", phase: "Veille", category: "Orchestre", task: "Installation du matériel orchestre", duration: "2 heures", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "V06", responsible_user_id: null, status: "À faire" },
  { id: "V08", project_id: "proj_nj2026", phase: "Veille", category: "Orchestre", task: "Balance et tests son orchestre", duration: "1 heure", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "V07", responsible_user_id: null, status: "À faire" },
  { id: "V09", project_id: "proj_nj2026", phase: "Veille", category: "Coordination", task: "Tour de vérification générale par le coordinateur", duration: "1 heure", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "V02,V05,V08", responsible_user_id: null, status: "À faire" },
  { id: "V10", project_id: "proj_nj2026", phase: "Veille", category: "Coordination", task: "Validation de la checklist veille", duration: "30 min", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "V09", responsible_user_id: null, status: "À faire" },
  { id: "J02", project_id: "proj_nj2026", phase: "Veille", category: "Cuisine", task: "Livraison des ustensiles de cuisine", duration: "30 min", start_date: "2026-07-15", end_date: "2026-07-16", predecessor: "J01", responsible_user_id: null, status: "À faire" },
  { id: "J04", project_id: "proj_nj2026", phase: "Veille", category: "Cuisine", task: "Installation complète de la cuisine", duration: "1 heure", start_date: "2026-07-15", end_date: "2026-07-16", predecessor: "", responsible_user_id: null, status: "À faire" },
  { id: "J05", project_id: "proj_nj2026", phase: "Veille", category: "Cuisine", task: "Début des préparations culinaires", duration: "Continue", start_date: "2026-07-15", end_date: "2026-07-16", predecessor: "J04", responsible_user_id: null, status: "À faire" },
  { id: "J07", project_id: "proj_nj2026", phase: "Veille", category: "Logistique", task: "Livraison des tables hautes cocktail", duration: "30 min", start_date: "2026-07-15", end_date: "2026-07-15", predecessor: "P28", responsible_user_id: null, status: "À faire" },
  { id: "J08", project_id: "proj_nj2026", phase: "Veille", category: "Logistique", task: "Mise en place mobilier complémentaire", duration: "30 min", start_date: "2026-07-15", end_date: "2026-07-16", predecessor: "J07", responsible_user_id: null, status: "À faire" },
  { id: "J01", project_id: "proj_nj2026", phase: "Jour J", category: "Cuisine", task: "Arrivée équipe cuisine Vazaha", duration: "30 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "V10", responsible_user_id: null, status: "À faire" },
  { id: "J03", project_id: "proj_nj2026", phase: "Jour J", category: "Cuisine", task: "Livraison des denrées alimentaires", duration: "30 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J01", responsible_user_id: null, status: "À faire" },
  { id: "J06", project_id: "proj_nj2026", phase: "Jour J", category: "Coordination", task: "Arrivée équipe de coordination", duration: "15 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "V10", responsible_user_id: null, status: "À faire" },
  { id: "J09", project_id: "proj_nj2026", phase: "Jour J", category: "Logistique", task: "Mise en place de la signalétique", duration: "30 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J06", responsible_user_id: null, status: "À faire" },
  { id: "J10", project_id: "proj_nj2026", phase: "Jour J", category: "Décoration", task: "Retouches décoration matin", duration: "1 heure", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "V02", responsible_user_id: null, status: "À faire" },
  { id: "J11", project_id: "proj_nj2026", phase: "Jour J", category: "Vidéo et photo", task: "Arrivée Mi Rec Production", duration: "15 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "P06", responsible_user_id: null, status: "À faire" },
  { id: "J12", project_id: "proj_nj2026", phase: "Jour J", category: "Vidéo et photo", task: "Installation de l'écrans géants 73\"", duration: "1 heure", start_date: "2026-07-15", end_date: "2026-07-16", predecessor: "J11", responsible_user_id: null, status: "À faire" },
  { id: "J13", project_id: "proj_nj2026", phase: "Jour J", category: "Vidéo et photo", task: "Installation des caméras et tests", duration: "30 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J12", responsible_user_id: null, status: "À faire" },
  { id: "J14", project_id: "proj_nj2026", phase: "Jour J", category: "Effets spéciaux", task: "Arrivée prestataire effets spéciaux", duration: "15 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "P17", responsible_user_id: null, status: "À faire" },
  { id: "J15", project_id: "proj_nj2026", phase: "Jour J", category: "Effets spéciaux", task: "Installation et tests effets spéciaux", duration: "1 heure", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J14", responsible_user_id: null, status: "À faire" },
  { id: "J16", project_id: "proj_nj2026", phase: "Jour J", category: "Son", task: "Arrivée MRE et installation son", duration: "1 heure", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "P09", responsible_user_id: null, status: "À faire" },
  { id: "J17", project_id: "proj_nj2026", phase: "Jour J", category: "Son", task: "Tests micro et son", duration: "30 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J16", responsible_user_id: null, status: "À faire" },
  { id: "J18", project_id: "proj_nj2026", phase: "Jour J", category: "Gâteaux", task: "Livraison de la pièce montée", duration: "15 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "P25", responsible_user_id: null, status: "À faire" },
  { id: "J19", project_id: "proj_nj2026", phase: "Jour J", category: "Gâteaux", task: "Installation pièce montée et boîtes sur tables", duration: "30 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J18", responsible_user_id: null, status: "À faire" },
  { id: "J20", project_id: "proj_nj2026", phase: "Jour J", category: "Coordination", task: "Briefing général tous prestataires", duration: "30 min", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J04,J08,J09,J10,J13,J15,J17,J19", responsible_user_id: null, status: "À faire" },
  { id: "J21", project_id: "proj_nj2026", phase: "Jour J", category: "Événement", task: "Début événement — Accueil des invités", duration: "Continue", start_date: "2026-07-16", end_date: "2026-07-16", predecessor: "J20", responsible_user_id: null, status: "À faire" },
];

// Responsables réels par tâche — extraits de la base D1 (colonne responsible_name),
// source de vérité de l'API. Les libellés alimentent ASSIGNEE_RULES (badges/couleurs).
// P15 et J08 absents de la base : assignés à « Coordinateur » sur demande utilisateur.
export const TASK_RESPONSIBLES: Record<string, string> = {
  P01: "Coordinateur", P02: "Coordinateur", P03: "Coordinateur", P04: "Coordinateur", P05: "Coordinateur",
  P06: "Coordinateur", P07: "Coordinateur", P08: "Coordinateur", P09: "Coordinateur", P10: "Coordinateur",
  P11: "Mariés", P12: "Coordinateur", P13: "Mariés", P14: "Mariés", P15: "Coordinateur", P16: "Coordinateur",
  P17: "Coordinateur", P18: "Coordinateur", P19: "Coordinateur", P20: "Coordinateur", P21: "Coordinateur",
  P22: "Mariés", P23: "Coordinateur", P24: "Mariés", P25: "Mariés", P26: "Coordinateur",
  P27: "Coordinateur", P28: "Coordinateur", P29: "Coordinateur", P30: "Coordinateur", P31: "Coordinateur",
  P32: "Mariés", P33: "Mariés", P34: "Coordinateur", P35: "Mariés", P36: "Coordinateur",
  P37: "Mariés", P38: "Coordinateur", P39: "Coordinateur", P40: "Coordinateur", P41: "Coordinateur",
  P42: "Mariés", P43: "Coordinateur", T75: "Mariés",
  V01: "Jennya", V02: "Jennya", V03: "Prestataire lumières", V04: "Prestataire lumières", V05: "Prestataire lumières",
  V06: "Album Music", V07: "Album Music", V08: "Album Music", V09: "Coordinateur", V10: "Coordinateur",
  J01: "Vazaha", J02: "Vazaha", J03: "Vazaha", J04: "Vazaha", J05: "Vazaha",
  J06: "Coordinateur", J07: "Équipe régie", J08: "Coordinateur", J09: "Équipe régie", J10: "Jennya",
  J11: "Mi Rec Production", J12: "Mi Rec Production", J13: "Mi Rec Production",
  J14: "Prestataire FX", J15: "Prestataire FX", J16: "MRE", J17: "MRE",
  J18: "Prestataire pâtisserie", J19: "Équipe coordination", J20: "Coordinateur", J21: "Coordinateur",
};

export const DEFAULT_TASKS: Task[] = RAW_DEFAULT_TASKS.map((t) => ({
  ...t,
  responsible: TASK_RESPONSIBLES[t.id] ?? "",
}));

export const DEFAULT_PRESTATAIRES: Vendor[] = [
  { id: "mirec", project_id: "proj_nj2026", name: "Mi Rec Production", role: "Régie vidéo et photo", color: "#4318FF", statut: "Confirmé" },
  { id: "vazaha", project_id: "proj_nj2026", name: "Vazaha", role: "Cuisine et restauration", color: "#EE5D50", statut: "Confirmé" },
  { id: "album", project_id: "proj_nj2026", name: "Album Music", role: "Orchestre", color: "#05CD99", statut: "Confirmé" },
  { id: "mre", project_id: "proj_nj2026", name: "MRE", role: "Église et sonorisation", color: "#FFCE20", statut: "Confirmé" },
  { id: "jennya", project_id: "proj_nj2026", name: "Jennya", role: "Décoratrice", color: "#7551FF", statut: "Confirmé" },
  { id: "prestafx", project_id: "proj_nj2026", name: "Prestataire FX", role: "Effets spéciaux", color: "#FF6B35", statut: "En recherche" },
  { id: "prestalumieres", project_id: "proj_nj2026", name: "Prestataire lumières", role: "Jeux de lumières", color: "#00BCD4", statut: "En recherche" },
  { id: "traiteur_bz", project_id: "proj_cl2026", name: "Maison Darricarrère", role: "Traiteur basque", color: "#e11d48", statut: "Confirmé" },
  { id: "dom_bz", project_id: "proj_cl2026", name: "Domaine Ilbarritz", role: "Lieu de réception", color: "#8b5cf6", statut: "En recherche" },
];

export const DEFAULT_BUDGET_EXPENSES: BudgetExpense[] = [
  { id: "e1", project_id: "proj_nj2026", label: "Acompte Mi Rec Production", category: "Vidéo et photo", amount: 1500, date: "2026-06-03", paid: true },
  { id: "e2", project_id: "proj_nj2026", label: "Acompte Vazaha", category: "Restauration", amount: 3000, date: "2026-06-05", paid: true },
  { id: "e3", project_id: "proj_nj2026", label: "Acompte Jennya", category: "Décoration", amount: 800, date: "2026-06-05", paid: true },
  { id: "e4", project_id: "proj_nj2026", label: "Location lieu", category: "Logistique", amount: 2500, date: "2026-06-10", paid: true },
  { id: "e5", project_id: "proj_nj2026", label: "Pièce montée", category: "Gâteaux", amount: 600, date: "2026-06-16", paid: false },
  { id: "e6", project_id: "proj_cl2026", label: "Acompte Domaine Ilbarritz", category: "Lieu & Logistique", amount: 5000, date: "2026-06-15", paid: true },
];

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    user_id: "p_lem_002",
    project_id: "proj_nj2026",
    type: "task_assigned",
    title: "Nouvelle tâche assignée",
    message: "Vous avez été assigné(e) à « Confirmation Album Music (orchestre) ».",
    is_read: false,
    related_entity_type: "task",
    related_entity_id: "P08",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "n2",
    user_id: "p_lem_002",
    project_id: "proj_nj2026",
    type: "task_status",
    title: "Tâche marquée comme terminée",
    message: "« Confirmation Jennya (décoration) » est terminée.",
    is_read: false,
    related_entity_type: "task",
    related_entity_id: "P10",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "n3",
    user_id: "p_lem_003",
    project_id: "proj_nj2026",
    type: "due_soon",
    title: "Tâche bloquée",
    message: "« Envoi des invitations » est bloquée — une action est requise.",
    is_read: false,
    related_entity_type: "task",
    related_entity_id: "P22",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

// ============================================================================
//  Helpers
// ============================================================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  brouillon: "Brouillon",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  brouillon: "bg-slate-100 text-slate-700",
  en_cours: "bg-indigo-100 text-indigo-700",
  termine: "bg-emerald-100 text-emerald-700",
  annule: "bg-red-100 text-red-700",
};
