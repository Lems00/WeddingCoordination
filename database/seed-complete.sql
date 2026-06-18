-- ============================================================================
-- SEED DATA AVANCÉ : Données complètes pour EventFlow Pro
-- Basé sur import-csv.ts avec toutes les tâches du mariage
-- ============================================================================

-- PRAGMA foreign_keys = ON;

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

-- Projet de mariage (Ny & Andry) - BUDGET COMPLET
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
  150000000,
  'MGA',
  'Événement religieux + réception. Vodiondry le 15 juillet. Budget COMPLET avec tous prestataires.'
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

-- ============================================================================
-- TÂCHES COMPLÈTES (96 tâches - Phases: Préparation, Veille, Jour J)
-- ============================================================================

-- PHASE PRÉPARATION (43 tâches)
INSERT OR IGNORE INTO tasks (id, project_id, phase, category, name, duration, start_date, end_date, responsible_user_id, responsible_name, status)
VALUES
  ('P01', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Signature du contrat de coordination', '1 jour', '2026-06-02', '2026-06-02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'En cours'),
  ('P02', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Réunion de cadrage avec les mariés', '1 jour', '2026-06-03', '2026-06-03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'Terminé'),
  ('P03', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Visite technique du lieu', '1 jour', '2026-06-04', '2026-06-04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'Terminé'),
  ('P04', 'proj_ny_andry_2026', 'Préparation', 'Logistique', 'Inventaire tables et chaises avec le propriétaire', '1 jour', '2026-07-14', '2026-07-14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P05', 'proj_ny_andry_2026', 'Préparation', 'Logistique', 'Test de la puissance électrique du lieu', '1 jour', '2026-06-04', '2026-06-04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P06', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Confirmation Mi Rec Production (vidéo et photo)', '3 jours', '2026-06-05', '2026-06-09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P07', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Confirmation Vazaha (cuisine)', '3 jours', '2026-06-03', '2026-06-05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'Terminé'),
  ('P08', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Confirmation Album Music (orchestre)', '3 jours', '2026-06-03', '2026-06-05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P09', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Confirmation MRE (église et sonorisation)', '3 jours', '2026-06-03', '2026-06-05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P10', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Confirmation Jennya (décoration)', '3 jours', '2026-06-03', '2026-06-05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'Terminé'),
  ('P11', 'proj_ny_andry_2026', 'Préparation', 'Logistique invités', 'Clôture définitive de la liste des invités', '5 jours', '2026-06-03', '2026-06-08', 'client_ny_001', 'Mariés', 'À faire'),
  ('P12', 'proj_ny_andry_2026', 'Préparation', 'Protocole', 'Définition du protocole Vodiondry avec les familles', '5 jours', '2026-06-09', '2026-06-13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P13', 'proj_ny_andry_2026', 'Préparation', 'Protocole', 'Confirmation de l''officier d''état civil', '3 jours', '2026-06-09', '2026-06-11', 'client_ny_001', 'Mariés', 'À faire'),
  ('P14', 'proj_ny_andry_2026', 'Préparation', 'Protocole', 'Confirmation des pasteurs Jocelyn et Solofo', '3 jours', '2026-06-09', '2026-06-11', 'client_ny_001', 'Mariés', 'À faire'),
  ('P15', 'proj_ny_andry_2026', 'Préparation', 'Son', 'Vérifier périmètre sonore MRE pour les 3 cérémonies', '2 jours', '2026-06-09', '2026-06-10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P16', 'proj_ny_andry_2026', 'Préparation', 'Son', 'Recherche prestataire sonorisation complémentaire', '4 jours', '2026-06-11', '2026-06-14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P17', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Recherche prestataire effets spéciaux', '5 jours', '2026-06-09', '2026-06-13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'En cours'),
  ('P18', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Recherche prestataire écrans géants', '5 jours', '2026-06-09', '2026-06-13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'Terminé'),
  ('P19', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Recherche prestataire jeux de lumières', '5 jours', '2026-06-09', '2026-06-13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'En cours'),
  ('P20', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Recherche spectacle cirque style Aladin', '5 jours', '2026-06-09', '2026-06-13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'En cours'),
  ('P21', 'proj_ny_andry_2026', 'Préparation', 'Prestataires', 'Confirmation DJ (le cas échéant)', '3 jours', '2026-06-09', '2026-06-11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P22', 'proj_ny_andry_2026', 'Préparation', 'Logistique invités', 'Envoi des invitations', '2 jours', '2026-06-09', '2026-06-10', 'client_ny_001', 'Mariés', 'À faire'),
  ('P23', 'proj_ny_andry_2026', 'Préparation', 'Restauration', 'Validation finale du menu avec Vazaha', '3 jours', '2026-06-16', '2026-06-18', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P24', 'proj_ny_andry_2026', 'Préparation', 'Restauration', 'Validation de la carte des boissons', '2 jours', '2026-06-19', '2026-06-20', 'client_ny_001', 'Mariés', 'À faire'),
  ('P25', 'proj_ny_andry_2026', 'Préparation', 'Gâteaux', 'Commande et acompte pièce montée', '1 jour', '2026-06-16', '2026-06-16', 'client_ny_001', 'Mariés', 'À faire'),
  ('P26', 'proj_ny_andry_2026', 'Préparation', 'Gâteaux', 'Commande boîtes, barquettes et sacs personnalisés', '4 jours', '2026-06-16', '2026-06-19', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P27', 'proj_ny_andry_2026', 'Préparation', 'Décoration', 'Validation du plan de décoration avec Jennya', '5 jours', '2026-06-16', '2026-06-20', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P28', 'proj_ny_andry_2026', 'Préparation', 'Logistique', 'Location des tables hautes pour cocktail', '3 jours', '2026-06-17', '2026-06-19', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P29', 'proj_ny_andry_2026', 'Préparation', 'Logistique', 'Location vaisselle, couverts et verrerie', '3 jours', '2026-06-17', '2026-06-19', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P30', 'proj_ny_andry_2026', 'Préparation', 'Sécurité', 'Autorisations lanternes et pyrotechnie', '5 jours', '2026-06-16', '2026-06-20', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P31', 'proj_ny_andry_2026', 'Préparation', 'Lanternes', 'Commande des lanternes pour le lancer', '3 jours', '2026-06-22', '2026-06-24', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P32', 'proj_ny_andry_2026', 'Préparation', 'Logistique invités', 'Suivi des confirmations de présence', '5 jours', '2026-06-23', '2026-06-27', 'client_ny_001', 'Mariés', 'À faire'),
  ('P33', 'proj_ny_andry_2026', 'Préparation', 'Logistique invités', 'Relance des invités non répondants', '3 jours', '2026-06-26', '2026-06-28', 'client_ny_001', 'Mariés', 'À faire'),
  ('P34', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Réunion intermédiaire avec les mariés', '1 jour', '2026-06-25', '2026-06-25', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P35', 'proj_ny_andry_2026', 'Préparation', 'Logistique invités', 'Finalisation du plan de table', '4 jours', '2026-06-30', '2026-07-03', 'client_ny_001', 'Mariés', 'À faire'),
  ('P36', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Rédaction du conducteur heure par heure', '4 jours', '2026-06-30', '2026-07-03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P37', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Validation du conducteur avec les mariés', '2 jours', '2026-07-04', '2026-07-05', 'client_ny_001', 'Mariés', 'À faire'),
  ('P38', 'proj_ny_andry_2026', 'Préparation', 'Sécurité', 'Vérification accès, issues de secours, extincteurs', '1 jour', '2026-07-07', '2026-07-07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P39', 'proj_ny_andry_2026', 'Préparation', 'Lanternes', 'Réception et test des lanternes', '2 jours', '2026-07-14', '2026-07-14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P40', 'proj_ny_andry_2026', 'Préparation', 'Barquettes', 'Commande et réception des barquettes', '3 jours', '2026-07-08', '2026-07-10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P41', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Briefing final avec tous les prestataires', '2 jours', '2026-07-13', '2026-07-14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('P42', 'proj_ny_andry_2026', 'Préparation', 'Coordination', 'Préparation des fiches missions par prestataire', '2 jours', '2026-07-11', '2026-07-12', 'client_ny_001', 'Mariés', 'À faire'),
  ('P43', 'proj_ny_andry_2026', 'Préparation', 'Logistique', 'Vérification finale de toutes les commandes', '1 jour', '2026-07-14', '2026-07-14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('T75', 'proj_ny_andry_2026', 'Préparation', 'Logistique invités', 'Distribution des faire-part d''invitation', '7 jours', '2026-06-08', '2026-06-13', 'client_ny_001', 'Mariés', 'À faire');

-- PHASE VEILLE (14 tâches)
INSERT OR IGNORE INTO tasks (id, project_id, phase, category, name, duration, start_date, end_date, responsible_user_id, responsible_name, status)
VALUES
  ('V01', 'proj_ny_andry_2026', 'Veille', 'Décoration', 'Livraison du matériel de décoration', '2 heures', '2026-07-15', '2026-07-15', 'p_lem_002', 'Jennya', 'À faire'),
  ('V02', 'proj_ny_andry_2026', 'Veille', 'Décoration', 'Installation complète de la décoration', '6 heures', '2026-07-15', '2026-07-15', 'p_lem_002', 'Jennya', 'À faire'),
  ('V03', 'proj_ny_andry_2026', 'Veille', 'Lumières', 'Livraison du matériel jeux de lumières', '1 heure', '2026-07-15', '2026-07-15', 'p_lem_002', 'Prestataire lumières', 'À faire'),
  ('V04', 'proj_ny_andry_2026', 'Veille', 'Lumières', 'Installation des jeux de lumières', '4 heures', '2026-07-15', '2026-07-15', 'p_lem_002', 'Prestataire lumières', 'À faire'),
  ('V05', 'proj_ny_andry_2026', 'Veille', 'Lumières', 'Tests et réglages des lumières', '1 heure', '2026-07-15', '2026-07-15', 'p_lem_002', 'Prestataire lumières', 'À faire'),
  ('V06', 'proj_ny_andry_2026', 'Veille', 'Orchestre', 'Livraison du matériel orchestre', '1 heure', '2026-07-15', '2026-07-15', 'p_lem_003', 'Album Music', 'À faire'),
  ('V07', 'proj_ny_andry_2026', 'Veille', 'Orchestre', 'Installation du matériel orchestre', '2 heures', '2026-07-15', '2026-07-15', 'p_lem_003', 'Album Music', 'À faire'),
  ('V08', 'proj_ny_andry_2026', 'Veille', 'Orchestre', 'Balance et tests son orchestre', '1 heure', '2026-07-15', '2026-07-15', 'p_lem_003', 'Album Music', 'À faire'),
  ('V09', 'proj_ny_andry_2026', 'Veille', 'Coordination', 'Tour de vérification générale', '1 heure', '2026-07-15', '2026-07-15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('V10', 'proj_ny_andry_2026', 'Veille', 'Coordination', 'Validation de la checklist veille', '30 min', '2026-07-15', '2026-07-15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('J02', 'proj_ny_andry_2026', 'Veille', 'Cuisine', 'Livraison des ustensiles de cuisine', '30 min', '2026-07-15', '2026-07-16', 'p_lem_002', 'Vazaha', 'À faire'),
  ('J04', 'proj_ny_andry_2026', 'Veille', 'Cuisine', 'Installation complète de la cuisine', '1 heure', '2026-07-15', '2026-07-16', 'p_lem_002', 'Vazaha', 'À faire'),
  ('J05', 'proj_ny_andry_2026', 'Veille', 'Cuisine', 'Début des préparations culinaires', 'Continue', '2026-07-15', '2026-07-16', 'p_lem_002', 'Vazaha', 'À faire'),
  ('J07', 'proj_ny_andry_2026', 'Veille', 'Logistique', 'Livraison des tables hautes cocktail', '30 min', '2026-07-15', '2026-07-15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Équipe régie', 'À faire');

-- PHASE JOUR J (38 tâches - échantillon)
INSERT OR IGNORE INTO tasks (id, project_id, phase, category, name, duration, start_date, end_date, responsible_user_id, responsible_name, status)
VALUES
  ('J01', 'proj_ny_andry_2026', 'Jour J', 'Cuisine', 'Arrivée équipe cuisine Vazaha', '30 min', '2026-07-16', '2026-07-16', 'p_lem_002', 'Vazaha', 'À faire'),
  ('J03', 'proj_ny_andry_2026', 'Jour J', 'Cuisine', 'Livraison des denrées alimentaires', '30 min', '2026-07-16', '2026-07-16', 'p_lem_002', 'Vazaha', 'À faire'),
  ('J06', 'proj_ny_andry_2026', 'Jour J', 'Coordination', 'Arrivée équipe de coordination', '15 min', '2026-07-16', '2026-07-16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('J09', 'proj_ny_andry_2026', 'Jour J', 'Logistique', 'Mise en place de la signalétique', '30 min', '2026-07-16', '2026-07-16', 'p_lem_002', 'Équipe régie', 'À faire'),
  ('J10', 'proj_ny_andry_2026', 'Jour J', 'Décoration', 'Retouches décoration matin', '1 heure', '2026-07-16', '2026-07-16', 'p_lem_002', 'Jennya', 'À faire'),
  ('J11', 'proj_ny_andry_2026', 'Jour J', 'Vidéo et photo', 'Arrivée Mi Rec Production', '15 min', '2026-07-16', '2026-07-16', 'p_lem_002', 'Mi Rec Production', 'À faire'),
  ('J12', 'proj_ny_andry_2026', 'Jour J', 'Vidéo et photo', 'Installation de l''écrans géants 73"', '1 heure', '2026-07-15', '2026-07-16', 'p_lem_002', 'Mi Rec Production', 'À faire'),
  ('J13', 'proj_ny_andry_2026', 'Jour J', 'Vidéo et photo', 'Installation des caméras et tests', '30 min', '2026-07-16', '2026-07-16', 'p_lem_002', 'Mi Rec Production', 'À faire'),
  ('J14', 'proj_ny_andry_2026', 'Jour J', 'Effets spéciaux', 'Arrivée prestataire effets spéciaux', '15 min', '2026-07-16', '2026-07-16', 'p_lem_002', 'Prestataire FX', 'À faire'),
  ('J15', 'proj_ny_andry_2026', 'Jour J', 'Effets spéciaux', 'Installation et tests effets spéciaux', '1 heure', '2026-07-16', '2026-07-16', 'p_lem_002', 'Prestataire FX', 'À faire'),
  ('J16', 'proj_ny_andry_2026', 'Jour J', 'Son', 'Arrivée MRE et installation son', '1 heure', '2026-07-16', '2026-07-16', 'p_lem_003', 'MRE', 'À faire'),
  ('J17', 'proj_ny_andry_2026', 'Jour J', 'Son', 'Tests micro et son', '30 min', '2026-07-16', '2026-07-16', 'p_lem_003', 'MRE', 'À faire'),
  ('J18', 'proj_ny_andry_2026', 'Jour J', 'Gâteaux', 'Livraison de la pièce montée', '15 min', '2026-07-16', '2026-07-16', 'p_lem_002', 'Prestataire pâtisserie', 'À faire'),
  ('J19', 'proj_ny_andry_2026', 'Jour J', 'Gâteaux', 'Installation pièce montée et boîtes', '30 min', '2026-07-16', '2026-07-16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Équipe coordination', 'À faire'),
  ('J20', 'proj_ny_andry_2026', 'Jour J', 'Coordination', 'Briefing général tous prestataires', '30 min', '2026-07-16', '2026-07-16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire'),
  ('J21', 'proj_ny_andry_2026', 'Jour J', 'Événement', 'Début événement — Accueil des invités', 'Continue', '2026-07-16', '2026-07-16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Coordinateur', 'À faire');

-- ============================================================================
-- PRESTATAIRES PRINCIPAUX
-- ============================================================================

INSERT OR IGNORE INTO vendors (id, project_id, name, role, scope, color, statut, contact_name, contact_email, quote_amount)
VALUES
  ('vendor_1', 'proj_ny_andry_2026', 'Album Music', 'Orchestre', 'Cérémonie religieuse + cocktail', '#05CD99', 'confirme', 'Marc Durand', 'marc@albummusic.com', 12500000),
  ('vendor_2', 'proj_ny_andry_2026', 'Vazaha Traiteur', 'Traiteur', 'Réception complète (cocktail + repas)', '#EE5D50', 'confirme', 'Jean Razak', 'contact@vazaha.com', 80000000),
  ('vendor_3', 'proj_ny_andry_2026', 'Mi Rec Studio', 'Vidéo & Photo', 'Reportage complet jour J + écrans', '#4318FF', 'confirme', 'Pierre Dupont', 'pierre@mirec.mg', 25000000),
  ('vendor_4', 'proj_ny_andry_2026', 'Jennya Décor', 'Décoration', 'Décoration salle + fleurs', '#7551FF', 'confirme', 'Nadia Leblanc', 'nadia@jennya.mg', 15000000),
  ('vendor_5', 'proj_ny_andry_2026', 'MRE Son', 'Son & Éclairage', 'Son 3 cérémonies + lumières', '#FF6B6B', 'confirme', 'Christophe Martin', 'contact@mre.mg', 18000000);

-- ============================================================================
-- DÉPENSES BUDGÉTAIRES (En Ariary)
-- ============================================================================

INSERT OR IGNORE INTO expenses (id, project_id, vendor_id, label, category, amount, date, paid, invoice_ref)
VALUES
  ('exp_1', 'proj_ny_andry_2026', 'vendor_2', 'Acompte traiteur', 'Prestataires', 40000000, '2026-03-15', 1, 'INV-VAZAHA-001'),
  ('exp_2', 'proj_ny_andry_2026', 'vendor_1', 'Acompte orchestre', 'Prestataires', 6250000, '2026-02-01', 1, 'INV-ALBUM-001'),
  ('exp_3', 'proj_ny_andry_2026', 'vendor_3', 'Acompte vidéo/photo', 'Prestataires', 12500000, '2026-03-01', 1, 'INV-MIREC-001'),
  ('exp_4', 'proj_ny_andry_2026', 'vendor_4', 'Acompte décoration', 'Prestataires', 7500000, '2026-04-01', 1, 'INV-JENNYA-001'),
  ('exp_5', 'proj_ny_andry_2026', 'vendor_5', 'Acompte son/lumières', 'Prestataires', 9000000, '2026-02-15', 1, 'INV-MRE-001'),
  ('exp_6', 'proj_ny_andry_2026', NULL, 'Pièce montée (gâteau)', 'Gâteaux', 5000000, '2026-06-16', 0, NULL),
  ('exp_7', 'proj_ny_andry_2026', NULL, 'Invitations', 'Papeterie', 3500000, '2026-01-25', 1, 'INV-PRINT-001'),
  ('exp_8', 'proj_ny_andry_2026', NULL, 'Location tables hautes', 'Logistique', 3000000, '2026-06-17', 0, NULL),
  ('exp_9', 'proj_ny_andry_2026', NULL, 'Location vaisselle', 'Logistique', 4000000, '2026-06-17', 0, NULL),
  ('exp_10', 'proj_ny_andry_2026', NULL, 'Lanternes', 'Décoration', 2500000, '2026-06-22', 0, NULL);

-- ============================================================================
-- CONDUCTEUR — JOURNÉES ET PHASES
-- ============================================================================

-- Jour 1 : Vodiondry (15 juillet)
INSERT OR IGNORE INTO conducteur_jours (id, project_id, label, date, time_start, time_end, subtitle, guest_count)
VALUES
  ('jour_vodiondry', 'proj_ny_andry_2026', 'Vodiondry', '2026-07-15', '18:00', '23:30', 'J-1 Veille traditionnelle', 250);

-- Jour 2 : Mariage (16 juillet)
INSERT OR IGNORE INTO conducteur_jours (id, project_id, label, date, time_start, time_end, subtitle, guest_count)
VALUES
  ('jour_mariage', 'proj_ny_andry_2026', 'Jour du Mariage', '2026-07-16', '08:00', '23:00', 'J - Jour officiel', 500);

-- Phases Vodiondry
INSERT OR IGNORE INTO conducteur_phases (id, jour_id, title, time_slot)
VALUES
  ('phase_vodiondry_accueil', 'jour_vodiondry', 'Accueil et apéritif', '18:00 — 19:30'),
  ('phase_vodiondry_diner', 'jour_vodiondry', 'Dîner traditionnel', '19:30 — 22:00'),
  ('phase_vodiondry_animations', 'jour_vodiondry', 'Animations et danse', '22:00 — 23:30');

-- Phases Jour J
INSERT OR IGNORE INTO conducteur_phases (id, jour_id, title, time_slot)
VALUES
  ('phase_mariage_civil', 'jour_mariage', 'Cérémonie civile', '09:00 — 10:00'),
  ('phase_mariage_religieux', 'jour_mariage', 'Cérémonie religieuse', '10:30 — 11:30'),
  ('phase_mariage_cocktail', 'jour_mariage', 'Cocktail dinatoire', '12:00 — 14:00'),
  ('phase_mariage_repas', 'jour_mariage', 'Repas assis', '14:30 — 17:30'),
  ('phase_mariage_danses', 'jour_mariage', 'Danses et réjouissances', '18:00 — 23:00');

-- Actions Vodiondry
INSERT OR IGNORE INTO conducteur_actions (id, phase_id, content, sort_order)
VALUES
  ('action_v1', 'phase_vodiondry_accueil', 'Accueil des invités à l''entrée', 1),
  ('action_v2', 'phase_vodiondry_accueil', 'Service des boissons et bouchées', 2),
  ('action_v3', 'phase_vodiondry_diner', 'Service du repas traditionnel', 1),
  ('action_v4', 'phase_vodiondry_diner', 'Interventions des parents', 2),
  ('action_v5', 'phase_vodiondry_animations', 'Musique et danseurs', 1),
  ('action_v6', 'phase_vodiondry_animations', 'Lancer de lanternes', 2);

-- Actions Jour J (échantillon)
INSERT OR IGNORE INTO conducteur_actions (id, phase_id, content, sort_order)
VALUES
  ('action_j1', 'phase_mariage_civil', 'Arrivée des mariés avec cortège', 1),
  ('action_j2', 'phase_mariage_civil', 'Cérémonie mairie', 2),
  ('action_j3', 'phase_mariage_civil', 'Sortie officielle', 3),
  ('action_j4', 'phase_mariage_religieux', 'Entrée à l''église', 1),
  ('action_j5', 'phase_mariage_religieux', 'Messe de mariage', 2),
  ('action_j6', 'phase_mariage_cocktail', 'Service cocktail', 1),
  ('action_j7', 'phase_mariage_repas', 'Service gastronomique', 1),
  ('action_j8', 'phase_mariage_danses', 'Première danse des mariés', 1);
