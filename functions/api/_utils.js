/**
 * Utilitaires partagés pour les Pages Functions (JavaScript pur).
 * Aucune dépendance externe — compatible Cloudflare Workers runtime.
 */

/** Réponse JSON standardisée */
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Réponse d'erreur standardisée */
export function error(message, status = 400) {
  return json({ error: message }, status);
}

/** Parse le corps JSON d'une requête en toute sécurité */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Génère un identifiant unique (UUID v4 via crypto natif) */
export function uid(prefix = "") {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Vérifie que le binding D1 est présent.
 * À configurer dans wrangler.toml : [[d1_databases]] binding = "DB"
 */
export function getDb(env) {
  if (!env || !env.DB) {
    throw new Error("Binding D1 'DB' introuvable. Vérifiez wrangler.toml.");
  }
  return env.DB;
}
