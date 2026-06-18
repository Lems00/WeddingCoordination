# 📊 Analyse Complète — EventFlow Pro

**Date**: 12 Juin 2026  
**Version**: SaaS 1.0  
**Status**: En développement

---

## 1️⃣ Vue d'ensemble de l'application

**EventFlow Pro** est une **SaaS de gestion de mariage** permettant aux coordinateurs, planificateurs et couples de gérer intégralement un événement matrimonial.

### Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                    │
│  ├─ React 19.2.6 (dernière version)                       │
│  ├─ Vite 7.3.2 (build rapide)                              │
│  ├─ TypeScript 5.9.3                                       │
│  ├─ Tailwind CSS 4.1.17 (design system)                    │
│  └─ Lucide React (icônes)                                  │
└─────────────────────────────────────────────────────────┘
                            ↓ API HTTP (fetch)
┌─────────────────────────────────────────────────────────┐
│          BACKEND (Cloudflare Pages Functions)            │
│  ├─ NodeJS-compatible Runtime                            │
│  ├─ 10 endpoints API (users, projects, tasks, etc.)      │
│  └─ Authentification (à implémenter)                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│        DATABASE (Cloudflare D1 — SQLite)                │
│  ├─ 14 tables principales                                │
│  ├─ Relations many-to-many                               │
│  └─ Audit trail & notifications                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│     STORAGE (localStorage du navigateur)                 │
│  └─ Cache local: users, projects, tasks, etc.           │
└─────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Stack Technologique Détaillée

### Frontend (src/)
- **React 19.2.6**: Framework UI principal
- **TypeScript**: Typage statique (tsconfig.json)
- **Vite 7.3.2**: Bundler ultra-rapide
- **Tailwind CSS 4.1.17**: Utility-first CSS
- **Lucide React**: 300+ icônes SVG
- **Context API**: State management (store.tsx)
- **localStorage**: Persistence client

### Backend (functions/api/)
- **Cloudflare Pages Functions**: Serverless Edge
- **JavaScript natif** (compatibilité Node.js)
- **10 endpoints API**:
  - `users.js` → CRUD utilisateurs
  - `projects.js` → CRUD projets
  - `tasks.js` → CRUD tâches
  - `vendors.js` → Prestataires
  - `budget.js` → Dépenses
  - `ceremonies.js` → Conducteur jour J
  - `conducteurs.js` → Conducteur détail
  - `notifications.js` → Notifications
  - `auth.js` → Authentification
  - `health.js` → Health check

### Database (database/)
- **Cloudflare D1**: SQLite serverless
- **14 tables**:
  1. `agencies` — Agences coordinatrices
  2. `users` — Utilisateurs (admin/planner/client)
  3. `projects` — Projets de mariage
  4. `project_planners` — N-N: planificateurs/projets
  5. `project_clients` — N-N: clients/projets
  6. `tasks` — Tâches de projet
  7. `task_dependencies` — Dépendances entre tâches
  8. `vendors` — Prestataires (traiteur, orchestre, etc.)
  9. `expenses` — Dépenses budgétaires
  10. `conducteur_jours` — Jours du conducteur
  11. `conducteur_phases` — Phases par jour
  12. `conducteur_actions` — Actions par phase
  13. `conducteur_phase_responsibles` — Responsables par phase
  14. `notifications` — Fil de notifications
  15. `activity_log` — Audit trail

---

## 3️⃣ Structure du Projet

```
.
├── package.json                          # Dépendances npm
├── tsconfig.json                         # Config TypeScript
├── vite.config.ts                        # Config Vite (port 4040)
├── wrangler.toml                         # Config Cloudflare Pages + D1
├── index.html                            # HTML statique
│
├── src/                                  # Code source React
│   ├── App.tsx                           # App shell principal
│   ├── main.tsx                          # Entry point
│   ├── store.tsx                         # Context API + state management
│   ├── data.ts                           # Types + données démo
│   ├── schema.ts                         # Types SQL
│   ├── themes.ts                         # Thèmes (light/night/etc.)
│   ├── apiClient.js                      # Client HTTP
│   ├── index.css                         # Global styles
│   │
│   ├── components/                       # UI React
│   │   ├── App.tsx
│   │   ├── Login.tsx                     # Écran de connexion
│   │   ├── Dashboard.tsx                 # Accueil
│   │   ├── Sidebar.tsx                   # Barre latérale
│   │   ├── Projects.tsx                  # Gestion projets
│   │   ├── Team.tsx                      # Gestion équipe (BUGUÉ)
│   │   ├── Tasks.tsx                     # Gestion tâches
│   │   ├── CalendarView.tsx              # Calendrier
│   │   ├── CalendarPage.tsx              # Page calendrier
│   │   ├── Budget.tsx                    # Budget & dépenses
│   │   ├── Vendors.tsx                   # Prestataires
│   │   ├── Conducteur.tsx                # Conducteur jour J
│   │   ├── Settings.tsx                  # Paramètres
│   │   ├── NotificationBell.tsx          # Cloche notifications
│   │   └── NotificationsPanel.tsx        # Panneau notifications
│   │
│   └── utils/                            # Utilitaires
│       └── cn.ts                         # clsx wrapper
│
├── functions/                            # Cloudflare Pages Functions
│   ├── _middleware.js                    # Middleware (CORS, auth)
│   └── api/
│       ├── _utils.js                     # Utilitaires partagés
│       ├── health.js                     # GET /health
│       ├── users.js                      # GET/POST users (INCOMPLET)
│       ├── projects.js                   # Projets (à implémenter)
│       ├── tasks.js                      # Tâches (à implémenter)
│       ├── vendors.js                    # Prestataires (à implémenter)
│       ├── budget.js                     # Budget (à implémenter)
│       ├── ceremonies.js                 # (à implémenter)
│       ├── conducteurs.js                # (à implémenter)
│       ├── auth.js                       # Authentification (à implémenter)
│       └── notifications.js              # (à implémenter)
│
├── database/
│   ├── schema.sql                        # Schéma SQLite complet
│   └── cloudflare-d1.sql                 # Schéma D1
│
├── public/
│   ├── _headers                          # Headers HTTP (Cloudflare)
│   ├── _routes.json                      # Routing (Cloudflare Pages)
│   └── (assets statiques)
│
├── dist/                                 # Build de production (généré)
│
└── Configuration
    ├── DEPLOYMENT.md                     # Guide déploiement local
    ├── DEPLOIEMENT.md                    # Guide déploiement (FR)
    ├── WRANGLER_SETUP.md                 # Setup Wrangler/D1
    └── ROADMAP.md                        # Roadmap développement
```

---

## 4️⃣ Flux d'Authentification

### Comptes de Démonstration

| Rôle         | Username       | Password      | Fonction                           |
|--------------|----------------|---------------|------------------------------------|
| Super Admin  | `superadmin`   | `Super2026`   | Gestion globale de toutes agences |
| Admin        | `admin`        | `Admin2026`   | Coordinateur de l'agence Lems     |
| Planner      | `sophie`       | `Planner2026` | Sophie (Planificateur)             |
| Planner      | `assistante`   | `Planner2026` | Assistante (Planificateur)         |
| Client       | `marie`        | `mariage2026` | Mariée (Client)                    |
| Client       | `marie2`       | `mariage2026` | Marié (Client)                     |

### Rôles et Permissions

```
┌──────────────┬────────────────┬───────────────┬──────────────┬─────────────┐
│ Rôle         │ Voir Projects  │ Edite Projects│ Gère Team    │ Gère Budget │
├──────────────┼────────────────┼───────────────┼──────────────┼─────────────┤
│ super_admin  │ ALL            │ ALL           │ ALL          │ ALL         │
│ admin        │ Agency only    │ Agency only   │ Agency only  │ Agency only │
│ planner      │ Assigned only  │ Assigned only │ Limited      │ Limited     │
│ client       │ Assigned only  │ VIEW only     │ No           │ VIEW only   │
└──────────────┴────────────────┴───────────────┴──────────────┴─────────────┘
```

---

## 5️⃣ Modules Principaux

### ✅ Implémentés

1. **Login.tsx** — Authentification avec localStorage
   - Form simple: username + password
   - Validation des comptes démo
   - Persistence de session

2. **Sidebar.tsx** — Navigation principale
   - 9 pages accessibles
   - Collapse/expand responsive
   - Affichage utilisateur courant

3. **Dashboard.tsx** — Accueil
   - Stats (tâches, prestataires, budget)
   - Projets récents
   - Notifications

4. **Projects.tsx** — Gestion projets
   - Liste des projets
   - Création/édition
   - Filtrage par statut

5. **NotificationsPanel.tsx** — Notifications
   - Cloche avec compteur
   - Panneau déroulant
   - Marquer comme lu

### ⚠️ Partiellement Implémentés

1. **Team.tsx** — **BUGS À CORRIGER**
   - ❌ Boutons "Modifier" et "Supprimer" sans handlers
   - ❌ Pas de modal d'édition
   - ✅ Ajout de membres (partiellement)

2. **Tasks.tsx** — Gestion tâches
   - ✅ Affichage
   - ❌ Drag-drop (non fonctionnel)
   - ❌ Édition inline

3. **Budget.tsx** — Budget & dépenses
   - ✅ Affichage des dépenses
   - ❌ Ajout de dépense incomplet

### ❌ Non Implémentés

1. **CalendarView.tsx** — Calendrier
   - Design seulement
   - Pas de logique

2. **Conducteur.tsx** — Conducteur jour J
   - Design seulement
   - Pas de logique

3. **Vendors.tsx** — Prestataires
   - Affichage seul
   - Pas de CRUD

4. **Settings.tsx** — Paramètres
   - Page vide

---

## 6️⃣ État du Backend (functions/api)

### Endpoints Actuels

#### ✅ Implémentés
- `GET /api/health` → Status serveur
- `GET /api/users` → Liste utilisateurs (basique)
- `POST /api/users` → Créer utilisateur (basique)

#### ❌ À Implémenter
- `PUT /api/users/:id` → Modifier utilisateur
- `DELETE /api/users/:id` → Supprimer utilisateur
- `GET /api/projects` → Liste projets
- `POST /api/projects` → Créer projet
- `PUT /api/projects/:id` → Modifier projet
- `DELETE /api/projects/:id` → Supprimer projet
- (`tasks`, `vendors`, `budget`, etc. — même pattern)

### Problèmes Backend

1. **Authentification** (`auth.js`)
   - Pas implémentée
   - Pas de JWT/session
   - Tous les endpoints publics

2. **Validation**
   - Pas de validation des entrées
   - Pas de gestion d'erreurs

3. **Middleware** (`_middleware.js`)
   - CORS probablement absent
   - Pas d'authentification

---

## 7️⃣ Problèmes Identifiés

### 🔴 CRITIQUES

1. **Team.tsx — Boutons sans logique**
   - Boutons "Modifier" et "Supprimer" n'ont pas de handlers
   - Pas de modal d'édition
   - Impact: Impossible de gérer l'équipe

2. **Backend API incomplet**
   - Seulement GET/POST users
   - Pas de PUT/DELETE
   - Impact: Aucune persistence réelle des modifications

3. **Authentification absente**
   - Données en localStorage seulement
   - Pas de sécurité
   - Impact: N'importe qui peut modifier l'ID utilisateur

### 🟠 MAJEURS

1. **Base de données**
   - Wrangler.toml pointe vers BD de production
   - Pas de BD locale de développement
   - Impact: Impossible de tester localement

2. **Middleware**
   - Pas de CORS configuré
   - Pas d'authentification
   - Impact: Appels API peuvent échouer

3. **Validation des données**
   - Aucune validation côté serveur
   - Pas de contraintes
   - Impact: Données invalides peuvent être inséées

### 🟡 MINEURS

1. **Calendar & Conducteur** — Interfaces sans logique
2. **Vendors** — Affichage seulement, pas de CRUD
3. **Settings** — Page vide
4. **Drag-drop Tasks** — Non fonctionnel

---

## 8️⃣ Recommandations Prioritaires

### Phase 1 (Immédiate)
- [ ] ✅ **Corriger Team.tsx** — Ajouter handlers edit/delete
- [ ] ✅ **Créer BD locale** — Setup Wrangler D1 en développement
- [ ] **Implémenter PUT/DELETE users** — Backend API complet

### Phase 2 (Court terme)
- [ ] Implémenter authentification JWT
- [ ] Implémenter middleware CORS + auth
- [ ] Implémenter validation des données
- [ ] Tests unitaires (jest)

### Phase 3 (Moyen terme)
- [ ] Logique Calendar & Conducteur
- [ ] CRUD prestataires complet
- [ ] Drag-drop tâches
- [ ] Settings (thème, profil)

### Phase 4 (Long terme)
- [ ] Tests E2E (playwright)
- [ ] Documentation API (Swagger)
- [ ] Déploiement Cloudflare Pages
- [ ] Monitoring & logging

---

## 9️⃣ Commandes Utiles

```bash
# Développement
npm run dev                              # Vite dev server (4040)
npm run build                            # Build production
npm run preview                          # Preview build

# Déploiement local BD
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql

# Déploiement Cloudflare
npm run build
npx wrangler pages deploy dist

# Inspection
npx wrangler d1 execute eventflow-db --local --command="SELECT * FROM users"
```

---

## 🔟 Mesures de Succès

✅ Application lancée sur http://localhost:4040  
✅ Authentification fonctionnelle (comptes démo)  
✅ Team.tsx: Boutons edit/delete opérationnels  
✅ BD locale: Données persistées  
✅ Backend: PUT/DELETE endpoints implémentés  
✅ Zero erreurs console  
✅ Mobile-responsive (Tailwind)  
✅ Thème configurable (light/night/etc.)

---

**Généré**: 12 Juin 2026  
**Prochaine révision**: Après corrections Phase 1
