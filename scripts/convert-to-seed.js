#!/usr/bin/env node

/**
 * Convertit les données exportées de D1 en SQL INSERT statements
 *
 * Usage:
 *   node scripts/convert-to-seed.js
 *
 * Lit les fichiers data/*.json et génère database/seed-with-existing-data.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const outputFile = path.join(__dirname, '..', 'database', 'seed-with-existing-data.sql');

function escapeSql(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  // Escape single quotes
  return `'${value.toString().replace(/'/g, "''")}'`;
}

function generateInsertStatement(table, record) {
  const columns = Object.keys(record);
  const values = columns.map(col => escapeSql(record[col]));

  return `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

function main() {
  console.log('🔄 Conversion des données exportées en SQL...\n');

  const tables = ['users', 'agencies', 'projects', 'tasks', 'vendors', 'expenses', 'notifications'];
  let sqlContent = `-- ============================================================================
-- Données existantes exportées de D1
-- Généré automatiquement par scripts/convert-to-seed.js
-- Date: ${new Date().toISOString()}
-- ============================================================================

-- ⚠️ IMPORTANT : Désactiver les contraintes de clé étrangère pendant l'import
PRAGMA foreign_keys = OFF;

`;

  let hasData = false;

  for (const table of tables) {
    const dataFile = path.join(dataDir, `${table}.json`);

    if (fs.existsSync(dataFile)) {
      try {
        let data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

        // Extract from wrangler's response format
        if (data.length > 0 && data[0].results) {
          data = data[0].results;
        } else if (data.results) {
          data = data.results;
        }

        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ ${table}: ${data.length} enregistrements`);

          sqlContent += `\n-- ${table.toUpperCase()}\n`;
          data.forEach(record => {
            sqlContent += generateInsertStatement(table, record) + '\n';
          });

          hasData = true;
        } else {
          console.log(`⏭️  ${table}: aucune donnée`);
        }
      } catch (err) {
        console.error(`❌ Erreur lecture ${table}.json:`, err.message);
      }
    } else {
      console.log(`⏭️  ${table}: fichier non trouvé (${dataFile})`);
    }
  }

  // Réactiver les contraintes
  sqlContent += `\n-- Réactiver les contraintes de clé étrangère
PRAGMA foreign_keys = ON;
`;

  if (hasData) {
    fs.writeFileSync(outputFile, sqlContent);
    console.log(`\n✅ Fichier généré: ${outputFile}`);
    console.log(`📊 ${sqlContent.split('\n').filter(l => l.startsWith('INSERT')).length} requêtes INSERT`);

    console.log('\n📌 Prochaine étape :');
    console.log(`   npx wrangler d1 execute eventflow-db --remote --file=${outputFile}`);
  } else {
    console.log('\n⚠️  Aucune donnée trouvée à exporter.');
    console.log('Assurez-vous que les fichiers data/*.json existent.');
  }
}

main();
