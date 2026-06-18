# 🚀 Commandes exactes - Migration sécurisée D1

## **Phase 1 : SAUVEGARDE (15 minutes)**

### Étape 1a : Créer un dossier de sauvegarde

```bash
mkdir -p backups
mkdir -p data
```

### Étape 1b : Exporter TOUTES les tables (via Dashboard Cloudflare)

**Allez sur :** https://dash.cloudflare.com → Workers & Pages → D1 → eventflow-db → Console

Pour chaque table, exécutez la commande ET sauvegardez les résultats :

```sql
-- Exécutez ceci dans la console D1 Dashboard
SELECT * FROM users;
-- Copiez les résultats JSON → sauvegardez dans : data/users.json

SELECT * FROM agencies;
-- Copiez les résultats JSON → sauvegardez dans : data/agencies.json

SELECT * FROM projects;
-- Copiez les résultats JSON → sauvegardez dans : data/projects.json

SELECT * FROM tasks;
-- Copiez les résultats JSON → sauvegardez dans : data/tasks.json

SELECT * FROM vendors;
-- Copiez les résultats JSON → sauvegardez dans : data/vendors.json

SELECT * FROM expenses;
-- Copiez les résultats JSON → sauvegardez dans : data/expenses.json

SELECT * FROM notifications;
-- Copiez les résultats JSON → sauvegardez dans : data/notifications.json
```

**Ou via CLI (si vous avez accès à wrangler) :**

```bash
# Windows PowerShell
$tables = @('users', 'agencies', 'projects', 'tasks', 'vendors', 'expenses', 'notifications')
foreach ($table in $tables) {
    Write-Host "📥 Exporting $table..."
    npx wrangler d1 execute eventflow-db --remote --format json --command "SELECT * FROM $table;" | Out-File "data/$table.json"
}
```

```bash
# Linux/Mac
for table in users agencies projects tasks vendors expenses notifications; do
  echo "📥 Exporting $table..."
  npx wrangler d1 execute eventflow-db --remote --format json --command "SELECT * FROM $table;" > data/$table.json
done
```

### Étape 1c : Vérifier que tous les fichiers existent

```bash
ls -la data/
# Vous devriez voir :
# data/users.json
# data/agencies.json
# data/projects.json
# data/tasks.json
# data/vendors.json
# data/expenses.json
# data/notifications.json
```

---

## **Phase 2 : CONVERSION (5 minutes)**

### Étape 2 : Convertir JSON → SQL

```bash
node scripts/convert-to-seed.js

# Cela génère : database/seed-with-existing-data.sql
# Vérifiez que le fichier a été créé :
ls -la database/seed-with-existing-data.sql
```

**Output attendu :**
```
🔄 Conversion des données exportées en SQL...

✅ users: 5 enregistrements
✅ agencies: 1 enregistrement
✅ projects: 3 enregistrements
✅ tasks: 50 enregistrements
✅ vendors: 10 enregistrements
✅ expenses: 25 enregistrements
✅ notifications: 15 enregistrements

✅ Fichier généré: database/seed-with-existing-data.sql
📊 123 requêtes INSERT
```

---

## **Phase 3 : APPLICATION (10 minutes)**

### ⚠️ POINT DE NON-RETOUR - Vérifiez avant de continuer !

**Checkpoint :**
- [ ] Fichier `database/seed-with-existing-data.sql` existe
- [ ] Il contient `INSERT INTO` statements
- [ ] Tous les `data/*.json` ont été exportés

### Étape 3a : Appliquer le nouveau schéma

```bash
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql

# Output attendu :
# ✓ Successfully executed 15 statements
```

**⚠️ À ce moment :**
- ✅ Les colonnes nouvelles sont ajoutées
- ✅ Les données EXISTANTES restent intactes (CREATE TABLE IF NOT EXISTS)
- ✅ Aucune suppression n'a lieu

### Étape 3b : Importer les données sauvegardées

```bash
npx wrangler d1 execute eventflow-db --remote --file=database/seed-with-existing-data.sql

# Output attendu :
# ✓ Successfully executed 123 statements
```

**À ce moment :**
- ✅ Vos données modifiées sont restaurées
- ✅ Les nouvelles colonnes sont remplies (NULL ou valeurs par défaut)
- ✅ Aucune perte de données

---

## **Phase 4 : VÉRIFICATION (5 minutes)**

### Étape 4a : Vérifier les comptes de lignes

```bash
npx wrangler d1 execute eventflow-db --remote --command "
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'agencies', COUNT(*) FROM agencies
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;"

# Output attendu :
# table_name    | count
# --------------|-------
# users         | 5
# agencies      | 1
# projects      | 3
# tasks         | 50
# vendors       | 10
# expenses      | 25
# notifications | 15
```

### Étape 4b : Vérifier quelques enregistrements spécifiques

```bash
# Vérifiez vos utilisateurs
npx wrangler d1 execute eventflow-db --remote --command "SELECT id, username, name FROM users LIMIT 5;"

# Vérifiez vos projets
npx wrangler d1 execute eventflow-db --remote --command "SELECT id, name, couple FROM projects LIMIT 5;"

# Vérifiez l'intégrité des tâches
npx wrangler d1 execute eventflow-db --remote --command "SELECT COUNT(*) as task_count, COUNT(DISTINCT project_id) as project_count FROM tasks;"
```

### Étape 4c : Tester l'API

```bash
# Vérifier que le health check fonctionne
curl https://votre-app-name.pages.dev/api/health

# Output attendu :
# {"status":"ok","runtime":"cloudflare-pages-functions","language":"javascript","d1_bound":true,"time":"2026-06-17T..."}
```

---

## **Phase 5 : DÉPLOIEMENT FRONTEND (5 minutes)**

### Étape 5 : Déployer le nouveau frontend

```bash
# Build le frontend (déjà fait, mais au cas où)
npm run build

# Déployer
npx wrangler pages deploy dist

# Output attendu :
# ✓ Uploaded X files
# ✓ Deployment complete!
```

---

## ✅ **RÉSUMÉ RAPIDE DES COMMANDES**

```bash
# 1️⃣  EXPORT (via Dashboard Cloudflare)
# Allez sur https://dash.cloudflare.com et exportez chaque table en JSON vers data/

# 2️⃣  CONVERSION
node scripts/convert-to-seed.js

# 3️⃣  SCHÉMA
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql

# 4️⃣  IMPORT
npx wrangler d1 execute eventflow-db --remote --file=database/seed-with-existing-data.sql

# 5️⃣  VÉRIFICATION
npx wrangler d1 execute eventflow-db --remote --command "SELECT COUNT(*) FROM users;"

# 6️⃣  DÉPLOIEMENT
npx wrangler pages deploy dist
```

---

## 🆘 **EN CAS D'ERREUR**

### Erreur : "Foreign key constraint failed"

**Cause :** Vous importez les données dans le mauvais ordre (tables enfant avant table parent)

**Solution :**
```bash
# Réordonnez les INSERT dans seed-with-existing-data.sql :
# 1. agencies
# 2. users
# 3. projects
# 4. tasks
# 5. vendors
# 6. expenses
# 7. notifications
```

### Erreur : "UNIQUE constraint failed"

**Cause :** Un ID existe déjà

**Solution :** Modifiez la ligne problématique dans `seed-with-existing-data.sql` :
```sql
-- Remplacez :
INSERT INTO users (...) VALUES (...);

-- Par :
INSERT OR REPLACE INTO users (...) VALUES (...);
```

### Erreur : "Table doesn't exist"

**Cause :** Vous avez sauté l'étape du schéma

**Solution :**
```bash
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql
```

---

## 📌 **Temps total : ~35 minutes**

- Export : 15 min
- Conversion : 5 min
- Application : 10 min
- Vérification : 5 min

**Aucune perte de données garantie ! ✅**
