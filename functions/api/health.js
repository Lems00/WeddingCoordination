/**
 * Route /api/health — diagnostic (JavaScript pur).
 * Vérifie que les Pages Functions tournent et que le binding D1 est présent.
 */

import { json } from "./_utils.js";

export async function onRequestGet(context) {
  const hasDb = !!(context.env && context.env.DB);
  return json({
    status: "ok",
    runtime: "cloudflare-pages-functions",
    language: "javascript",
    d1_bound: hasDb,
    time: new Date().toISOString(),
  });
}
