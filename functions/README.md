# 📁 functions/ — Cloudflare Pages Functions (JavaScript pur)

## Pourquoi du JavaScript et pas du TypeScript ?

Cloudflare Pages **ne compile pas** automatiquement le TypeScript du dossier
`functions/`. Pour que le backend soit accepté **sans étape de build**, tous les
fichiers ici sont écrits en **JavaScript natif (.js)**, exécutables directement
par le runtime Cloudflare Workers.

> ℹ️ Le **front-end** (dossier `src/`, en TypeScript/TSX) est, lui, compilé en
> JavaScript par Vite lors de `npm run build`. Le résultat (`dist/index.html`)
> ne contient que du JS — donc Cloudflare l'accepte aussi sans problème.

## Routes disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/api/health`           | Diagnostic (runtime + binding D1) |
| `GET`   | `/api/projects`         | Liste des projets |
| `POST`  | `/api/projects`         | Crée un projet |
| `GET`   | `/api/tasks?project_id=`| Tâches d'un projet |
| `POST`  | `/api/tasks`            | Crée une tâche |
| `PUT`   | `/api/tasks`            | Met à jour le statut d'une tâche |
| `GET`   | `/api/notifications?user_id=` | Notifications d'un utilisateur |
| `POST`  | `/api/notifications`    | Crée une notification |
| `PATCH` | `/api/notifications`    | Marque comme lue(s) |

## Configuration requise

1. **Créer la base D1** :
   ```bash
   npx wrangler d1 create eventflow
   ```
2. **Coller l'ID** retourné dans `wrangler.toml` (`database_id`).
3. **Initialiser le schéma** :
   ```bash
   npx wrangler d1 execute eventflow --file=database/schema.sql
   ```
4. **Tester en local** :
   ```bash
   npm run build
   npx wrangler pages dev dist
   ```
   Puis ouvrir `http://localhost:8788/api/health`.

## Structure

```
functions/
├── _middleware.js        # CORS global sur /api/*
├── README.md
└── api/
    ├── _utils.js         # helpers (json, error, uid, getDb)
    ├── health.js         # GET /api/health
    ├── projects.js       # GET/POST /api/projects
    ├── tasks.js          # GET/POST/PUT /api/tasks
    └── notifications.js  # GET/POST/PATCH /api/notifications
```
