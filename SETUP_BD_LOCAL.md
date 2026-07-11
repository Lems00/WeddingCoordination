# 🗄️ Guide Déploiement Local — Base de Données

## ✅ Prérequis

```bash
# Installer Wrangler CLI
npm install -D wrangler

# Ou en global
npm install -g wrangler
```

---

## 📋 Étapes de Configuration

### Étape 1: Créer la base de données locale

```bash
# Dans le dossier racine du projet
npx wrangler d1 create eventflow-db
```

Cette commande crée :
- Un fichier `.wrangler/state/d1/` avec la BD SQLite locale
- Un identifiant `database_id` à noter

**Exemple de sortie:**
```
✓ Created D1 database 'eventflow-db'

To start using your D1 database, you need to:
1. Add the following binding to your wrangler.toml:

[[d1_databases]]
binding = "DB"
database_name = "eventflow-db"
database_id = "a228b653-d77a-4b47-9413-8e7de683fd0a"

2. Execute migrations...
```

### Étape 2: Vérifier le wrangler.toml

Votre `wrangler.toml` devrait contenir :

```toml
[[d1_databases]]
binding = "DB"
database_name = "eventflow-db"
database_id = "a228b653-d77a-4b47-9413-8e7de683fd0a"  # ← VOTRE ID LOCAL
```

**⚠️ IMPORTANT**: 
- Utilisez le `database_id` LOCAL pour le développement
- Ne synchronisez PAS ce fichier en production !
- Gardez l'ID de production en commentaire pour référence

### Étape 3: Initialiser le schéma (tables + données)

```bash
# Appliquer le schéma local
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql
```

**Résultat attendu:**
```
✓ Executed query
All queries completed successfully
```

### Étape 4: Vérifier que les tables sont créées

```bash
# Lister les tables
npx wrangler d1 execute eventflow-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

**Résultat attendu:**
```
┌─────────────────────────────────┐
│ name                            │
├─────────────────────────────────┤
│ agencies                        │
│ users                           │
│ projects                        │
│ project_planners                │
│ project_clients                 │
│ tasks                           │
│ task_dependencies               │
│ vendors                         │
│ expenses                        │
│ conducteur_jours                │
│ conducteur_phases               │
│ conducteur_actions              │
│ conducteur_phase_responsibles   │
│ notifications                   │
│ activity_log                    │
└─────────────────────────────────┘
```

---

## 🌱 Charger les Données de Démonstration (Optionnel)

Créez un fichier `database/seed.sql` :

```sql
-- Agence par défaut
INSERT OR IGNORE INTO agencies (id, name, owner_user_id) 
VALUES ('agency_lems_2026', 'Lems Coordination', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Super admin
INSERT OR IGNORE INTO users (id, agency_id, username, password_hash, name, role, color, theme, is_active)
VALUES (
  'sa_001',
  NULL,
  'superadmin',
  'Super2026',  -- En prod: bcrypt($password)
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
```

Ensuite, charger les données :

```bash
npx wrangler d1 execute eventflow-db --local --file=database/seed.sql
```

---

## 🔍 Requêtes de Vérification Utiles

```bash
# Voir tous les utilisateurs
npx wrangler d1 execute eventflow-db --local --command="SELECT id, username, name, role FROM users;"

# Voir tous les projets
npx wrangler d1 execute eventflow-db --local --command="SELECT id, couple, date, status FROM projects;"

# Compter les enregistrements par table
npx wrangler d1 execute eventflow-db --local --command="
  SELECT 
    'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'tasks', COUNT(*) FROM tasks
  UNION ALL
  SELECT 'vendors', COUNT(*) FROM vendors;
"

# Afficher le schéma d'une table
npx wrangler d1 execute eventflow-db --local --command="PRAGMA table_info(users);"
```

---

## 🚀 Tester la BD en Dev

### Méthode 1: Avec Wrangler Pages Dev

```bash
# Terminal 1: Démarrer Wrangler
npx wrangler pages dev dist --local

# Terminal 2: Vérifier la BD
npx wrangler d1 execute eventflow-db --local --command="SELECT COUNT(*) FROM users;"
```

### Méthode 2: Avec script Node.js (futur)

Créer `test-db.mjs`:
```js
import { D1Database } from "@miniflare/d1";

async function test() {
  const db = new D1Database("eventflow-db", ".wrangler/state/d1/");
  const result = await db.prepare("SELECT * FROM users LIMIT 1").all();
  console.log(result);
}

test();
```

```bash
node test-db.mjs
```

---

## ⚠️ Pièges Courants

### ❌ Erreur: "Binding D1 'DB' introuvable"
**Cause**: `wrangler.toml` mal configuré  
**Solution**:
```bash
# Regénérer
npx wrangler d1 create eventflow-db
# Puis copier le [[d1_databases]] dans wrangler.toml
```

### ❌ Erreur: "Database file locked"
**Cause**: Multiple processus accèdent la BD  
**Solution**:
```bash
# Fermer tous les processus Wrangler
# Puis relancer
```

### ❌ Erreur: "Foreign key constraint failed"
**Cause**: Données sans parent  
**Solution**:
```bash
# Vérifier les relations dans schema.sql
# Insérer d'abord les parents (agencies, users)
```

---

## 📊 Structure Locale Créée

```
.wrangler/
├── state/
│   └── d1/
│       ├── eventflow-db.sqlite3         # ← Fichier principal
│       └── .wal                          # Write-ahead log
└── wrangler.toml                         # Config (copie)
```

**Fichier database**: `.wrangler/state/d1/eventflow-db.sqlite3`

---

## 🔄 Synchronisation avec Production

### Gérer deux BDs (Dev + Prod)

**wrangler.toml** (développement local):
```toml
[[d1_databases]]
binding = "DB"
database_name = "eventflow-db"
database_id = "LOCAL_ID_HERE"  # ← ID LOCAL
```

**wrangler.production.toml** (pour déploiement):
```toml
[[d1_databases]]
binding = "DB"
database_name = "eventflow-db"
database_id = "a228b653-d77a-4b47-9413-8e7de683fd0a"  # ← ID PROD
```

Déployer:
```bash
# Dev
npm run dev

# Production
npx wrangler pages deploy dist --config wrangler.production.toml
```

---

## ✅ Checklist de Configuration

- [ ] `npm install -D wrangler`
- [ ] `npx wrangler d1 create eventflow-db`
- [ ] Copier le `database_id` LOCAL
- [ ] Mettre à jour `wrangler.toml`
- [ ] `npx wrangler d1 execute eventflow-db --local --file=database/schema.sql`
- [ ] Vérifier les tables: `npx wrangler d1 execute eventflow-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"`
- [ ] (Optionnel) Charger les données de démo: `npx wrangler d1 execute eventflow-db --local --file=database/seed.sql`
- [ ] Tester: `npm run dev`

---

**Prochaines étapes**: 
1. Corriger Team.tsx (boutons edit/delete)
2. Implémenter PUT/DELETE endpoints
3. Connecter le frontend à la BD
