-- ============================================================================
-- Cloudflare D1 SQL Schema — EventFlow Pro
-- Base de données compatible avec Cloudflare D1 (SQLite)
-- ============================================================================
-- Note : D1 utilise SQLite. Les types sont adaptés en conséquence.
-- Migration : wrangler d1 execute eventflow-db --remote --file=database/schema.sql
-- ============================================================================

--PRAGMA journal_mode = WAL;
--PRAGMA foreign_keys = ON;

-- ============================================================================
--  AGENCIES : une agence = un admin propriétaire de projets
-- ============================================================================
CREATE TABLE IF NOT EXISTS agencies (
  id              TEXT PRIMARY KEY,           -- UUID
  name            TEXT NOT NULL,              -- "Lems Coordination"
  owner_user_id   TEXT NOT NULL,              -- FK users.id
  logo_url        TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
--  USERS : super_admin, admin (agence), planner, client
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,           -- UUID
  agency_id       TEXT,                       -- NULL si super_admin ou client
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,              -- bcrypt/argon2 côté serveur
  email           TEXT,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('super_admin','admin','planner','client')),
  color           TEXT DEFAULT '#4318FF',
  theme           TEXT DEFAULT 'light',       -- light/night/graphite/blue/rose/emerald/lavender
  avatar_url      TEXT,
  is_active       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_agency ON users(agency_id);

-- ============================================================================
--  PROJECTS : un projet de mariage
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  agency_id       TEXT NOT NULL,
  name            TEXT NOT NULL,
  couple          TEXT NOT NULL,              -- "Ny Andry & Jenny"
  date            TEXT NOT NULL,              -- "2026-07-16" (jour principal)
  venue           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'brouillon'
                    CHECK (status IN ('brouillon','en_cours','termine','annule')),
  color           TEXT DEFAULT '#4318FF',
  budget          REAL DEFAULT 0,
  currency        TEXT DEFAULT 'EUR',
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_agency ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_date ON projects(date);

-- ============================================================================
--  PROJECT_PLANNERS (N-N) : planificateurs assignés à un projet
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_planners (
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role_label TEXT DEFAULT 'planner',
    assigned_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
--  PROJECT_CLIENTS (N-N) : mariés / parties prenantes
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_clients (
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role_label TEXT DEFAULT 'client',
    assigned_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
--  TASKS : tâches du projet, avec responsable optionnel
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT NOT NULL,              -- "P01", "V02"
  project_id      TEXT NOT NULL,
  phase           TEXT NOT NULL,              -- "Préparation", "Veille", "Jour J"
  category        TEXT NOT NULL,
  name            TEXT NOT NULL,              -- description courte
  duration        TEXT DEFAULT '1 jour',
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,
  responsible_user_id TEXT,                   -- FK users.id NULL (ou libellé libre)
  responsible_name    TEXT,                   -- libellé fallback
  predecessor     TEXT,                       -- id de la tâche antécédente (modèle simple front).
                                              -- Le graphe complet vit dans task_dependencies.
  status          TEXT NOT NULL DEFAULT 'À faire'
                    CHECK (status IN ('À faire','En cours','Terminé','Bloqué')),
  sort_order      INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (id, project_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);

-- ============================================================================
--  TASK_DEPENDENCIES : graphe de précédence (tâches antécédentes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id TEXT NOT NULL,
    task_project_id TEXT NOT NULL,
    depends_on_id TEXT NOT NULL,
    depends_on_project_id TEXT NOT NULL,
    PRIMARY KEY (task_id, depends_on_id),
    FOREIGN KEY (task_id, task_project_id) REFERENCES tasks(id, project_id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id, depends_on_project_id) REFERENCES tasks(id, project_id) ON DELETE CASCADE
);

-- ============================================================================
--  VENDORS : prestataires d'un projet
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,              -- "Orchestre", "Décoration", etc.
  scope           TEXT,                       -- "Religieux uniquement", "Civil + réception", etc.
  color           TEXT DEFAULT '#4318FF',
  statut          TEXT DEFAULT 'en_recherche'
                    CHECK (statut IN ('confirme','en_recherche','contacte','refuse')),
  contact_name    TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  quote_amount    REAL,
  paid_amount     REAL DEFAULT 0,
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vendors_project ON vendors(project_id);

-- ============================================================================
--  EXPENSES : dépenses budgétaires
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  vendor_id       TEXT,
  label           TEXT NOT NULL,
  category        TEXT NOT NULL,
  amount          REAL NOT NULL,
  date            TEXT NOT NULL,
  paid            INTEGER DEFAULT 0,
  invoice_ref     TEXT,
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);

-- ============================================================================
--  CONDUCTEUR_JOURS : jours du conducteur (multi-jours)
--  Permet de gérer des cérémonies sur des jours différents
--  (Vodiondry J-1, Civil J, Religieux J, Démontage J+1, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conducteur_jours (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  label           TEXT NOT NULL,              -- "Vodiondry", "Jour J - Cérémonies", "Démontage"
  date            TEXT NOT NULL,              -- date effective
  time_start      TEXT,                       -- "08:00"
  time_end        TEXT,                       -- "23:00"
  subtitle        TEXT,                       -- "J-1 Veille", "J - Jour officiel", etc.
  guest_count     INTEGER,
  notes           TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conducteur_jours_project ON conducteur_jours(project_id);
CREATE INDEX IF NOT EXISTS idx_conducteur_jours_date ON conducteur_jours(date);

-- ============================================================================
--  CONDUCTEUR_PHASES : phases à l'intérieur d'un jour
-- ============================================================================
CREATE TABLE IF NOT EXISTS conducteur_phases (
  id              TEXT PRIMARY KEY,
  jour_id         TEXT NOT NULL,
  title           TEXT NOT NULL,
  time_slot       TEXT NOT NULL,              -- "14:00 — 15:00"
  note            TEXT,
  custom_html     TEXT,                       -- menu, etc. (HTML)
  completed       INTEGER DEFAULT 0,          -- 0/1 — coché "terminé" côté conducteur
  sort_order      INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (jour_id) REFERENCES conducteur_jours(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conducteur_phases_jour ON conducteur_phases(jour_id);

-- ============================================================================
--  CONDUCTEUR_ACTIONS : actions/étapes d'une phase
-- ============================================================================
CREATE TABLE IF NOT EXISTS conducteur_actions (
  id              TEXT PRIMARY KEY,
  phase_id        TEXT NOT NULL,
  content         TEXT NOT NULL,              -- peut contenir du HTML léger
  sort_order      INTEGER DEFAULT 0,
  FOREIGN KEY (phase_id) REFERENCES conducteur_phases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conducteur_actions_phase ON conducteur_actions(phase_id);

-- ============================================================================
--  CONDUCTEUR_PHASE_RESPONSIBLES : responsables d'une phase (scope partiel)
--  Un prestataire peut être responsable d'une phase sans être responsable
--  d'une autre (ex: Album Music sur "Religieux" seulement).
-- ============================================================================
CREATE TABLE IF NOT EXISTS conducteur_phase_responsibles (
    phase_id TEXT NOT NULL,      -- prestataire du projet (peut être NULL)
    vendor_id TEXT,              -- ou utilisateur (planner, etc.)
    user_id TEXT,                -- "Orchestre uniquement", "Sonorisation + micro"
    scope_label TEXT,            -- "responsable", "support", "observateur"
    role_label TEXT DEFAULT 'responsable',
    PRIMARY KEY (phase_id, vendor_id, user_id, scope_label),
    FOREIGN KEY (phase_id) REFERENCES conducteur_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
--  NOTIFICATIONS : fil de notifications utilisateur
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  project_id      TEXT,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT,
  is_read         INTEGER DEFAULT 0,
  related_entity_type TEXT,                   -- 'task', 'vendor', 'project', etc.
  related_entity_id TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON notifications(project_id);

-- ============================================================================
--  ACTIVITY_LOG : audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id              INTEGER PRIMARY KEY,
  user_id         TEXT,
  project_id      TEXT,
  entity_type     TEXT NOT NULL,              -- 'task', 'vendor', 'expense', etc.
  entity_id       TEXT,
  action          TEXT NOT NULL,              -- 'created', 'updated', 'deleted', 'status_changed'
  details         TEXT,                       -- JSON stringifié
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);

-- ============================================================================
--  SEED : données de démonstration (optionnel)
-- ============================================================================
-- INSERT OR IGNORE INTO agencies VALUES (...)
-- INSERT OR IGNORE INTO users VALUES (...)
-- etc.
