-- ============================================================================
-- SEED DATA COMPATIBLE : Données de démonstration pour EventFlow Pro
-- Compatible avec schema.sql (2026-06-12)
-- ============================================================================

-- PRAGMA foreign_keys = ON;

-- Agence par défaut
INSERT OR IGNORE INTO agencies (id, name, owner_user_id) 
VALUES ('agency_lems_2026', 'Lems Coordination', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Super admin (doit exister avant de l'affecter à une agence)
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

-- Client 1 (Ny)
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

-- Client 2 (Andry)
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
  'MGA',
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

-- Tâches du projet (sans dépendances pour l'instant)
INSERT OR IGNORE INTO tasks (id, project_id, phase, category, name, duration, start_date, end_date, responsible_user_id, status)
VALUES
  ('task_1', 'proj_ny_andry_2026', 'Préparation', 'Administratif', 'Réserver l''église', '1 jour', '2026-01-15', '2026-01-15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Terminé'),
  ('task_2', 'proj_ny_andry_2026', 'Préparation', 'Décoration', 'Choisir le thème de couleur', '2 jours', '2026-01-20', '2026-01-22', 'p_lem_002', 'En cours'),
  ('task_3', 'proj_ny_andry_2026', 'Veille', 'Logistique', 'Vérifier le matériel', '1 jour', '2026-07-15', '2026-07-15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'À faire'),
  ('task_4', 'proj_ny_andry_2026', 'Jour J', 'Cérémonie', 'Mise en place de la cérémonie', '3 heures', '2026-07-16', '2026-07-16', 'p_lem_003', 'À faire'),
  ('task_5', 'proj_ny_andry_2026', 'Jour J', 'Réception', 'Accueil des invités', '8 heures', '2026-07-16', '2026-07-16', 'p_lem_002', 'À faire');

-- Prestataires
INSERT OR IGNORE INTO vendors (id, project_id, name, role, scope, color, statut, contact_name, contact_email, quote_amount)
VALUES
  ('vendor_1', 'proj_ny_andry_2026', 'Album Music', 'Orchestre', 'Cérémonie religieuse + cocktail', '#05CD99', 'confirme', 'Marc Durand', 'marc@albummusic.com', 2500),
  ('vendor_2', 'proj_ny_andry_2026', 'Vazaha Traiteur', 'Traiteur', 'Réception complète (cocktail + repas)', '#EE5D50', 'confirme', 'Jean Razak', 'contact@vazaha.com', 8000),
  ('vendor_3', 'proj_ny_andry_2026', 'Mi Rec Studio', 'Vidéo & Photo', 'Reportage complet jour J', '#4318FF', 'en_recherche', NULL, NULL, NULL),
  ('vendor_4', 'proj_ny_andry_2026', 'Décor Plus', 'Décoration', 'Décoration salle + fleurs', '#7551FF', 'contacte', 'Nadia Leblanc', 'nadia@decor-plus.fr', 1500);

-- Dépenses budgétaires (Ariary - devise malgache)
INSERT OR IGNORE INTO expenses (id, project_id, vendor_id, label, category, amount, date, paid, invoice_ref)
VALUES
  ('exp_1', 'proj_ny_andry_2026', 'vendor_1', 'Acompte orchestre', 'Prestataires', 1250000, '2026-02-01', 1, 'INV-001'),
  ('exp_2', 'proj_ny_andry_2026', 'vendor_2', 'Acompte traiteur', 'Prestataires', 4000000, '2026-03-15', 1, 'INV-002'),
  ('exp_3', 'proj_ny_andry_2026', NULL, 'Fleurs mairie', 'Décoration', 250000, '2026-06-01', 0, NULL),
  ('exp_4', 'proj_ny_andry_2026', NULL, 'Invitations', 'Papeterie', 350000, '2026-01-25', 1, 'INV-003');

-- Journées du conducteur
INSERT OR IGNORE INTO conducteur_jours (id, project_id, label, date, time_start, time_end, subtitle, guest_count)
VALUES
  ('jour_vodiondry', 'proj_ny_andry_2026', 'Vodiondry', '2026-07-15', '18:00', '23:30', 'J-1 Veille', 150),
  ('jour_ceremonies', 'proj_ny_andry_2026', 'Journée du mariage', '2026-07-16', '08:00', '23:00', 'J - Jour officiel', 250);

-- Phases du conducteur (Jour 1 : Vodiondry)
INSERT OR IGNORE INTO conducteur_phases (id, jour_id, title, time_slot)
VALUES
  ('phase_vodiondry_accueil', 'jour_vodiondry', 'Accueil et apéritif', '18:00 — 19:30'),
  ('phase_vodiondry_diner', 'jour_vodiondry', 'Dîner traditionnel', '19:30 — 22:00'),
  ('phase_vodiondry_animations', 'jour_vodiondry', 'Animations et danse', '22:00 — 23:30');

-- Actions pour les phases (exemples)
INSERT OR IGNORE INTO conducteur_actions (id, phase_id, content, sort_order)
VALUES
  ('action_1', 'phase_vodiondry_accueil', 'Accueil des invités à l''entrée', 1),
  ('action_2', 'phase_vodiondry_accueil', 'Service des boissons et bouchées', 2),
  ('action_3', 'phase_vodiondry_diner', 'Service du repas traditionnel', 1),
  ('action_4', 'phase_vodiondry_diner', 'Interventions des parents', 2);
