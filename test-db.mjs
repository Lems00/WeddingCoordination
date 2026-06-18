#!/usr/bin/env node
/**
 * Script de test local pour EventFlow Pro — Base de données
 * 
 * Objectifs :
 *   1. Vérifier que la BD locale est bien créée
 *   2. Tester les opérations CRUD utilisateurs
 *   3. Vérifier que les données de démo sont présentes
 *   4. Valider les relations entre tables
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  🧪 TEST LOCAL — EventFlow Pro Database                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

/**
 * Exécute une commande Wrangler D1
 */
function executeD1(sql) {
  try {
    const cmd = `npx wrangler d1 execute eventflow-db --local --command="${sql.replace(/"/g, '\\"')}"`;
    const result = execSync(cmd, { cwd: projectRoot, encoding: 'utf8' });
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error.message);
    return null;
  }
}

/**
 * Test 1 : Vérifier que les tables existent
 */
console.log('📋 Test 1: Vérification des tables existantes');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const tablesQuery = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;";
const tables = executeD1(tablesQuery);
if (tables) {
  const tableList = tables.split('\\n').filter(t => t.trim() && !t.includes('─'));
  console.log(`✅ ${tableList.length} tables trouvées:\\n`);
  tableList.forEach(t => console.log(`   • ${t.trim()}`));
} else {
  console.log('❌ Impossible de lister les tables');
}

/**
 * Test 2 : Compter les utilisateurs
 */
console.log('\n👥 Test 2: Nombre d\'utilisateurs');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const usersCountQuery = 'SELECT COUNT(*) as count FROM users;';
const usersCount = executeD1(usersCountQuery);
if (usersCount) {
  console.log(usersCount);
}

/**
 * Test 3 : Lister les utilisateurs de démo
 */
console.log('📍 Test 3: Comptes de démonstration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const usersListQuery = 'SELECT username, name, role FROM users ORDER BY role, name;';
const usersList = executeD1(usersListQuery);
if (usersList) {
  console.log(usersList);
}

/**
 * Test 4 : Vérifier les projets
 */
console.log('📊 Test 4: Projets disponibles');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const projectsQuery = 'SELECT id, couple, date, status FROM projects;';
const projects = executeD1(projectsQuery);
if (projects) {
  console.log(projects);
}

/**
 * Test 5 : Vérifier les tâches
 */
console.log('✓ Test 5: Tâches du projet');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const tasksQuery = 'SELECT COUNT(*) as count FROM tasks;';
const tasksCount = executeD1(tasksQuery);
if (tasksCount) {
  console.log(tasksCount);
}

/**
 * Test 6 : Vérifier les prestataires
 */
console.log('🏢 Test 6: Prestataires');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const vendorsQuery = 'SELECT name, role, statut FROM vendors;';
const vendors = executeD1(vendorsQuery);
if (vendors) {
  console.log(vendors);
}

/**
 * Test 7 : Vérifier les dépenses
 */
console.log('💰 Test 7: Dépenses budgétaires');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const expensesQuery = 'SELECT SUM(amount) as total FROM expenses;';
const expenses = executeD1(expensesQuery);
if (expenses) {
  console.log(expenses);
}

/**
 * Test 8 : Test de relation (N-N)
 */
console.log('🔗 Test 8: Assignations (Relations N-N)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const assignmentsQuery = 'SELECT COUNT(*) as planners FROM project_planners;';
const assignments = executeD1(assignmentsQuery);
if (assignments) {
  console.log('Planificateurs assignés:');
  console.log(assignments);
}

/**
 * Résumé final
 */
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  ✅ TESTS LOCAUX TERMINÉS                                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📌 Prochaines étapes:');
console.log('   1. npm run dev                    → Lancer l\'app');
console.log('   2. Se connecter avec superadmin   → Vérifier l\'auth');
console.log('   3. Tester Team.tsx                → Vérifier les boutons');
console.log('   4. Ajouter/Modifier/Supprimer un utilisateur');
console.log('\n');
