# 🛡️ Migration SÉCURISÉE - Préserver les données existantes

**Objectif :** Importer les données modifiées existantes dans D1, puis appliquer le schéma mis à jour sans perte de données.

---

## ⚠️ AVANT DE COMMENCER

**Sauvegarde recommandée :**
```bash
# 1. Exporter les données actuelles comme backup
npx wrangler d1 execute eventflow-db --remote --format json --command "SELECT * FROM users;" > backup-users.json
npx wrangler d1 execute eventflow-db --remote --format json --command "SELECT * FROM projects;" > backup-projects.json
# ... faire la même chose pour chaque table importante
```

---

## 🔄 **Processus de migration sécurisée**

### **Option 1 : Via Cloudflare Dashboard (Interface graphique - SIMPLE)**

#### Étape 1 : Exporter les données actuelles

```
1. Allez sur https://dash.cloudflare.com
2. Workers & Pages → D1 → eventflow-db
3. Pour CHAQUE table (users, projects, tasks, vendors, expenses, notifications) :
   
   a. Cliquez sur "Console"
   b. Exécutez : SELECT * FROM [table_name];
   c. Cliquez sur "Export" ou copiez les résultats JSON
   d. Sauvegardez dans un fichier data/[table_name].json
```

**Exemple de copie :**
```
Résultats de : SELECT * FROM users;

Copiez et sauvegardez dans data/users.json :
[
  {"id": "sa_001", "username": "superadmin", "name": "Super Admin", ...},
  {"id": "a0ee...", "username": "admin", "name": "Coordinator", ...}
]
```

#### Étape 2 : Convertir en SQL

```bash
# Dans le répertoire du projet
node scripts/convert-to-seed.js

# Cela génère : database/seed-with-existing-data.sql
```

#### Étape 3 : Appliquer le schéma NOUVEAU

```bash
# D'abord : appliquer le schéma mis à jour (ajoute les colonnes manquantes)
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql
```

**⚠️ IMPORTANT :** Le schéma contient `CREATE TABLE IF NOT EXISTS`, donc il ne supprimera pas vos données existantes.

#### Étape 4 : Importer les données existantes

```bash
# Insérez les données que vous avez exportées
npx wrangler d1 execute eventflow-db --remote --file=database/seed-with-existing-data.sql
```

#### Étape 5 : Vérifier l'intégrité

```bash
# Vérifiez que les données sont bien là
npx wrangler d1 execute eventflow-db --remote --command "SELECT COUNT(*) as count FROM users;"
npx wrangler d1 execute eventflow-db --remote --command "SELECT COUNT(*) as count FROM projects;"
```

---

### **Option 2 : Via CLI Wrangler (Automatisé - RECOMMANDÉ)**

Créez un script bash/PowerShell pour automatiser l'export :

**Pour Linux/Mac :**
```bash
#!/bin/bash

mkdir -p data

for table in users agencies projects tasks vendors expenses notifications; do
  echo "📥 Exporting $table..."
  npx wrangler d1 execute eventflow-db --remote --format json --command "SELECT * FROM $table;" > data/$table.json
done

echo "✅ Export complété!"
node scripts/convert-to-seed.js
```

**Pour PowerShell (Windows) :**
```powershell
# Créez un fichier export-data.ps1

$tables = @('users', 'agencies', 'projects', 'tasks', 'vendors', 'expenses', 'notifications')
New-Item -ItemType Directory -Force -Path "data" | Out-Null

foreach ($table in $tables) {
    Write-Host "📥 Exporting $table..."
    $query = "SELECT * FROM $table;"
    npx wrangler d1 execute eventflow-db --remote --format json --command $query | Out-File "data/$table.json"
}

Write-Host "✅ Export complété!"
node scripts/convert-to-seed.js
```

**Exécutez :**
```bash
# Linux/Mac
bash scripts/export-data.sh

# PowerShell
.\scripts\export-data.ps1
```

---

## 📊 **Ce que chaque étape fait**

| Étape | Action | Risque | Remède |
|-------|--------|--------|--------|
| 1. Export | Copie les données actuelles en JSON | aucun (lecture seule) | ✅ Safe |
| 2. Conversion | Transforme JSON en SQL INSERT | aucun (fichier local) | ✅ Safe |
| 3. Schéma | Ajoute colonnes manquantes | ⚠️ **AUCUN** (IF NOT EXISTS) | ✅ Safe |
| 4. Import | Ajoute/met à jour les données | ⚠️ Doublons possible | **Voir étape 6** |
| 5. Vérification | Vérifie l'intégrité | aucun (lecture seule) | ✅ Safe |

---

## ⚙️ **Gestion des doublons (étape 6)**

Si vous avez des **ID identiques**, vous risquez une violation de clé primaire.

**Solution :**
```sql
-- Dans seed-with-existing-data.sql, remplacez INSERT par :

INSERT OR IGNORE INTO users (id, agency_id, username, ...) 
VALUES ('sa_001', NULL, 'superadmin', ...);

-- OU si vous voulez remplacer :

INSERT OR REPLACE INTO users (id, agency_id, username, ...) 
VALUES ('sa_001', NULL, 'superadmin', ...);
```

---

## 🔍 **Vérification post-migration**

```bash
# Vérifier le nombre de lignes
npx wrangler d1 execute eventflow-db --remote --command "
  SELECT 
    'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'tasks', COUNT(*) FROM tasks
  UNION ALL
  SELECT 'vendors', COUNT(*) FROM vendors
  UNION ALL
  SELECT 'expenses', COUNT(*) FROM expenses
  UNION ALL
  SELECT 'notifications', COUNT(*) FROM notifications;
"

# Vérifier un utilisateur spécifique
npx wrangler d1 execute eventflow-db --remote --command "SELECT id, username, name FROM users LIMIT 5;"
```

---

## 🚨 **En cas de problème**

### **Si vous avez mélangé les données :**

```bash
# ⚠️ DESTRUCTIF : Réinitialise complètement la base

# 1. Supprimez la base
npx wrangler d1 delete eventflow-db

# 2. Recréez-la
npx wrangler d1 create eventflow-db

# 3. Rétablissez le schéma
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql

# 4. Réimportez les données
npx wrangler d1 execute eventflow-db --remote --file=database/seed-with-existing-data.sql
```

---

## ✅ **Checklist migration**

```
□ Sauvegarder les données actuelles (backup-*.json)
□ Exporter les données de chaque table (data/*.json)
□ Exécuter scripts/convert-to-seed.js
□ Appliquer le schéma : npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql
□ Importer les données : npx wrangler d1 execute eventflow-db --remote --file=database/seed-with-existing-data.sql
□ Vérifier l'intégrité (COUNT *)
□ Tester l'API : curl https://votre-app.pages.dev/api/health
□ Vérifier que les données sont accessibles dans le frontend
```

---

## 📌 **Résumé rapide (TL;DR)**

```bash
# 1. Exporter les données actuelles
for table in users projects tasks vendors expenses notifications; do
  npx wrangler d1 execute eventflow-db --remote --format json --command "SELECT * FROM $table;" > data/$table.json
done

# 2. Convertir en SQL
node scripts/convert-to-seed.js

# 3. Appliquer le nouveau schéma
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql

# 4. Importer les données
npx wrangler d1 execute eventflow-db --remote --file=database/seed-with-existing-data.sql

# ✅ Terminé ! Zéro perte de données.
```

---

**Questions ?** Contactez votre administrateur de base de données ou consultez la documentation Cloudflare D1.
