# Déploiement local — EventFlow Pro

## Démarrage rapide sur localhost:4040

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
# → http://localhost:4040

# Build de production
npm run build

# Prévisualiser le build de production
npm run preview
# → http://localhost:4040
```

Le port **4040** est configuré dans `vite.config.ts` :

```ts
server: { host: "0.0.0.0", port: 4040, strictPort: true },
preview: { host: "0.0.0.0", port: 4040, strictPort: true },
```

## Comptes de démonstration

| Compte         | Identifiant       | Mot de passe     | Rôle          |
|----------------|-------------------|------------------|---------------|
| Super admin    | `superadmin`      | `Super2026`      | super_admin   |
| Admin agence   | `admin`           | `Admin2026`      | admin         |
| Planner lead   | `planner`         | `Planner2026`    | planner       |
| Assistante     | `assistante`      | `Planner2026`    | planner       |
| Mariée         | `marie`           | `mariage2026`    | client        |
| Marié          | `marie2`          | `mariage2026`    | client        |

## Build pour Cloudflare Pages / D1

Le dossier `database/` contient `cloudflare-d1.sql` (schéma SQLite/D1 complet).
Les `functions/api/*.js` sont des Pages Functions (JavaScript natif) pour Cloudflare.

### Étapes de déploiement Cloudflare

```bash
# 1. Build
npm run build

# 2. Créer la base D1
npx wrangler d1 create eventflow-db

# 3. Appliquer le schéma
npx wrangler d1 execute eventflow-db --file=database/cloudflare-d1.sql

# 4. Créer un wrangler.toml local (voir WRANGLER_SETUP.md)

# 5. Déployer (dist/ est servi statiquement + functions/)
npx wrangler pages deploy dist
```

> **⚠** N'uploadez **que le contenu de `dist/`** sur Cloudflare Pages (upload direct ou Git).
> Le dossier `src/`, `functions/`, `vite.config.ts`, `tsconfig.json`, `package.json` etc.
> sont ignorés par Pages et ne doivent pas être envoyés séparément. Les `functions/api/*.js`
> seront automatiquement déployées par Wrangler via `npx wrangler pages deploy dist`.

## Architecture

```
├── src/
│   ├── components/     # UI React (Login, Dashboard, Tasks, Calendar, Conducteur…)
│   ├── store.tsx       # State management (Context + localStorage)
│   └── data.ts         # Types + données par défaut + schéma conducteur
├── database/
│   └── cloudflare-d1.sql   # Schéma SQLite/Cloudflare D1
├── functions/
│   └── api/           # Pages Functions JS (projets, conducteurs…)
├── dist/              # Build de production
├── ROADMAP.md         # Plan d'amélioration SaaS
└── vite.config.ts     # Config Vite (port 4040)
```
