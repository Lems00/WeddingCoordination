-- 1. Création de la table de staging (temporaire)
--    project_id : colonne nécessaire pour rattacher chaque tâche à un projet
--    de la table `tasks` (renseignée à l'étape 4, pas dans le CSV source).
CREATE TABLE IF NOT EXISTS staging_taches_mariage (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    phase TEXT,
    categorie TEXT,
    tache TEXT,
    duree TEXT,
    debut TEXT,
    fin TEXT,
    predecesseur TEXT,
    responsable TEXT,
    statut TEXT
);

-- 2. Nettoyage de sécurité avant l'importation
DELETE FROM staging_taches_mariage;

-- 3. Insertion de l'intégralité des données du CSV
INSERT INTO staging_taches_mariage (id, phase, categorie, tache, duree, debut, fin, predecesseur, responsable, statut) VALUES
-- PHASE : PRÉPARATION
('P01', 'Préparation', 'Coordination', 'Signature du contrat de coordination', '1 jour', '2026-06-02', '2026-06-02', '', 'Coordinateur', 'En cours'),
('P02', 'Préparation', 'Coordination', 'Réunion de cadrage avec les mariés', '1 jour', '2026-06-03', '2026-06-03', 'P01', 'Coordinateur', 'Terminé'),
('P03', 'Préparation', 'Coordination', 'Visite technique du lieu', '1 jour', '2026-06-04', '2026-06-04', 'P02', 'Coordinateur', 'Terminé'),
('P04', 'Préparation', 'Logistique', 'Inventaire tables et chaises avec le propriétaire', '1 jour', '2026-07-14', '2026-07-14', 'P03', 'Coordinateur', 'À faire'),
('P05', 'Préparation', 'Logistique', 'Test de la puissance électrique du lieu', '1 jour', '2026-06-04', '2026-06-04', 'P03', 'Coordinateur', 'À faire'),
('P06', 'Préparation', 'Prestataires', 'Confirmation Mi Rec Production (vidéo et photo). Signature de contrat', '3 jours', '2026-06-05', '2026-06-09', 'P01', 'Coordinateur', 'À faire'),
('P07', 'Préparation', 'Prestataires', 'Confirmation Vazaha (cuisine)', '3 jours', '2026-06-03', '2026-06-05', 'P01', 'Coordinateur', 'Terminé'),
('P08', 'Préparation', 'Prestataires', 'Confirmation Album Music (orchestre)', '3 jours', '2026-06-03', '2026-06-05', 'P01', 'Coordinateur', 'À faire'),
('P09', 'Préparation', 'Prestataires', 'Confirmation MRE (église et sonorisation)', '3 jours', '2026-06-03', '2026-06-05', 'P01', 'Coordinateur', 'À faire'),
('P10', 'Préparation', 'Prestataires', 'Confirmation Jennya (décoration)', '3 jours', '2026-06-03', '2026-06-05', 'P01', 'Coordinateur', 'Terminé'),
('P11', 'Préparation', 'Logistique invités', 'Clôture définitive de la liste des invités', '5 jours', '2026-06-03', '2026-06-08', 'P02', 'Mariés', 'À faire'),
('P12', 'Préparation', 'Protocole', 'Définition du protocole Vodiondry avec les familles', '5 jours', '2026-06-09', '2026-06-13', 'P02', 'Coordinateur', 'À faire'),
('P13', 'Préparation', 'Protocole', 'Confirmation de l''officier d''état civil', '3 jours', '2026-06-09', '2026-06-11', 'P03', 'Mariés', 'À faire'),
('P14', 'Préparation', 'Protocole', 'Confirmation des pasteurs Jocelyn et Solofo', '3 jours', '2026-06-09', '2026-06-11', 'P02', 'Mariés', 'À faire'),
('P15', 'Préparation', 'Son', 'Vérifier périmètre sonore MRE pour les 3 cérémonies', '2 jours', '2026-06-09', '2026-06-10', 'P09', 'Coordinateur', 'À faire'),
('P16', 'Préparation', 'Son', 'Recherche prestataire sonorisation complémentaire (le cas échéant)', '4 jours', '2026-06-11', '2026-06-14', 'P15', 'Coordinateur', 'À faire'),
('P17', 'Préparation', 'Prestataires', 'Recherche prestataire effets spéciaux', '5 jours', '2026-06-09', '2026-06-13', 'P03', 'Coordinateur', 'En cours'),
('P18', 'Préparation', 'Prestataires', 'Recherche prestataire écrans géants', '5 jours', '2026-06-09', '2026-06-13', 'P03', 'Coordinateur', 'Terminé'),
('P19', 'Préparation', 'Prestataires', 'Recherche prestataire jeux de lumières', '5 jours', '2026-06-09', '2026-06-13', 'P03', 'Coordinateur', 'En cours'),
('P20', 'Préparation', 'Prestataires', 'Recherche spectacle cirque style Aladin pour l''entrée des mariés', '5 jours', '2026-06-09', '2026-06-13', 'P02', 'Coordinateur', 'En cours'),
('P21', 'Préparation', 'Prestataires', 'Confirmation DJ (le cas échéant)', '3 jours', '2026-06-09', '2026-06-11', 'P02', 'Coordinateur', 'À faire'),
('P22', 'Préparation', 'Logistique invités', 'Envoi des invitations', '2 jours', '2026-06-09', '2026-06-10', 'P11', 'Mariés', 'À faire'),
('P23', 'Préparation', 'Restauration', 'Validation finale du menu avec Vazaha', '3 jours', '2026-06-16', '2026-06-18', 'P07', 'Coordinateur', 'À faire'),
('P24', 'Préparation', 'Restauration', 'Validation de la carte des boissons', '2 jours', '2026-06-19', '2026-06-20', 'P23', 'Mariés', 'À faire'),
('P25', 'Préparation', 'Gâteaux', 'Commande et acompte pièce montée', '1 jour', '2026-06-16', '2026-06-16', 'P02', 'Mariés', 'À faire'),
('P26', 'Préparation', 'Gâteaux', 'Commande des boîtes, barquettes et sacs personnalisés', '4 jours', '2026-06-16', '2026-06-19', 'P02', 'Coordinateur', 'À faire'),
('P27', 'Préparation', 'Décoration', 'Validation du plan de décoration avec Jennya', '5 jours', '2026-06-16', '2026-06-20', 'P10', 'Coordinateur', 'À faire'),
('P28', 'Préparation', 'Logistique', 'Location des tables hautes pour cocktail', '3 jours', '2026-06-17', '2026-06-19', 'P03', 'Coordinateur', 'À faire'),
('P29', 'Préparation', 'Logistique', 'Location vaisselle, couverts et verrerie', '3 jours', '2026-06-17', '2026-06-19', 'P07', 'Coordinateur', 'À faire'),
('P30', 'Préparation', 'Sécurité', 'Autorisations lanternes et pyrotechnie', '5 jours', '2026-06-16', '2026-06-20', 'P17', 'Coordinateur', 'À faire'),
('P31', 'Préparation', 'Lanternes', 'Commande des lanternes pour le lancer', '3 jours', '2026-06-22', '2026-06-24', 'P17', 'Coordinateur', 'À faire'),
('P32', 'Préparation', 'Logistique invités', 'Suivi des confirmations de présence', '5 jours', '2026-06-23', '2026-06-27', 'P22', 'Mariés', 'À faire'),
('P33', 'Préparation', 'Logistique invités', 'Relance des invités non répondants', '3 jours', '2026-06-26', '2026-06-28', 'P32', 'Mariés', 'À faire'),
('P34', 'Préparation', 'Coordination', 'Réunion intermédiaire avec les mariés', '1 jour', '2026-06-25', '2026-06-25', 'P12', 'Coordinateur', 'À faire'),
('P35', 'Préparation', 'Logistique invités', 'Finalisation du plan de table', '4 jours', '2026-06-30', '2026-07-03', 'P33', 'Mariés', 'À faire'),
('P36', 'Préparation', 'Coordination', 'Rédaction du conducteur heure par heure', '4 jours', '2026-06-30', '2026-07-03', 'P34', 'Coordinateur', 'À faire'),
('P37', 'Préparation', 'Coordination', 'Validation du conducteur avec les mariés', '2 jours', '2026-07-04', '2026-07-05', 'P36', 'Mariés', 'À faire'),
('P38', 'Préparation', 'Sécurité', 'Vérification accès, issues de secours, extincteurs', '1 jour', '2026-07-07', '2026-07-07', 'P03', 'Coordinateur', 'À faire'),
('P39', 'Préparation', 'Lanternes', 'Réception et test des lanternes', '2 jours', '2026-07-14', '2026-07-14', 'P31', 'Coordinateur', 'À faire'),
('P40', 'Préparation', 'Barquettes', 'Commande et réception des barquettes à emporter', '3 jours', '2026-07-08', '2026-07-10', 'P23', 'Coordinateur', 'À faire'),
('P41', 'Préparation', 'Coordination', 'Briefing final avec tous les prestataires', '2 jours', '2026-07-13', '2026-07-14', 'P37', 'Coordinateur', 'À faire'),
('P42', 'Préparation', 'Coordination', 'Préparation des fiches missions par prestataire', '2 jours', '2026-07-11', '2026-07-12', 'P37', 'Mariés', 'À faire'),
('P43', 'Préparation', 'Logistique', 'Vérification finale de toutes les commandes', '1 jour', '2026-07-14', '2026-07-14', 'P41', 'Coordinateur', 'À faire'),
('T75', 'Préparation', 'Logistique invités', 'Distribution des faire-part d''invitation', '7 jours', '2026-06-08', '2026-06-13', 'P11', 'Mariés', 'À faire'),

-- PHASE : VEILLE
('V01', 'Veille', 'Décoration', 'Livraison du matériel de décoration', '2 heures', '2026-07-15', '2026-07-15', 'P27', 'Jennya', 'À faire'),
('V02', 'Veille', 'Décoration', 'Installation complète de la décoration', '6 heures', '2026-07-15', '2026-07-15', 'V01', 'Jennya', 'À faire'),
('V03', 'Veille', 'Lumières', 'Livraison du matériel jeux de lumières', '1 heure', '2026-07-15', '2026-07-15', 'P19', 'Prestataire lumières', 'À faire'),
('V04', 'Veille', 'Lumières', 'Installation des jeux de lumières', '4 heures', '2026-07-15', '2026-07-15', 'V03', 'Prestataire lumières', 'À faire'),
('V05', 'Veille', 'Lumières', 'Tests et réglages des lumières', '1 heure', '2026-07-15', '2026-07-15', 'V04', 'Prestataire lumières', 'À faire'),
('V06', 'Veille', 'Orchestre', 'Livraison du matériel orchestre', '1 heure', '2026-07-15', '2026-07-15', 'P08', 'Album Music', 'À faire'),
('V07', 'Veille', 'Orchestre', 'Installation du matériel orchestre', '2 heures', '2026-07-15', '2026-07-15', 'V06', 'Album Music', 'À faire'),
('V08', 'Veille', 'Orchestre', 'Balance et tests son orchestre', '1 heure', '2026-07-15', '2026-07-15', 'V07', 'Album Music', 'À faire'),
('V09', 'Veille', 'Coordination', 'Tour de vérification générale par le coordinateur', '1 heure', '2026-07-15', '2026-07-15', 'V02,V05,V08', 'Coordinateur', 'À faire'),
('V10', 'Veille', 'Coordination', 'Validation de la checklist veille', '30 min', '2026-07-15', '2026-07-15', 'V09', 'Coordinateur', 'À faire'),
('J02', 'Veille', 'Cuisine', 'Livraison des ustensiles de cuisine', '30 min', '2026-07-15', '2026-07-16', 'J01', 'Vazaha', 'À faire'),
('J04', 'Veille', 'Cuisine', 'Installation complète de la cuisine', '1 heure', '2026-07-15', '2026-07-16', '', 'Vazaha', 'À faire'),
('J05', 'Veille', 'Cuisine', 'Début des préparations culinaires', 'Continue', '2026-07-15', '2026-07-16', 'J04', 'Vazaha', 'À faire'),
('J07', 'Veille', 'Logistique', 'Livraison des tables hautes cocktail', '30 min', '2026-07-15', '2026-07-15', 'P28', 'Coordinateur', 'À faire'),
('J08', 'Veille', 'Logistique', 'Mise en place mobilier complémentaire', '30 min', '2026-07-15', '2026-07-16', 'J07', 'Équipe régie', 'À faire'),

-- PHASE : JOUR J
('J01', 'Jour J', 'Cuisine', 'Arrivée équipe cuisine Vazaha', '30 min', '2026-07-16', '2026-07-16', 'V10', 'Vazaha', 'À faire'),
('J03', 'Jour J', 'Cuisine', 'Livraison des denrées alimentaires', '30 min', '2026-07-16', '2026-07-16', 'J01', 'Vazaha', 'À faire'),
('J06', 'Jour J', 'Coordination', 'Arrivée équipe de coordination', '15 min', '2026-07-16', '2026-07-16', 'V10', 'Coordinateur', 'À faire'),
('J09', 'Jour J', 'Logistique', 'Mise en place de la signalétique', '30 min', '2026-07-16', '2026-07-16', 'J06', 'Équipe régie', 'À faire'),
('J10', 'Jour J', 'Décoration', 'Retouches décoration matin', '1 heure', '2026-07-16', '2026-07-16', 'V02', 'Jennya', 'À faire'),
('J11', 'Jour J', 'Vidéo et photo', 'Arrivée Mi Rec Production', '15 min', '2026-07-16', '2026-07-16', 'P06', 'Mi Rec Production', 'À faire'),
('J12', 'Jour J', 'Vidéo et photo', 'Installation de l''écrans géants 73"', '1 heure', '2026-07-15', '2026-07-16', 'J11', 'Mi Rec Production', 'À faire'),
('J13', 'Jour J', 'Vidéo et photo', 'Installation des caméras et tests', '30 min', '2026-07-16', '2026-07-16', 'J12', 'Mi Rec Production', 'À faire'),
('J14', 'Jour J', 'Effets spéciaux', 'Arrivée prestataire effets spéciaux', '15 min', '2026-07-16', '2026-07-16', 'P17', 'Prestataire FX', 'À faire'),
('J15', 'Jour J', 'Effets spéciaux', 'Installation et tests effets spéciaux', '1 heure', '2026-07-16', '2026-07-16', 'J14', 'Prestataire FX', 'À faire'),
('J16', 'Jour J', 'Son', 'Arrivée MRE et installation son', '1 heure', '2026-07-16', '2026-07-16', 'P09', 'MRE', 'À faire'),
('J17', 'Jour J', 'Son', 'Tests micro et son', '30 min', '2026-07-16', '2026-07-16', 'J16', 'MRE', 'À faire'),
('J18', 'Jour J', 'Gâteaux', 'Livraison de la pièce montée', '15 min', '2026-07-16', '2026-07-16', 'P25', 'Prestataire pâtisserie', 'À faire'),
('J19', 'Jour J', 'Gâteaux', 'Installation pièce montée et boîtes sur tables', '30 min', '2026-07-16', '2026-07-16', 'J18', 'Équipe coordination', 'À faire'),
('J20', 'Jour J', 'Coordination', 'Briefing général tous prestataires', '30 min', '2026-07-16', '2026-07-16', 'J04,J08,J09,J10,J13,J15,J17,J19', 'Coordinateur', 'À faire'),
('J21', 'Jour J', 'Événement', 'Début événement — Accueil des invités', 'Continue', '2026-07-16', '2026-07-16', 'J20', 'Coordinateur', 'À faire');

-- 4. Rattachement au projet : renseigne la colonne manquante pour toutes les lignes.
UPDATE staging_taches_mariage SET project_id = 'proj_ny_andry_2026';

-- 5. Transfert vers la table définitive `tasks` (remplace les tâches existantes
--    du projet). Mapping staging -> tasks :
--      categorie -> category, tache -> name, duree -> duration,
--      debut/fin -> start_date/end_date, predecesseur -> predecessor,
--      responsable -> responsible_name (libellé libre ; responsible_user_id NULL),
--      statut -> status, ordre d'insertion -> sort_order.
DELETE FROM tasks WHERE project_id = 'proj_ny_andry_2026';

INSERT INTO tasks
  (id, project_id, phase, category, name, duration, start_date, end_date,
   responsible_user_id, responsible_name, predecessor, status, sort_order)
SELECT
  id, project_id, phase, categorie, tache, duree, debut, fin,
  NULL, responsable, predecesseur, statut, rowid
FROM staging_taches_mariage;

-- 6. Nettoyage de la table temporaire.
DROP TABLE staging_taches_mariage;