# 🚀 Déploiement local — EventFlow Pro

Ce guide explique comment construire et servir l'application **EventFlow Pro**
en local sur **http://localhost:4040**.

---

## 1. Prérequis

- **Node.js 18+** (recommandé : Node 20 ou 22)
- **npm** (fourni avec Node.js)

Vérifiez votre version :

```bash
node --version
npm --version
```

---

## 2. Installation des dépendances

```bash
npm install
```

---

## 3. Build de production

Le projet utilise **Vite** avec le plugin `vite-plugin-singlefile`, ce qui
génère **un seul fichier** `dist/index.html` (JS + CSS inlinés). Idéal pour un
déploiement statique simple.

```bash
npm run build
```

Résultat : `dist/index.html` (~450 Ko, ~117 Ko gzip).

---

## 4. Servir en local sur le port 4040

Un serveur statique **sans dépendance** est fourni (`serve-local.mjs`).

```bash
node serve-local.mjs
```

Sortie attendue :

```
  ┌──────────────────────────────────────────────┐
  │   🗓️  EventFlow Pro — serveur local démarré    │
  └──────────────────────────────────────────────┘

  ➜  Local :  http://localhost:4040
  ➜  Réseau:  http://<votre-ip-locale>:4040
```

Ouvrez ensuite **http://localhost:4040** dans votre navigateur.

### Changer le port ou l'hôte

```bash
# Autre port
PORT=8080 node serve-local.mjs

# Restreindre à localhost uniquement
HOST=127.0.0.1 node serve-local.mjs
```

---

## 5. Alternative : prévisualisation Vite

Vous pouvez aussi utiliser le serveur de preview intégré de Vite sur le port 4040 :

```bash
npm run build
npx vite preview --port 4040 --host
```

---

## 6. Mode développement (hot reload)

Pour développer avec rechargement à chaud (port Vite par défaut, 5173) :

```bash
npm run dev
```

Pour forcer le port 4040 en dev :

```bash
npx vite --port 4040 --host
```

---

## 7. Déploiement sur Cloudflare Pages

### ⚠️ TypeScript vs JavaScript — ce qu'il faut savoir

Cloudflare Pages **ne sert que du JavaScript** (pas de TypeScript brut). Le projet
est déjà conforme :

| Partie | Langage source | Servi par Cloudflare |
|--------|----------------|----------------------|
| Front (`src/*.tsx`) | TypeScript | ✅ Compilé en JS par Vite → `dist/index.html` |
| Backend (`functions/*.js`) | **JavaScript pur** | ✅ Exécuté tel quel (aucune compilation) |

➡️ **Rien à convertir manuellement.** `npm run build` transpile tout le front en
JavaScript, et le dossier `functions/` est déjà en `.js` natif.

> Le `tsconfig.json` n'inclut que `src/` — le dossier `functions/` n'est donc
> jamais traité par le compilateur TypeScript.

### ⚠️ Erreur « wrangler.toml could not be uploaded / are unknown »

Cette erreur signifie que le déploiement essaie d'uploader `wrangler.toml`
(fichier de **configuration**, pas un asset) comme contenu statique.

**Causes et solutions :**

1. **Déployer le dossier `dist`, jamais la racine** :
   ```bash
   npx wrangler pages deploy dist      # ✅ correct
   npx wrangler pages deploy .         # ❌ scanne wrangler.toml -> erreur
   ```

2. **Build output directory = `dist`** dans le dashboard Cloudflare
   (Settings → Builds & deployments → *Build output directory* = `dist`).

3. Un fichier **`.assetsignore`** est fourni (copié automatiquement dans `dist/`
   via `public/.assetsignore`). Il indique à Cloudflare d'ignorer
   `wrangler.toml`, `*.toml`, `README.md`, etc. S'ils se trouvent dans le
   dossier déployé.

4. **Garder la section `[[d1_databases]]` commentée** tant que la base D1 n'est
   pas créée (un `database_id` invalide fait échouer Wrangler).

### Étapes recommandées

1. **Build du front** (TS → JS) :
   ```bash
   npm run build
   ```
2. **Créer la base D1** :
   ```bash
   npx wrangler d1 create eventflow-db
   ```
   Copiez le `database_id` retourné.
3. **Renseigner `wrangler.toml`** : collez ce `database_id` dans le bloc
   `[[d1_databases]]` (remplacez les zéros). Faites de même pour la base preview
   si vous en créez une.
4. **Initialiser le schéma** (tables) :
   ```bash
   # Base distante (production)
   npx wrangler d1 execute eventflow-db --remote --file=database/schema.sql

   # Base locale (pour le dev)
   npx wrangler d1 execute eventflow-db --local --file=database/schema.sql
   ```
5. **Tester localement** (front + Functions + D1) :
   ```bash
   npx wrangler pages dev dist
   # puis ouvrez http://localhost:8788/api/health
   ```
6. **Déployer** :
   ```bash
   npx wrangler pages deploy dist
   ```

### API disponible (Pages Functions, JavaScript pur)

| Méthode | Endpoint | Rôle |
|---------|----------|------|
| GET | `/api/health` | Diagnostic + état du binding D1 |
| GET/POST | `/api/projects` | Lister / créer des projets |
| GET/POST/PUT | `/api/tasks` | Lister / créer / changer statut |
| GET/POST/PATCH | `/api/notifications` | Lister / créer / marquer lues |

Voir `functions/README.md` pour le détail.

> ℹ️ Les données sont actuellement stockées en `localStorage`. Pour basculer sur
> D1, importez `src/apiClient.js` dans le store et remplacez les écritures
> locales par les méthodes `api.*`. Le reste du front est inchangé.

---

## 8. Comptes de démonstration

| Identifiant   | Mot de passe   | Rôle              |
|---------------|----------------|-------------------|
| `superadmin`  | `Super2026`    | Super admin       |
| `admin`       | `Admin2026`    | Agence (Lems)     |
| `sophie`      | `Planner2026`  | Planner           |
| `karim`       | `Planner2026`  | Planner           |
| `marie`       | `mariage2026`  | Cliente (Mariée)  |
| `marie2`      | `mariage2026`  | Client (Marié)    |

---

## 9. Dépannage

| Problème | Solution |
|---|---|
| `dist/ introuvable` | Lancez `npm run build` avant de servir |
| Port 4040 déjà utilisé | `PORT=4041 node serve-local.mjs` |
| Page blanche | Videz le cache navigateur / `localStorage` |
| Réinitialiser les données | Console navigateur : `localStorage.clear()` puis recharger |
```
