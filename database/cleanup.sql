PRAGMA foreign_keys = OFF;

-- Suppression des index
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_agency;
DROP INDEX IF EXISTS idx_tasks_project;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_dates;
DROP INDEX IF EXISTS idx_vendors_project;
DROP INDEX IF EXISTS idx_expenses_project;
DROP INDEX IF EXISTS idx_conducteur_jours_project;
DROP INDEX IF EXISTS idx_conducteur_jours_date;
DROP INDEX IF EXISTS idx_conducteur_phases_jour;
DROP INDEX IF EXISTS idx_conducteur_actions_phase;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_project;
DROP INDEX IF EXISTS idx_activity_project;
DROP INDEX IF EXISTS idx_activity_user;

-- Suppression des tables
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS conducteur_phase_responsibles;
DROP TABLE IF EXISTS conducteur_actions;
DROP TABLE IF EXISTS conducteur_phases;
DROP TABLE IF EXISTS conducteur_jours;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS project_clients;
DROP TABLE IF EXISTS project_planners;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS agencies;

PRAGMA foreign_keys = ON;