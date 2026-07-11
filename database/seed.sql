-- ============================================================================
-- SEED DATA : Données de démonstration pour EventFlow Pro
-- ============================================================================
-- Utilisation :
--   npx wrangler d1 execute eventflow-db --local --file=database/seed.sql
--
-- Ces données servent à peupler la BD locale avec des comptes et projets
-- pour tester l'application
-- ============================================================================

-- Agence par défaut
INSERT OR IGNORE INTO agencies (id, name, owner_user_id) 
VALUES ('agency_lems_2026', 'Lems Coordination', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Super admin
INSERT OR IGNORE INTO users (id, agency_id, username, password_hash, name, role, color, theme, is_active)
VALUES (
  'sa_001',
  NULL,
  'superadmin',
  'Super2026',  
  'Super Administrateur',
  'super_admin',
  '#7c3aed',
  'night',
  1
);

-- Admin (Lems)
INSERT OR IGNORE INTO users (id, agency_id, username, password_hash, name, role, color, theme, is_active)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'agency_lems_2026',
  'admin',
  'Admin2026',
  'Coordinateur (Lems)',
  'admin',
  '#4318FF',
  'light',
  1
);

-- Planner 1
INSERT OR IGNORE INTO users (id, agency_id, username, password_hash, name, role, color, theme, is_active)
VALUES (
  'p_lem_002',
  'agency_lems_2026',
  'sophie',
  'Planner2026',
  'Sophie (Planner)',
  'planner',
  '#06b6d4',
  'blue',
  1
);

-- Planner 2
INSERT OR IGNORE INTO users (id, agency_id, username, password_hash, name, role, color, theme, is_active)
VALUES (
  'p_lem_003',
  'agency_lems_2026',
  'assistante',
  'Planner2026',
  'Assistante',
  'planner',
  '#f59e0b',
  'light',
  1
);

-- Client 1
INSERT OR IGNORE INTO users (id, agency_id, username, password_hash, name, role, color, theme, is_active)
VALUES (
  'client_ny_001',
  NULL,
  'marie',
  'mariage2026',
  'Ny (Mariée)',
  'client',
  '#ec4899',
  'light',
  1
);

-- Client 2
INSERT OR IGNORE INTO users (id, agency_id, username, password_hash, name, role, color, theme, is_active)
VALUES (
  'client_nd_001',
  NULL,
  'marie2',
  'mariage2026',
  'Andry (Marié)',
  'client',
  '#3b82f6',
  'light',
  1
);

-- Projet de mariage (Ny & Andry)
INSERT OR IGNORE INTO projects (id, agency_id, name, couple, date, venue, status, color, budget, currency, notes)
VALUES (
  'proj_ny_andry_2026',
  'agency_lems_2026',
  'Mariage Ny & Andry',
  'Ny Andry & Jenny',
  '2026-07-16',
  'Église Notre-Dame + Salle des fêtes',
  'en_cours',
  '#4318FF',
  50000,
  'EUR',
  'Événement religieux + réception. Veillée (Vodiondry) le 15 juillet.'
);

-- Assignation planners au projet
INSERT OR IGNORE INTO project_planners (project_id, user_id, role_label)
VALUES 
  ('proj_ny_andry_2026', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin'),
  ('proj_ny_andry_2026', 'p_lem_002', 'lead_planner'),
  ('proj_ny_andry_2026', 'p_lem_003', 'assistant_planner');

-- Assignation clients au projet
INSERT OR IGNORE INTO project_clients (project_id, user_id, role_label)
VALUES 
  ('proj_ny_andry_2026', 'client_ny_001', 'bride'),
  ('proj_ny_andry_2026', 'client_nd_001', 'groom');

-- Tâches du projet
--   Les tâches réelles (≈75) sont chargées séparément depuis import_taches.sql,
--   qui fait foi. À exécuter APRÈS ce seed :
--     npx wrangler d1 execute eventflow-db --local --file=import_taches.sql --yes

-- Prestataires
INSERT OR IGNORE INTO vendors (id, project_id, name, role, scope, color, statut, contact_name, contact_email, quote_amount)
VALUES
  ('vendor_1', 'proj_ny_andry_2026', 'Album Music', 'Orchestre', 'Cérémonie religieuse + cocktail', '#05CD99', 'confirme', 'Marc Durand', 'marc@albummusic.com', 2500),
  ('vendor_2', 'proj_ny_andry_2026', 'Vazaha Traiteur', 'Traiteur', 'Réception complète (cocktail + repas)', '#EE5D50', 'confirme', 'Jean Razak', 'contact@vazaha.com', 8000),
  ('vendor_3', 'proj_ny_andry_2026', 'Mi Rec Studio', 'Vidéo & Photo', 'Reportage complet jour J', '#4318FF', 'en_recherche', NULL, NULL, NULL),
  ('vendor_4', 'proj_ny_andry_2026', 'Décor Plus', 'Décoration', 'Décoration salle + fleurs', '#7551FF', 'contacte', 'Nadia Leblanc', 'nadia@decor-plus.fr', 1500);

-- Dépenses budgétaires
INSERT OR IGNORE INTO expenses (id, project_id, vendor_id, label, category, amount, date, paid, invoice_ref)
VALUES
  ('exp_1', 'proj_ny_andry_2026', 'vendor_1', 'Acompte orchestre', 'Prestataires', 1250, '2026-02-01', 1, 'INV-001'),
  ('exp_2', 'proj_ny_andry_2026', 'vendor_2', 'Acompte traiteur', 'Prestataires', 4000, '2026-03-15', 1, 'INV-002'),
  ('exp_3', 'proj_ny_andry_2026', NULL, 'Fleurs mairie', 'Décoration', 250, '2026-06-01', 0, NULL),
  ('exp_4', 'proj_ny_andry_2026', NULL, 'Invitations', 'Papeterie', 350, '2026-01-25', 1, 'INV-003');
