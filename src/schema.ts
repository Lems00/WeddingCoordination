/**
 * SQL-READY SCHEMA — Documentation de la structure relationnelle.
 *
 * Cette interface documente la future migration vers une base SQL (PostgreSQL / MySQL).
 * Toutes les relations sont exprimées par des IDs (foreign keys). Les tables sont normalisées.
 *
 * ============================================================================
 *  users
 * ----------------------------------------------------------------------------
 *  id                  UUID PK
 *  agency_id           UUID FK -> agencies.id  (NULL si super_admin)
 *  username            VARCHAR(64) UNIQUE
 *  password_hash       VARCHAR(255)
 *  email               VARCHAR(255) UNIQUE
 *  name                VARCHAR(128)
 *  role                ENUM('super_admin','admin','planner','client')
 *  color               VARCHAR(7)          -- couleur avatar (hex)
 *  theme               VARCHAR(32)         -- thème UI préféré
 *  created_at          TIMESTAMP
 * ============================================================================
 *  agencies  (une agence = un admin qui porte plusieurs projets)
 * ----------------------------------------------------------------------------
 *  id                  UUID PK
 *  name                VARCHAR(128)        -- ex: "Lems Coordination"
 *  owner_user_id       UUID FK -> users.id
 *  logo_url            VARCHAR(512)
 *  created_at          TIMESTAMP
 * ============================================================================
 *  projects
 * ----------------------------------------------------------------------------
 *  id                  UUID PK
 *  agency_id           UUID FK -> agencies.id
 *  name                VARCHAR(128)
 *  couple              VARCHAR(128)
 *  date                DATE
 *  venue               VARCHAR(255)
 *  status              ENUM('brouillon','en_cours','termine','annule')
 *  color               VARCHAR(7)
 *  budget              DECIMAL(12,2)
 *  notes               TEXT
 *  created_at          TIMESTAMP
 * ============================================================================
 *  project_planners  (N-N : planners assignés à un projet)
 * ----------------------------------------------------------------------------
 *  project_id          UUID FK -> projects.id
 *  user_id             UUID FK -> users.id
 *  role                VARCHAR(32)         -- "lead", "assistant", etc.
 *  PRIMARY KEY (project_id, user_id)
 * ============================================================================
 *  project_clients  (N-N : mariés / parties prenantes)
 * ----------------------------------------------------------------------------
 *  project_id          UUID FK -> projects.id
 *  user_id             UUID FK -> users.id
 *  PRIMARY KEY (project_id, user_id)
 * ============================================================================
 *  tasks
 * ----------------------------------------------------------------------------
 *  id                  VARCHAR(16) PK      -- ex: "P01", "V02"
 *  project_id          UUID FK -> projects.id
 *  phase               VARCHAR(32)
 *  category            VARCHAR(64)
 *  name                VARCHAR(255)
 *  duration            VARCHAR(32)
 *  start_date          DATE
 *  end_date            DATE
 *  responsible_user_id UUID FK -> users.id  NULL
 *  status              ENUM('a_faire','en_cours','termine','bloque')
 *  created_at          TIMESTAMP
 * ============================================================================
 *  task_dependencies  (graphe de précédence)
 * ----------------------------------------------------------------------------
 *  task_id             VARCHAR(16) FK -> tasks.id
 *  depends_on_id       VARCHAR(16) FK -> tasks.id
 *  project_id          UUID FK -> projects.id
 *  PRIMARY KEY (task_id, depends_on_id)
 * ============================================================================
 *  vendors
 * ----------------------------------------------------------------------------
 *  id                  UUID PK
 *  project_id          UUID FK -> projects.id
 *  name                VARCHAR(128)
 *  role                VARCHAR(64)
 *  color               VARCHAR(7)
 *  statut              ENUM('confirme','en_recherche','contacte','refuse')
 *  contact_name        VARCHAR(128)
 *  contact_phone       VARCHAR(32)
 *  contact_email       VARCHAR(255)
 *  quote_amount        DECIMAL(12,2)
 * ============================================================================
 *  expenses
 * ----------------------------------------------------------------------------
 *  id                  UUID PK
 *  project_id          UUID FK -> projects.id
 *  label               VARCHAR(255)
 *  category            VARCHAR(64)
 *  amount              DECIMAL(12,2)
 *  date                DATE
 *  paid                BOOLEAN
 *  vendor_id           UUID FK -> vendors.id  NULL
 *  created_at          TIMESTAMP
 * ============================================================================
 *  notifications
 * ----------------------------------------------------------------------------
 *  id                  UUID PK
 *  user_id             UUID FK -> users.id  (destinataire)
 *  project_id          UUID FK -> projects.id
 *  type                ENUM('task_assigned','task_status','vendor_added',
 *                           'budget_added','project_assigned','mention',
 *                           'comment','due_soon','info')
 *  title               VARCHAR(128)
 *  message             TEXT
 *  is_read             BOOLEAN DEFAULT false
 *  related_entity_type VARCHAR(32)         -- 'task', 'vendor', 'project', ...
 *  related_entity_id   VARCHAR(64)
 *  created_at          TIMESTAMP
 * ============================================================================
 */

export type SqlUserRole = "super_admin" | "admin" | "planner" | "client";
export type SqlProjectStatus = "brouillon" | "en_cours" | "termine" | "annule";
export type SqlTaskStatus = "a_faire" | "en_cours" | "termine" | "bloque";
export type SqlVendorStatus = "confirme" | "en_recherche" | "contacte" | "refuse";
export type SqlNotificationType =
  | "task_assigned"
  | "task_status"
  | "vendor_added"
  | "budget_added"
  | "project_assigned"
  | "mention"
  | "comment"
  | "due_soon"
  | "info";
