# 📖 README — EventFlow Pro (Updated 12 Juin 2026)

**Application web SaaS de gestion de mariage** — Planification, budget, équipe, conducteur jour J

---

## 🎯 À Propos

**EventFlow Pro** est une plateforme web complète pour coordonner et gérer les événements matrimoniaux. Destinée aux agences de coordination, aux planificateurs et aux couples, elle offre une visibilité totale sur tous les aspects d'un mariage.

### Fonctionnalités Principales
- 👥 **Gestion d'équipe** : Ajouter, modifier, supprimer des collaborateurs
- 📋 **Planification de tâches** : Suivi de progression, phases (Préparation, Veille, Jour J)
- 📅 **Calendrier intégré** : Vue sur les événements et jalons importants
- 💰 **Budget** : Suivi des dépenses par catégorie et prestataire
- 🏢 **Prestataires** : Gestion des fournisseurs (orchestre, traiteur, photo, etc.)
- 🎤 **Conducteur jour J** : Détails de chaque phase, horaires, responsabilités
- 🔔 **Notifications** : Fil d'actualité en temps réel
- 🎨 **Thèmes** : Light, Night, Blue, Rose, Emerald, Lavender

---

## 🚀 Quick Start

### Prérequis
- Node.js 16+
- npm 8+
- Wrangler CLI (installé via npm)

### Installation (5 minutes)

```bash
# 1. Cloner/ouvrir le projet
cd wedding-management-saas-development

# 2. Installer les dépendances
npm install

# 3. Créer la base de données locale
npx wrangler d1 create eventflow-db

# 4. Initialiser le schéma
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql

# 5. Charger les données de démo (optionnel)
npx wrangler d1 execute eventflow-db --local --file=database/seed.sql

# 6. Lancer l'application
npm run dev

# → Ouvrir http://localhost:4040
```

### Comptes de Test

| Rôle | Username | Password | Fonction |
|------|----------|----------|----------|
| Super Admin | `superadmin` | `Super2026` | Accès complet |
| Admin | `admin` | `Admin2026` | Agence Lems |
| Planner | `sophie` | `Planner2026` | Planificateur |
| Planner | `assistante` | `Planner2026` | Assistante |
| Client | `marie` | `mariage2026` | Mariée |
| Client | `marie2` | `mariage2026` | Marié |

---

## 📁 Structure du Projet

```
.
├── src/                          # Code source React
│   ├── components/               # Composants UI
│   │   ├── Team.tsx              # ✅ CORRIGÉ: Edit/Delete opérationnels
│   │   ├── Tasks.tsx
│   │   ├── Budget.tsx
│   │   ├── Projects.tsx
│   │   └── ...
│   ├── store.tsx                 # State management (Context API)
│   ├── data.ts                   # Types et données
│   └── main.tsx
│
├── functions/                    # Cloudflare Pages Functions
│   ├── api/
│   │   ├── users.js              # ⚠️ Partiellement implémenté
│   │   ├── projects.js           # À faire
│   │   ├── tasks.js              # À faire
│   │   └── ...
│   └── _middleware.js
│
├── database/                     # Base de données
│   ├── schema.sql                # Schéma SQLite (14 tables)
│   └── seed.sql                  # Données de démonstration
│
├── ANALYSE_COMPLETE.md           # 📊 Réanalyse complète
├── SETUP_BD_LOCAL.md             # 🗄️  Guide BD locale
├── QUICKSTART.md                 # 🚀 Guide de démarrage
├── RESUME_CORRECTIONS.md         # ✅ Résumé des corrections
└── SETUP.sh                      # Script d'installation
```

---

## ✅ Dernières Corrections (12 Juin 2026)

### 1️⃣ Team.tsx — Boutons Fonctionnels
- ✅ Bouton "Modifier" → Modal d'édition
- ✅ Bouton "Supprimer" → Modal de confirmation
- ✅ Validation des champs
- ✅ Confirmations avant suppression

### 2️⃣ store.tsx — Méthode deleteUser
- ✅ Ajout de `deleteUser(userId)`
- ✅ Suppression des assignations orphelines
- ✅ Export dans le contexte

### 3️⃣ Base de Données Locale
- ✅ Wrangler D1 configuré
- ✅ 14 tables créées
- ✅ Données de démo incluses
- ✅ Script de test

### 4️⃣ Documentation
- ✅ Analyse complète (500 lignes)
- ✅ Guide BD locale (280 lignes)
- ✅ Quick start guide
- ✅ Résumé des corrections

---

## 🧪 Tests Recommandés

### Test 1: Ajouter un utilisateur
```
1. Login: admin / Admin2026
2. Aller à "Équipe"
3. Cliquer "Inviter membre"
4. Remplir le formulaire
5. Vérifier que l'utilisateur apparaît
```

### Test 2: Modifier un utilisateur
```
1. Cliquer "Modifier" sur un utilisateur
2. Changer le nom/rôle/couleur
3. Cliquer "Enregistrer"
4. Vérifier les changements
```

### Test 3: Supprimer un utilisateur
```
1. Cliquer "Supprimer" (icône corbeille)
2. Lire l'avertissement
3. Confirmer la suppression
4. Vérifier que l'utilisateur disparaît
```

---

## 🛠️ Commandes Essentielles

### Développement

```bash
npm run dev          # Lancer dev server (port 4040)
npm run build        # Build production
npm run preview      # Prévisualiser le build
```

### Base de Données

```bash
# Créer la BD
npx wrangler d1 create eventflow-db

# Initialiser le schéma
npx wrangler d1 execute eventflow-db --local --file=database/schema.sql

# Charger les données de démo
npx wrangler d1 execute eventflow-db --local --file=database/seed.sql

# Tester la BD
node test-db.mjs

# Lister les tables
npx wrangler d1 execute eventflow-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Voir tous les utilisateurs
npx wrangler d1 execute eventflow-db --local --command="SELECT * FROM users;"
```

### Déploiement Cloudflare (Futur)

```bash
npm run build
npx wrangler pages deploy dist
```

---

## 📊 Stack Technologique

### Frontend
- **React 19.2.6** — Framework UI
- **Vite 7.3.2** — Build tool ultra-rapide
- **TypeScript 5.9.3** — Typage statique
- **Tailwind CSS 4.1.17** — Utility-first CSS
- **Lucide React** — Icônes SVG

### Backend
- **Cloudflare Pages Functions** — Serverless
- **Node.js compat runtime** — JavaScript natif

### Database
- **Cloudflare D1** — SQLite serverless
- **14 tables** — Relations bien structurées

### State Management
- **React Context API** — Pas de Redux
- **localStorage** — Persistence client
- **useCallback** — Optimisations

---

## 📋 Checklist de Configuration

- [ ] `npm install`
- [ ] `npx wrangler d1 create eventflow-db`
- [ ] Copier `database_id` dans `wrangler.toml`
- [ ] `npx wrangler d1 execute eventflow-db --local --file=database/schema.sql`
- [ ] `npx wrangler d1 execute eventflow-db --local --file=database/seed.sql`
- [ ] `npm run dev`
- [ ] Ouvrir http://localhost:4040
- [ ] Tester les comptes de démo

---

## 🐛 Problèmes Courants

### ❌ "Binding D1 'DB' introuvable"
```bash
npx wrangler d1 create eventflow-db
# Copier le database_id dans wrangler.toml
```

### ❌ "Cannot find module 'react'"
```bash
npm install
# Nettoyer le cache
rm -rf node_modules package-lock.json
npm install
```

### ❌ Port 4040 déjà utilisé
```bash
# Changer le port dans vite.config.ts ou utiliser:
PORT=5000 npm run dev
```

---

## 📚 Documentation Complète

| Document | Lien | Contenu |
|----------|------|---------|
| **Analyse Complète** | [ANALYSE_COMPLETE.md](ANALYSE_COMPLETE.md) | Architecture, stack, état, recommandations |
| **BD Locale** | [SETUP_BD_LOCAL.md](SETUP_BD_LOCAL.md) | Configuration, schéma, requêtes |
| **Quick Start** | [QUICKSTART.md](QUICKSTART.md) | Démarrage rapide, tests, checklist |
| **Corrections** | [RESUME_CORRECTIONS.md](RESUME_CORRECTIONS.md) | Détail des changements apportés |
| **Déploiement** | [DEPLOYMENT.md](DEPLOYMENT.md) | Guide déploiement Cloudflare |
| **Wrangler** | [WRANGLER_SETUP.md](WRANGLER_SETUP.md) | Config Wrangler avancée |
| **Roadmap** | [ROADMAP.md](ROADMAP.md) | Feuille de route produit |

---

## 🎯 Prochaines Priorités

### Phase 1 (Immédiate) ✅
- [x] Réanalyse complète
- [x] BD locale configurée
- [x] Team.tsx corrigé
- [ ] Tests validés

### Phase 2 (2-3 semaines) ⏳
- [ ] Backend API complet (PUT/DELETE users)
- [ ] Authentification JWT
- [ ] Validation côté serveur

### Phase 3 (1 mois)
- [ ] Calendar logique
- [ ] Conducteur jour J
- [ ] CRUD prestataires
- [ ] Tests unitaires

### Phase 4 (Production)
- [ ] Tests E2E
- [ ] Déploiement Cloudflare Pages
- [ ] Monitoring & logging

---

## 🤝 Contribution

Le code suit ces conventions :
- **TypeScript strict** — Types explicites
- **Tailwind CSS** — Pas de CSS custom
- **React Hooks** — Pas de class components
- **Functional approach** — Programmation fonctionnelle

---

## 📞 Support

**Problèmes?**
1. Vérifiez [ANALYSE_COMPLETE.md](ANALYSE_COMPLETE.md)
2. Consultez [SETUP_BD_LOCAL.md](SETUP_BD_LOCAL.md)
3. Lancez `node test-db.mjs` pour diagnostiquer
4. Nettoyez cache: `npm cache clean --force`

---

## 📄 License

Propriétaire — Lems Coordination 2026

---

## 🔗 Liens Utiles

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [React 19](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

**Version**: 1.0.0  
**Date**: 12 Juin 2026  
**Auteur**: GitHub Copilot  
**Status**: 🟢 Prêt pour tests locaux

✨ *Merci de tester les corrections et de nous signaler tout problème !*
