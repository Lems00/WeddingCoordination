#!/usr/bin/env bash
# 🚀 COMMANDES ESSENTIELLES — EventFlow Pro
# 
# Copier/coller directement dans le terminal
# Date: 12 Juin 2026

echo "
╔════════════════════════════════════════════════════════════╗
║  🚀 EVENTFLOW PRO — SETUP COMPLET                         ║
╚════════════════════════════════════════════════════════════╝
"

# ============================================================================
# ÉTAPE 1 : INSTALLATION
# ============================================================================
echo "
📦 ÉTAPE 1 : Installation des dépendances
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm install

echo "✅ Dépendances installées"

# ============================================================================
# ÉTAPE 2 : BASE DE DONNÉES
# ============================================================================
echo "
🗄️  ÉTAPE 2 : Configuration de la base de données
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Créer la BD
echo "   • Création de la base de données..."
npx wrangler d1 create eventflow-db

# Initialiser le schéma
echo "   • Initialisation du schéma..."
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql

# Charger les données de démo
echo "   • Chargement des données de démonstration..."
npx wrangler d1 execute eventflow-db --local --file=database/seed.sql

echo "✅ Base de données configurée"

# ============================================================================
# ÉTAPE 3 : VÉRIFICATION
# ============================================================================
echo "
✓ ÉTAPE 3 : Vérification de la configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   • Tables créées:"
npx wrangler d1 execute eventflow-db --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo "   • Utilisateurs de démo:"
npx wrangler d1 execute eventflow-db --local --command="SELECT username, name, role FROM users ORDER BY role;"

echo "   • Projets disponibles:"
npx wrangler d1 execute eventflow-db --local --command="SELECT couple, date, status FROM projects;"

echo "✅ Configuration vérifiée"

# ============================================================================
# ÉTAPE 4 : LANCER L'APPLICATION
# ============================================================================
echo "
🎬 ÉTAPE 4 : Lancer l'application
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "
👉 OUVREZ UN NOUVEAU TERMINAL ET EXÉCUTEZ :

    npm run dev

📌 Puis ouvrez : http://localhost:4040

🔑 Comptes de test:
   • super_admin    / Super2026
   • admin          / Admin2026
   • sophie (planner) / Planner2026
   • marie (client)   / mariage2026

✅ Application prête à démarrer !
"
