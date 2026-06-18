#!/usr/bin/env node

/**
 * Export des données existantes de D1 vers SQL
 *
 * Usage:
 *   npx wrangler d1 execute eventflow-db --remote --command "SELECT * FROM users;"
 *   node scripts/export-d1-data.js
 *
 * Ce script exporte les données actuelles de D1 en JSON,
 * puis les convertit en SQL INSERT statements pour seed.sql
 */

const fs = require('fs');
const path = require('path');

// Configuration des tables à exporter
const TABLES = ['users', 'agencies', 'projects', 'tasks', 'vendors', 'expenses', 'notifications'];

async function exportData() {
  console.log('📤 Export des données D1 existantes...\n');

  // Instructions pour l'utilisateur
  console.log('⚠️  INSTRUCTIONS MANUELLES (données sensibles) :\n');
  console.log('1. Connectez-vous à votre dashboard Cloudflare');
  console.log('2. Allez dans Workers > D1 > eventflow-db');
  console.log('3. Pour chaque table, exécutez :');
  console.log('');

  TABLES.forEach(table => {
    console.log(`   SELECT * FROM ${table};`);
  });

  console.log('');
  console.log('4. Copiez les résultats JSON');
  console.log('5. Créez un fichier data-export.json avec le contenu');
  console.log('6. Exécutez : node scripts/convert-to-seed.js\n');

  console.log('📌 Alternative (via CLI) :\n');
  console.log('   for table in users agencies projects tasks vendors expenses notifications; do');
  console.log('     npx wrangler d1 execute eventflow-db --remote --format json --command "SELECT * FROM $table;" > data/$table.json');
  console.log('   done\n');
}

exportData().catch(console.error);
