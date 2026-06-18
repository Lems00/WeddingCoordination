# 🔄 Flux visuel - Migration sécurisée D1

## **État initial**

```
┌─────────────────────────────────────┐
│     CLOUDFLARE D1 (EN LIGNE)        │
├─────────────────────────────────────┤
│                                     │
│  Schema (v1) + Vos données          │
│  ├─ users (5 enregistrements)       │
│  ├─ projects (3 enregistrements)    │
│  ├─ tasks (50 enregistrements)      │
│  └─ ... (modifiées le 2026-06-17)   │
│                                     │
└─────────────────────────────────────┘
        ↓ Exporter

┌─────────────────────────────────────┐
│     FICHIERS LOCAUX (VOTRE PC)      │
├─────────────────────────────────────┤
│                                     │
│  data/users.json                    │
│  data/projects.json                 │
│  data/tasks.json                    │
│  ... (BACKUP)                       │
│                                     │
└─────────────────────────────────────┘
```

---

## **Phase 1 : EXPORT (vous êtes ici)**

```
1. Allez sur Cloudflare Dashboard
   └─ Workers & Pages → D1 → eventflow-db → Console

2. Pour chaque table, exécutez :
   ├─ SELECT * FROM users;       → Copiez → data/users.json
   ├─ SELECT * FROM projects;    → Copiez → data/projects.json
   ├─ SELECT * FROM tasks;       → Copiez → data/tasks.json
   ├─ SELECT * FROM vendors;     → Copiez → data/vendors.json
   ├─ SELECT * FROM expenses;    → Copiez → data/expenses.json
   └─ ... pour chaque table

3. Vérifiez : ls -la data/
   └─ Tous les fichiers JSON existent ✓
```

---

## **Phase 2 : CONVERSION**

```
Local PC : node scripts/convert-to-seed.js
           └─ Lit : data/*.json
           └─ Génère : database/seed-with-existing-data.sql
           └─ Contient : 123+ INSERT INTO statements

Vérifiez : cat database/seed-with-existing-data.sql
           └─ Doit commencer par :
              PRAGMA foreign_keys = OFF;
              INSERT INTO users (...) VALUES (...);
              ...
```

---

## **Phase 3 : SCHÉMA NOUVEAU**

```
┌─────────────────────────────────────┐
│   Votre PC (build dist/)            │
│                                     │
│  ✓ Code frontend compilé (469 kB)   │
│  ✓ Nouvelles corrections            │
│  ✓ API routes (functions/api/)      │
└─────────────────────────────────────┘
        ↓ Déployer

┌─────────────────────────────────────┐
│   CLOUDFLARE PAGES                  │
│   ├─ Frontend (dist/index.html)     │
│   └─ API Routes (functions/api/)    │
└─────────────────────────────────────┘
        ↓ Pages Functions
        ├─ Appellent D1
        └─ Utilisent le nouveau schéma

┌─────────────────────────────────────┐
│   CLOUDFLARE D1                     │
│                                     │
│   Appliquer : schema.sql            │
│   └─ ALTER TABLE users ADD COLUMN...│
│   └─ CREATE TABLE new_table...      │
│                                     │
│   Résultat : Tables mises à jour    │
│   (colonnes nouvelles, données OK)  │
└─────────────────────────────────────┘
```

**Commande :**
```bash
npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql
```

---

## **Phase 4 : IMPORT DONNÉES**

```
┌─────────────────────────────────────┐
│   database/seed-with-existing-data.sql
│                                     │
│   PRAGMA foreign_keys = OFF;        │
│   INSERT INTO agencies ...;         │
│   INSERT INTO users ...;            │
│   INSERT INTO projects ...;         │
│   ... (123+ requêtes)               │
│   PRAGMA foreign_keys = ON;         │
└─────────────────────────────────────┘
        ↓ Exécuter

┌─────────────────────────────────────┐
│   CLOUDFLARE D1                     │
│                                     │
│   Avant :                           │
│   ├─ users (0)                      │
│   ├─ projects (0)                   │
│   ├─ tasks (0)                      │
│                                     │
│   Après :                           │
│   ├─ users (5) ← VOS DONNÉES       │
│   ├─ projects (3) ← VOS DONNÉES    │
│   ├─ tasks (50) ← VOS DONNÉES      │
│                                     │
│   ✓ AUCUNE PERTE DE DONNÉES        │
└─────────────────────────────────────┘
```

**Commande :**
```bash
npx wrangler d1 execute eventflow-db --remote --file=database/seed-with-existing-data.sql
```

---

## **Phase 5 : VÉRIFICATION**

```
┌─────────────────────────────────────┐
│   Vérifier l'intégrité              │
│                                     │
│   SELECT COUNT(*) FROM users;       │
│   └─ Result: 5 ✓                    │
│                                     │
│   SELECT COUNT(*) FROM projects;    │
│   └─ Result: 3 ✓                    │
│                                     │
│   SELECT * FROM users LIMIT 1;      │
│   └─ Vérifier les colonnes/données  │
│                                     │
│   curl /api/health                  │
│   └─ {"status": "ok", ...}          │
└─────────────────────────────────────┘
```

---

## **État final**

```
┌─────────────────────────────────────┐
│   CLOUDFLARE PAGES                  │
│   ├─ Frontend dist/ (nouveau)       │
│   └─ API Functions (nouveau)        │
│         ↓
│         │ Appellent avec
│         │ VITE_USE_API=true
│         ↓
│   CLOUDFLARE D1                     │
│   ├─ Schema.sql (nouveau)           │
│   ├─ users (5) VOS DONNÉES          │
│   ├─ projects (3) VOS DONNÉES       │
│   ├─ tasks (50) VOS DONNÉES         │
│   └─ ... PRÉSERVÉES INTACTES ✓      │
│                                     │
└─────────────────────────────────────┘

✅ MIGRATION COMPLÈTE - ZÉRO PERTE
```

---

## **Timeline**

```
T=0 min   : Décision de migrer
T=0-15m   : Phase 1 - EXPORT (Manuel via Dashboard)
T=15-20m  : Phase 2 - CONVERSION (node scripts/convert-to-seed.js)
T=20-30m  : Phase 3 - SCHÉMA (npx wrangler d1 execute ... schema.sql)
T=30-40m  : Phase 4 - IMPORT (npx wrangler d1 execute ... seed-with-existing-data.sql)
T=40-45m  : Phase 5 - VÉRIFICATION (SELECT COUNT(*) FROM ...)
T=45-50m  : Phase 6 - DÉPLOIEMENT (npx wrangler pages deploy dist)

T=50min   : ✅ COMPLÉTÉ - DONNÉES SÉCURISÉES
```

---

## **Sécurité à chaque étape**

| Étape | Action | Risque | Mitigation |
|-------|--------|--------|-----------|
| 1. Export | Lecture seule | ❌ Aucun | ✅ Safe |
| 2. Conversion | Génération fichier local | ❌ Aucun | ✅ Safe |
| 3. Schéma | ALTER TABLE (ajoute colonnes) | ⚠️ Très bas | ✅ IF NOT EXISTS |
| 4. Import | INSERT (ajoute données) | ⚠️ Très bas | ✅ Vérification étape 5 |
| 5. Vérif | COUNT(*) | ❌ Aucun | ✅ Confirm |
| 6. Deploy | Push frontend | ✅ Low | ✅ Rollback possible |

---

## **Plan B - Si quelque chose va mal**

```
❌ Erreur à l'étape 3 (schéma) ?
   └─ Les données existantes restent intactes
   └─ Correctif : Vérifier database/schema.sql

❌ Erreur à l'étape 4 (import) ?
   └─ Vous avez data/*.json en backup
   └─ Correctif : Exécuter à nouveau avec ordre corrigé

❌ Erreur à l'étape 5 (vérif) ?
   └─ Réinitialiser :
      npx wrangler d1 delete eventflow-db
      npx wrangler d1 create eventflow-db
      npx wrangler d1 execute ... schema.sql
      npx wrangler d1 execute ... seed-with-existing-data.sql

✅ À chaque étape : vous pouvez revenir en arrière
```

---

**Vous êtes prêt ! Commencez par l'étape 1 (EXPORT) →**

Consultez : `COMMANDS_SAFE_MIGRATION.md` pour les commandes exactes.
