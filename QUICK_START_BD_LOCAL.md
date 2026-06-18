# 🚀 Guide Rapide — Déploiement Local BD EventFlow Pro

## 🎯 Initialiser la Base de Données en 3 Commandes

### Étape 1 : Nettoyer et recréer le schéma
```bash
cd "e:\LemsWorks\Ny-Andry-Jenny\wedding-management-saas-development"

# Supprimer l'ancienne base (si elle existe)
Remove-Item -Force -Recurse .wrangler\state\v3\d1 -ErrorAction SilentlyContinue

# Créer le schéma
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql
```

**Réponse attendue** :
```
🚣 32 commands executed successfully.
```

### Étape 2 : Insérer les données de démonstration
```bash
npx wrangler d1 execute eventflow-db --local --file=database/seed-compatible.sql
```

**Réponse attendue** :
```
🚣 X commands executed successfully.
```

### Étape 3 : Vérifier les données insérées
```bash
# Vérifier les utilisateurs
npx wrangler d1 execute eventflow-db --local --command="SELECT id, username, role, name FROM users LIMIT 10;"

# Vérifier les projets
npx wrangler d1 execute eventflow-db --local --command="SELECT id, couple, status, budget FROM projects;"

# Vérifier les dépenses
npx wrangler d1 execute eventflow-db --local --command="SELECT id, label, amount, paid FROM expenses;"
```

---

## 📊 Identifiants de Connexion (Test)

Après l'initialisation, vous pouvez vous connecter à l'application avec :

| Rôle | Username | Password | Agence |
|------|----------|----------|--------|
| Super Admin | `superadmin` | `Super2026` | Aucune |
| Admin | `admin` | `Admin2026` | Lems Coordination |
| Planner | `sophie` | `Planner2026` | Lems Coordination |
| Planner | `assistante` | `Planner2026` | Lems Coordination |
| Client | `marie` | `mariage2026` | Aucune |
| Client | `marie2` | `mariage2026` | Aucune |

---

## 🚀 Lancer l'Application

```bash
# Terminal 1 : Démarrer le serveur de dev
npm run dev

# L'app sera accessible sur :
# http://localhost:4040
```

---

## 🔍 Contenu de la BD Locale

**Agence** : Lems Coordination (agency_lems_2026)

**Projet Exemple** : Mariage Ny & Andry
- Budget : 50 000 Ar
- Date : 2026-07-16
- Statut : En cours
- Tâches : 5 tâches test
- Prestataires : 4 (orchestre, traiteur, photo, décoration)
- Dépenses : 4 (acomptes, fournitures)

**Conducteur** : 2 jours (Vodiondry + Jour J)
- Phases et actions pré-configurées

---

## 📁 Fichiers Importants

| Fichier | Contenu |
|---------|---------|
| `database/schema.sql` | Schéma de la BD (tables, FK, indexes) |
| `database/seed-compatible.sql` | Données de test |
| `.wrangler/state/v3/d1/DATABASE.sqlite` | Base SQLite locale (créée après init) |
| `wrangler.toml` | Config Wrangler (binding D1) |

---

## ⚙️ Configuration Locale

La BD locale utilise :
- **Type** : SQLite (identique à Cloudflare D1)
- **Stockage** : `.wrangler/state/v3/d1/DATABASE.sqlite`
- **Binding** : `DB` (accessible via `context.env.DB` dans les API Routes)
- **Contraintes FK** : Activées

---

## 🔧 Dépannage

### Erreur : "foreign key mismatch"
```bash
# Vérifier le schéma
npx wrangler d1 execute eventflow-db --local --command="PRAGMA foreign_key_list(task_dependencies);"

# Supprimer et recommencer
Remove-Item -Force -Recurse .wrangler\state\v3\d1
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql
npx wrangler d1 execute eventflow-db --local --file=database/seed-compatible.sql
```

### Erreur : "database already exists"
```bash
# Le fichier wrangler.toml contient l'ID de la BD
# Vous devez utiliser le même ID pour la BD locale
# (déjà configuré, ne rien faire)
```

### Port 4040 occupé
```bash
# Changer le port dans vite.config.ts ou lancer sur port différent
npm run dev -- --port 4041
```

---

## ✅ Checklist de Validation

- [ ] Schéma créé sans erreur (32 commands executed)
- [ ] Seed inséré sans erreur
- [ ] `SELECT * FROM users;` retourne 7 utilisateurs
- [ ] `SELECT * FROM projects;` retourne 1 projet
- [ ] `SELECT * FROM expenses;` retourne 4 dépenses
- [ ] App démarre sur http://localhost:4040
- [ ] Login avec `admin` / `Admin2026` fonctionne
- [ ] Projet "Ny & Andry" visible et chargeable
- [ ] Budget s'affiche en Ariary (50 000 Ar)
- [ ] Dépenses affichées en Ariary
- [ ] Prêt pour déploiement D1 production ✨

---

## 🌐 Prochaines Étapes

Après validation locale :

```bash
# 1. Créer la BD de production sur Cloudflare
npx wrangler d1 create eventflow-db

# 2. Copier l'ID retourné vers wrangler.toml (database_id)

# 3. Initaliser le schéma en production
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql

# 4. Optionnel : insérer les données de seed
npx wrangler d1 execute eventflow-db --remote --file=database/seed-compatible.sql

# 5. Builder et déployer
npm run build
npx wrangler pages deploy dist
```

---

**État** : ✅ Base locale prête  
**Dernière MAJ** : 2026-06-12  
**Version Wrangler** : 4.99.0+  
**Version Node** : 18+
