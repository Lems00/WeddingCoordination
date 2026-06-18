# 🚀 Déploiement Local de la Base de Données — EventFlow Pro

## 📋 Prérequis

- **Node.js** (v18+) — Installer depuis https://nodejs.org
- **Wrangler CLI** — Installé via `npm install wrangler --save-dev`
- **WAMP** — Disponible sur la machine (Apache, MySQL, PHP)
- **Git** — Pour versionner les modifications

---

## 🎯 Approche Recommandée : SQLite Local avec Wrangler (identique à D1)

Cette approche utilise **SQLite en local**, qui est exactement le même système que Cloudflare D1 en production.
C'est la meilleure préparation pour le déploiement en ligne.

### Étape 1 : Initialiser la Base Locale

```bash
# 1. Vérifier que Wrangler est installé
npx wrangler --version

# 2. Initialiser la base de données locale D1
npx wrangler d1 create eventflow-db --local

# Réponse attendue :
# ✓ Successfully created the database 'eventflow-db' in your local project
# Local database stored at: .wrangler/state/d1/DATABASE.sqlite
```

### Étape 2 : Exécuter le Schéma

```bash
# Initialiser les tables (schéma)
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql

# Réponse : ✓ Executed 1 command(s) successfully
```

### Étape 3 : Insérer les Données de Seed (Demo)

```bash
# Remplir avec les données de test
npx wrangler d1 execute eventflow-db --local --file=database/seed.sql

# Réponse : ✓ Executed X command(s) successfully
```

### Étape 4 : Vérifier les Données

```bash
# Voir les tables créées
npx wrangler d1 execute eventflow-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Voir les utilisateurs insérés
npx wrangler d1 execute eventflow-db --local --command="SELECT id, username, role FROM users LIMIT 5;"

# Voir les projets insérés
npx wrangler d1 execute eventflow-db --local --command="SELECT id, couple, status FROM projects LIMIT 5;"
```

### Étape 5 : Lancer le Serveur de Dev avec Wrangler

```bash
# Démarrer le serveur local (qui accède à la BD locale)
npm run dev

# Ou directement avec Wrangler
npx wrangler pages dev dist

# La BD sera accessible via context.env.DB dans les API Routes
# (voir functions/api/*.js)
```

---

## 📁 Où est stockée la Base Locale ?

Après initialisation, la BD SQLite se trouve à :

```
.wrangler/state/d1/DATABASE.sqlite
```

**⚠️ Ne pas commiter ce dossier en Git** (ajouté à `.gitignore`)

---

## 🔄 Workflows Courants

### Réinitialiser la Base

```bash
# Supprimer complètement la BD locale
rm -rf .wrangler/state/d1/

# Recréer depuis zéro
npx wrangler d1 create eventflow-db --local
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql
npx wrangler d1 execute eventflow-db --local --file=database/seed.sql
```

### Ajouter de nouvelles données

```bash
# Créer un fichier migration-YYYYMMDD.sql
echo "INSERT INTO projects (id, agency_id, name, couple, date, venue, status, color, budget, notes) VALUES (...)" > database/migration-20260612.sql

# Exécuter la migration
npx wrangler d1 execute eventflow-db --local --file=database/migration-20260612.sql
```

### Tester une requête rapidement

```bash
npx wrangler d1 execute eventflow-db --local --command="SELECT * FROM users WHERE role='admin';"
```

---

## 🔌 Alternative : MySQL avec WAMP

Si vous préférez utiliser **MySQL de WAMP** au lieu de SQLite :

### Configuration MySQL

1. **Démarrer WAMP** (via le tray icon)
2. **Créer la base MySQL** :
   ```bash
   mysql -u root -p
   > CREATE DATABASE eventflow_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   > USE eventflow_dev;
   ```

3. **Adapter le schéma pour MySQL** (convertir les types SQLite → MySQL) :
   - `TEXT PRIMARY KEY` → `VARCHAR(36) PRIMARY KEY`
   - `REAL` → `DECIMAL(10,2)`
   - `datetime('now')` → `NOW()`
   - `CHECK(...)` → Ajouter des contraintes en application

4. **Importer le schéma** :
   ```bash
   mysql -u root -p eventflow_dev < database/schema-mysql.sql
   ```

### Inconvénients MySQL WAMP vs SQLite Wrangler

| Critère | SQLite (Recommandé) | MySQL WAMP |
|---------|-------------------|-----------|
| Parity avec D1 | ✅ 100% identique | ❌ Différences types |
| Configuration | ✅ Zéro config | ⚠️ Nécessite MySQL local |
| Déploiement | ✅ Seamless vers D1 | ❌ Migration des données |
| Performance dev | ✅ Ultra rapide | ⚠️ Serveur separé |
| Collaboration | ✅ Fichier .sqlite en Git | ❌ Config manuelle par dev |

**→ Nous recommandons SQLite avec Wrangler**

---

## 🧪 Tester l'Application avec la BD Local

```bash
# 1. Ouvrir http://localhost:4040 (ou le port configuré)
npm run dev

# 2. Utiliser les identifiants de seed.sql (vérifiez le fichier)
# Par exemple :
#   - Username: admin
#   - Password: (check seed.sql)

# 3. Vérifier que les projets/utilisateurs/dépenses se chargent
# 4. Créer une nouvelle dépense et vérifier qu'elle persiste
```

---

## 📊 Schéma de la BD

Tables principales :
- **agencies** — Agences (ex: "Lems Coordination")
- **users** — Utilisateurs (super_admin, admin, planner, client)
- **projects** — Projets de mariage
- **project_planners** — Assignation planificateurs → projets (N-N)
- **project_clients** — Assignation clients → projets (N-N)
- **tasks** — Tâches du projet
- **vendors** — Prestataires (fleuriste, photographe, etc.)
- **expenses** — Dépenses budgétaires
- **notifications** — Notifications temps réel
- **activity_log** — Journal d'activités (audit trail)

---

## 🚀 Préparation Déploiement D1 Production

Une fois la BD locale validée :

```bash
# 1. Créer la BD de production sur Cloudflare
npx wrangler d1 create eventflow-db

# 2. Noter le database_id retourné
# 3. Mettre à jour wrangler.toml avec l'ID de production
# 4. Exécuter le schéma sur la BD production
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql

# 5. Insérer les données (optionnel, selon stratégie)
npx wrangler d1 execute eventflow-db --remote --file=database/seed.sql

# 6. Déployer l'application
npm run build
npx wrangler pages deploy dist
```

---

## 📞 Dépannage

### "Database not found" en local

```bash
# Vérifier que .wrangler/state/d1/DATABASE.sqlite existe
ls -la .wrangler/state/d1/

# Recréer si absent
npx wrangler d1 create eventflow-db --local
```

### Erreurs de schéma SQLite

```bash
# Vérifier la syntaxe du schéma
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql --preview false

# Si erreur, voir le détail complet
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql --verbose
```

### Port occupé (4040, 8787)

```bash
# Vérifier quel processus utilise le port
netstat -ano | findstr :4040

# Fermer le processus (Windows)
taskkill /PID <PID> /F

# Ou utiliser un port différent
npm run dev -- --port 4041
```

---

## ✅ Checklist de Validation

- [ ] Base SQLite créée localement
- [ ] Schéma importé (tables visibles)
- [ ] Données seed insérées (utilisateurs/projets visibles)
- [ ] Serveur dev lance sans erreur DB
- [ ] Application charge les données depuis la BD
- [ ] CRUD fonctionne (créer/modifier/supprimer une dépense)
- [ ] Notifications s'insèrent
- [ ] localStorage sync avec BD
- [ ] Prêt pour déploiement D1 production ✨

---

**Dernière mise à jour** : 2026-06-12  
**Schéma** : `database/schema.sql`  
**Données de test** : `database/seed.sql`
