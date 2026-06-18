/**
 * Middleware global des Cloudflare Pages Functions (JavaScript pur).
 *
 * Cloudflare Pages ne compile PAS le TypeScript du dossier `functions/` :
 * tous les fichiers ici DOIVENT être du JavaScript natif (.js).
 *
 * Responsabilités :
 *   - CORS : origine restreinte (env.ALLOWED_ORIGIN) ou origine de la requête
 *     en repli (déploiement same-origin du SPA). Pinner ALLOWED_ORIGIN en prod.
 *   - Auth : exige un JWT Bearer valide sur /api/* SAUF les routes publiques
 *     (/api/health, /api/auth). Le payload décodé est exposé aux handlers via
 *     context.data.user.
 */

import { verifyJwt, getJwtSecret } from "./api/_auth.js";

// Routes accessibles sans jeton.
const PUBLIC_PATHS = ["/api/health", "/api/auth"];

function corsHeaders(request, env) {
  const allowed = (env && env.ALLOWED_ORIGIN) || request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response, headers) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(headers)) newHeaders.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export async function onRequest(context) {
  const { request, env, next, data } = context;
  const cors = corsHeaders(request, env);
  const { pathname } = new URL(request.url);

  // Préflight CORS
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  // Auth requise sur /api/* hors routes publiques.
  const isApi = pathname.startsWith("/api/");
  const isPublic = PUBLIC_PATHS.includes(pathname);
  if (isApi && !isPublic) {
    const auth = request.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const payload = token ? await verifyJwt(token, getJwtSecret(env)) : null;
    if (!payload) {
      return withCors(
        Response.json({ error: "Non authentifié" }, { status: 401 }),
        cors
      );
    }
    // Disponible pour les handlers en aval (autorisations fines, audit, etc.).
    data.user = payload;
  }

  const response = await next();
  return withCors(response, cors);
}
