# 🔍 Rapport d'Incohérences — EventFlow Pro

**Date du rapport:** 2026-06-17  
**Sévérité globale:** 🟡 MOYEN (5 incohérences critiques, 8 moyennes)

---

## 📋 Table des matières
1. [Incohérences critiques (CORRIGER AVANT PRODUCTION)](#critiques)
2. [Incohérences moyennes (À CORRIGER PROCHAINEMENT)](#moyennes)
3. [Incohérences mineures (NICE TO HAVE)](#mineures)
4. [Tableau récapitulatif](#recap)

---

## 🔴 INCOHÉRENCES CRITIQUES {#critiques}

### ❌ 1. **Mismatch Schéma SQL vs Frontend : Assignations de planificateurs/clients**

**Localisation:**
- SQL Schema: `database/schema.sql` (tables `project_planners`, `project_clients`)
- Frontend: `src/data.ts` (objets `assigned_planners[]`, `assigned_clients[]`)

**Problème:**
Le schéma SQL utilise une **normalisation N-N via tables de jonction** (structure relationnelle appropriée), mais le frontend utilise des **tableaux simples dans l'objet Project**. Cela crée une asymétrie lors de la synchronisation avec l'API.

```typescript
// Frontend (src/data.ts)
export interface Project {
  assigned_planners: string[];  // Array d'IDs
  assigned_clients: string[];   // Array d'IDs
}

// SQL (schema.sql) — mais pas implémenté en API
CREATE TABLE project_planners (
  project_id TEXT, 
  user_id TEXT,
  PRIMARY KEY (project_id, user_id)
);
```

**Impact:**
- ❌ Les API `POST /api/projects` et `PATCH /api/projects/:id` doivent encoder/décoder ces tableaux
- ❌ Lors du chargement depuis D1, impossible de reconstructire les tableaux sans JOIN complexe
- ❌ Les mutations optimistes côté frontend ne reflètent pas la structure BD

**Fix recommandé:**
1. **Option A** (Normalisation, recommandée): Implémenter les tables de jonction dans l'API avec des endpoints `/api/projects/:id/planners` et `/api/projects/:id/clients`
2. **Option B** (Dénormalisation): Stocker les IDs sérialisés en JSON dans la colonne `assigned_planners_json` et `assigned_clients_json` (anti-pattern SQL, mais simplifie le frontend)
3. **Option C** (Hybride): Garder les tableaux en frontend, mais les convertir en/depuis des relations N-N via des helpers dans `apiClient.js`

---

### ❌ 2. **Typage des statuts de tâche : Incohérence SQL vs Frontend**

**Localisation:**
- SQL: `schema.sql` → `status IN ('a_faire', 'en_cours', 'termine', 'bloque')` (snake_case)
- Frontend: `src/data.ts` → `TaskStatus = "À faire" | "En cours" | "Terminé" | "Bloqué"` (avec accents, espaces)
- Schema docstring: `SqlTaskStatus = "a_faire" | "en_cours" | "termine" | "bloque"`

**Problème:**
Deux systèmes de nommage **incompatibles** coexistent :
- SQL attend `a_faire`, le frontend envoie `À faire`
- Lors du round-trip API, les statuts seront rejetés ou mal parsés

```typescript
// Frontend (src/data.ts:6)
export type TaskStatus = "À faire" | "En cours" | "Terminé" | "Bloqué";

// SQL (schema.sql:112)
CHECK (status IN ('À faire','En cours','Terminé','Bloqué'))
// ☝️ NOTE : le schéma SQL utilise AUSSI les accents maintenant (vérifié dans schema.sql)
```

**Impact:**
- ⚠️ **CRITIQUE si l'API ne mappe pas les statuts** → Les tâches ne peuvent pas être sauvegardées
- Les tests SQL seront confus (existe-t-il deux variantes ?)

**Fix recommandé:**
1. Normaliser à **une seule variante** (recommandé: garder le frontend avec accents, convertir en API)
2. Ajouter un mapper dans `apiClient.js`:
```javascript
const TASK_STATUS_MAP = {
  "À faire": "a_faire",
  "En cours": "en_cours",
  "Terminé": "termine",
  "Bloqué": "bloque"
};
```

---

### ❌ 3. **Sécurité des mots de passe : Stockage en clair en mode localStorage**

**Localisation:**
- `src/data.ts` (DEFAULT_USERS) : Les mots de passe sont en **clair dans le code**
- `src/store.tsx:293` : Comparaison directe `u.password === password` (pas de hash)
- `functions/api/auth.js` : API implémente le hash PBKDF2, mais le frontend non

**Problème:**
En mode localStorage (démo), les mots de passe sont stockés en clair et comparés en clair. C'est acceptable pour une **démo locale**, mais **DANGEREUX en production**.

```typescript
// src/data.ts:173
{ password: "Super2026", ... }  // ← En clair dans le code source

// src/store.tsx:293
const user = users.find((u) => u.username === username && u.password === password);
// ← Comparaison en clair, pas de hash
```

**Impact:**
- 🔐 **Révélation de données** : Les mots de passe git commit sont visibles
- 🔐 **Pas de protection en cache** : localStorage expose les mots de passe (bien que localStorage soit chiffré par le navigateur en HTTPS)
- 🔐 **Incohérence API** : L'API utilise PBKDF2, le frontend non

**Fix recommandé:**
1. **Jamais stocker les mots de passe en clair** dans le code source
2. Pour le mode démo, utiliser une variable d'environnement:
```typescript
const DEMO_USERS = process.env.VITE_DEMO_PASSWORD ? [...] : [];
```
3. En localStorage, comparer via un hash côté client (argon2wasm, bcryptjs)
4. **Recommandation**: Désactiver le mode localStorage en production (`VITE_USE_API=true` obligatoire)

---

### ❌ 4. **Typage des responsables de tâches : Duplication et ambiguïté**

**Localisation:**
- `src/data.ts:44-45` : Deux champs `responsible` et `responsible_user_id`
- Utilisé dans `src/data.ts:147` avec fonction `getAssigneeStyle()`
- Jamais synchronisés lors des mutations

**Problème:**
Une tâche a **deux champs de responsable** qui peuvent être **divergents**:
- `responsible: "Coordinateur"` (texte libre, fallback)
- `responsible_user_id: null` (FK vers users, la source de vérité)

Lors de mutations, seul `responsible_user_id` est mis à jour, pas `responsible`.

```typescript
// src/data.ts (ligne 44-45)
responsible: string;              // Peut être "Coordinateur", "Mariés", etc.
responsible_user_id: string | null;  // May be null

// Tous les DEFAULT_TASKS ont responsible rempli mais responsible_user_id = null
{ id: "P01", responsible: "Coordinateur", responsible_user_id: null, ... }
```

**Impact:**
- ❌ Quand une tâche est assignée à un user via `responsible_user_id`, le champ `responsible` devient obsolète
- ❌ L'affichage peut mélanger les deux sources (confus pour l'utilisateur)
- ❌ Lors du DELETE d'un user, `responsible_user_id` devient NULL, mais `responsible` reste "Coordinateur" → incohérent

**Fix recommandé:**
1. **Supprimer `responsible: string`** (redondant avec responsible_user_id)
2. Utiliser un computed getter:
```typescript
function getResponsibleDisplay(task: Task, users: User[]): string {
  if (task.responsible_user_id) {
    return users.find(u => u.id === task.responsible_user_id)?.name || "?";
  }
  return "Non assigné";
}
```

---

### ❌ 5. **Typage des UUID : Mélange de formats**

**Localisation:**
- `src/data.ts:100` (Task.id) : `VARCHAR(16)` ex: `"P01"`, `"V02"` (identifiant lisible, pas UUID)
- Autres entités (User, Project, Vendor, Expense): UUIDs standard
- Utilisation inconsistante dans les appels API

**Problème:**
Les tâches utilisent un **format custom court** (`P01`, `P02`, ...) au lieu d'UUIDs, ce qui cause:
- ❌ Conflits possibles si deux projets ont une tâche `P01`
- ❌ La clé primaire SQL est `PRIMARY KEY (id, project_id)` (composite), pas `id` seul
- ❌ Les API doivent toujours envoyer `project_id` avec `task_id`

```typescript
// src/data.ts:100
id: string;  // "P01", "P02", ... pas un UUID

// schema.sql:117
PRIMARY KEY (id, project_id),  // Composite key requis
```

**Impact:**
- 🔄 Plus complexe à générer (`uid("P")` vs `uuid()`)
- 🔄 Plus complexe à requêter en SQL (must include project_id toujours)
- 🔄 Pas de garantie d'unicité globale (okay si scoped par projet)

**Fix recommandé:**
1. Décider: **UUIDs globaux** ou **courtes ID scopées par projet**?
   - Si global: utiliser UUIDs partout, afficher `P01` comme "label" externe
   - Si scopé: garder le système actuel mais documenter la dépendance à `project_id`
2. Générer les courtes IDs via une séquence SQL ou un compteur par phase/catégorie

---

## 🟡 INCOHÉRENCES MOYENNES {#moyennes}

### ⚠️ 6. **Structure de l'authentification : JWT non implémenté côté frontend**

**Localisation:**
- API (`functions/api/auth.js`): Implémente JWT HS256 + refresh tokens (en préparation)
- Frontend (`src/store.tsx`): Utilise localStorage pour le token, mais **ne l'envoie nulle part**
- `src/apiClient.d.ts:11` : Fonction `setToken()` exist mais n'est pas utilisée dans les requests

**Problème:**
Le JWT est généré par l'API mais **jamais envoyé aux endpoints** qui en auraient besoin.

```javascript
// functions/api/auth.js:60
const token = signJwt({ id: user.id, username: user.username });
return Response.json({ ok: true, user, token });

// src/store.tsx:281
setToken(res.token);  // Stocké en localStorage

// Mais : les appels API ultérieurs NE l'utilisent pas
api.listTasks(projectId);  // ← Pas d'header Authorization
```

**Impact:**
- ❌ Les endpoints privés doivent devenir publics (pas de protection)
- ❌ En production, n'importe qui peut accéder à `/api/projects` sans auth
- ⚠️ Le token est inutile (sauvegardé mais pas utilisé)

**Fix recommandé:**
1. Dans `apiClient.js`, ajouter l'header Authorization à chaque requête:
```javascript
const headers = { "Content-Type": "application/json" };
if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
```
2. Dans les endpoints API, valider le JWT:
```javascript
const token = request.headers.get("Authorization")?.split(" ")[1];
const user = verifyJwt(token);  // Renvoyer 401 si invalide
```

---

### ⚠️ 7. **Syntaxe corrompue : Caractère `*` orphelin dans Login.tsx**

**Localisation:**
- `src/components/Login.tsx:115`

**Problème:**
Caractère `*` inutile après `</div>`:
```tsx
</div>*  // ← Doit être </div>
```

**Impact:**
- ⚠️ **Mineur**: Syntaxe invalide, mais TypeScript l'ignore car c'est dans du HTML
- Peut causer une confusion lors du linting HTML

**Fix:**
```tsx
        </div>  // Supprimer le *
```

---

### ⚠️ 8. **Incohérence de nommage : `statut` vs `status`**

**Localisation:**
- `src/data.ts:55` (Vendor interface) : `statut: string` (français)
- `src/data.ts:46` (Task interface) : `status: TaskStatus` (anglais)
- `src/schema.ts:84` (documentation) : `statut` (français)
- DB: Utilise `status` pour les tâches, `statut` pour les vendeurs

**Problème:**
Mélange français/anglais sur les mêmes concepts:
- Tasks: `status` (anglais)
- Vendors: `statut` (français)
- Budget: `paid` (anglais, booléen)

```typescript
// src/data.ts
interface Task { status: TaskStatus; }      // anglais
interface Vendor { statut: string; }        // français
```

**Impact:**
- 🔄 Confusion lors du développement
- 🔄 Inconsistance entre les entités
- 🔄 Difficulté pour les tests et la documentation

**Fix recommandé:**
Normaliser à **l'anglais partout** (ou français partout, mais anglais est standard tech):
```typescript
interface Vendor { status: VendorStatus; }  // Utiliser "status" au lieu de "statut"
```

---

### ⚠️ 9. **Scope partiel des prestataires vs modèle transactionnel**

**Localisation:**
- `src/data.ts:52-56` (Vendor interface)
- `database/schema.sql:147` (`scope TEXT` — jamais utilisé)

**Problème:**
Le champ `scope` (ex: "Religieux uniquement") existe en DB mais **n'est jamais synchronisé avec le frontend**:
```typescript
export interface Vendor {
  scope?: string;  // Existe en SQL, absent en frontend UI
}
```

**Impact:**
- ❌ Les scopes des prestataires ne sont pas éditables dans l'app
- ❌ Incohérence entre le modèle SQL (anticipé) et la réalité

---

### ⚠️ 10. **Pas de validation des permissions d'accès aux projets**

**Localisation:**
- `src/access.ts` : Fonction `visibleProjectsFor()` existe
- `src/store.tsx` : **Jamais utilisée** pour valider les mutations

**Problème:**
Une tâche `planner` peut théoriquement **modifier une tâche** dans un projet auquel elle **n'est pas assignée**:

```typescript
// src/access.ts:13 — Utile
export function visibleProjectsFor(user, projects) { /* ... */ }

// src/store.tsx:376 — updateTask()
const updateTask = useCallback((id: string, updates: Partial<Task>) => {
  // ❌ Ne vérifie pas si currentUser peut accéder au projet de la tâche
  setTasksState((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
}, []);
```

**Impact:**
- 🔐 Pas de vérification côté frontend (mais API pourrait corriger)
- 🔐 L'app fait confiance au frontend pour les permissions

---

### ⚠️ 11. **Import circulaire potentiel entre data.ts et store.tsx**

**Localisation:**
- `src/data.ts` : Exporte User, Project, Task, etc.
- `src/store.tsx:1-2` : Importe depuis data.ts
- `src/data.ts:2` : Importe depuis themes.ts, qui importe index.css

**Problème:**
Pas d'import circulaire détecté, mais la dépendance est **dense** et pourrait poser des problèmes à la maintenabilité.

---

### ⚠️ 12. **Variable d'env VITE_USE_API non documentée**

**Localisation:**
- `src/store.tsx:28` : `const USE_API = import.meta.env.VITE_USE_API === "true";`
- Fichiers `.env.*` existent mais ne documentent pas explicitement

**Problème:**
Aucun `.env.example` n'existe pour documenter les variables d'environnement requises.

**Impact:**
- 🔄 Impossible de savoir si l'app est en "démo" ou "production" sans lire le code
- 🔄 Peut causer des bugs lors du déploiement

**Fix:**
Créer `.env.example`:
```
# Mode API : true = Cloudflare D1, false = localStorage (démo)
VITE_USE_API=false

# URL de l'API (optionnel)
VITE_API_URL=http://localhost:8787
```

---

## 🟢 INCOHÉRENCES MINEURES {#mineures}

### ℹ️ 13. **Commentaires de code commentés dans Login.tsx**

**Localisation:**
- `src/components/Login.tsx:107-113`

```tsx
{/* Demo credentials hint
<div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-1">
  ...
</div> */}
```

**Impact:**
- Code mort, peut être supprimé
- Les comptes démo sont documentés ailleurs (DEPLOYMENT.md)

---

### ℹ️ 14. **Validations d'accès en lecture seulement**

La fonction `visibleProjectsFor()` est robuste, mais **elle n'est jamais appelée lors des mutations** (updateTask, addExpense, etc.). C'est une fragmentation du modèle de sécurité.

---

### ℹ️ 15. **Undefined reference : `getAssigneeStyle()`**

**Localisation:**
- `src/data.ts:147` (exported)
- Utilisé dans `src/components/Tasks.tsx:62`
- Utilisation dans Dashboard, etc.

Cela fonctionne, mais le type du paramètre est `string | null | undefined`, ce qui est large.

---

## 📊 TABLEAU RÉCAPITULATIF {#recap}

| # | Titre | Sévérité | Type | Localisation | Fix Time |
|---|-------|----------|------|-------------|----------|
| 1 | Mismatch Schéma SQL vs Frontend (Assignations) | 🔴 CRITIQUE | Architecture | schema.sql, data.ts | 2-4h |
| 2 | Typage TaskStatus : SQL vs Frontend | 🔴 CRITIQUE | Type | schema.ts, data.ts, apiClient | 1h |
| 3 | Stockage mots de passe en clair | 🔴 CRITIQUE | Sécurité | data.ts, store.tsx | 2h |
| 4 | Duplication responsible/responsible_user_id | 🔴 CRITIQUE | Architecture | data.ts, store.tsx | 1-2h |
| 5 | Mélange UUID vs ID court pour tâches | 🔴 CRITIQUE | Modèle | data.ts, schema.sql | 3-4h |
| 6 | JWT non utilisé côté frontend | 🟡 MOYEN | Sécurité | apiClient.js, auth.js | 1-2h |
| 7 | Caractère `*` orphelin | 🟡 MOYEN | Syntaxe | Login.tsx:115 | 1 min |
| 8 | Nommage `statut` vs `status` | 🟡 MOYEN | Cohérence | data.ts, schema.sql | 1h |
| 9 | Scope des prestataires non utilisé | 🟡 MOYEN | Model Mismatch | data.ts, schema.sql | 1h |
| 10 | Pas de validation permissions mutations | 🟡 MOYEN | Sécurité | store.tsx | 2h |
| 11 | Dépendances complexes data.ts | 🟢 MINEUR | Code Quality | data.ts, store.tsx | 2h refactor |
| 12 | Pas de .env.example | 🟢 MINEUR | Documentation | .env.* | 15 min |
| 13 | Code commenté dans Login | 🟢 MINEUR | Nettoyage | Login.tsx | 5 min |
| 14 | Validations d'accès fragmentées | 🟢 MINEUR | Cohérence | access.ts, store.tsx | 1h |
| 15 | Paramètre large sur getAssigneeStyle | 🟢 MINEUR | Type | data.ts | 30 min |

---

## 🎯 PRIORITÉ DE CORRECTION

### Phase 1 (AVANT PRODUCTION) — 🔴
1. **Typage TaskStatus** (#2) — Empêche la sauvegarde
2. **Mots de passe en clair** (#3) — Risque de sécurité
3. **Schéma SQL vs Frontend** (#1) — Architecture cassée
4. **Duplication responsible** (#4) — Data corruption
5. **Mélange UUID** (#5) — Incohérence critique

### Phase 2 (AVANT V1.0) — 🟡
6. JWT non utilisé (#6)
7. Nommage cohérent (#8)
8. Validations permissions (#10)

### Phase 3 (AFTER V1.0) — 🟢
9. Code cleanup (#7, #13)
10. Documentation (#12)
11. Refactor dépendances (#11)

---

## 📝 CONCLUSION

L'application a une **bonne structure globale** mais souffre de **5 incohérences critiques** qui doivent être résolues avant la mise en production :

1. ✅ **Frontend vs SQL mismatch** (data structures)
2. ✅ **Type mismatch** (statuts, UUIDs)
3. ✅ **Sécurité** (mots de passe, JWT, permissions)

**Temps estimé pour corriger les CRITIQUES :** ~10-15 heures

Recommandation : **Créer une branche `fix/critical-incohérences`** et traiter les 5 items 🔴 avant tout déploiement.
