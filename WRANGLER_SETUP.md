# Configuration Wrangler (Cloudflare)

Pour utiliser la CLI `wrangler pages deploy`, créez ce fichier **manuellement** à la racine :

```toml
# wrangler.toml (à créer, NE PAS uploader sur Pages)
name = "eventflow-pro"
compatibility_date = "2025-01-15"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "eventflow-db"
database_id = "VOTRE_DATABASE_ID_ICI"
```

## Obtenir le database_id

```bash
npx wrangler d1 create eventflow-db
npx wrangler d1 execute eventflow-db --file=database/cloudflare-d1.sql
```

Le fichier `wrangler.toml` est ignoré à l'upload sur Cloudflare Pages (c'est la CLI qui l'utilise en local uniquement).
