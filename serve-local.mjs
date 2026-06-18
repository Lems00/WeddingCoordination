#!/usr/bin/env node
/**
 * Serveur statique minimal (zéro dépendance) pour EventFlow Pro.
 * Sert le dossier `dist/` (build de production) sur http://localhost:4040
 *
 * Utilisation :
 *   1) npm run build            # génère dist/index.html
 *   2) node serve-local.mjs     # démarre le serveur sur le port 4040
 *
 * Variables d'environnement :
 *   PORT  -> change le port (défaut : 4040)
 *   HOST  -> change l'hôte  (défaut : 0.0.0.0 -> accessible via localhost)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "dist");

const PORT = Number(process.env.PORT) || 4040;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

// Vérifie que le build existe
if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
  console.error("\n❌  Le dossier dist/ est introuvable ou vide.");
  console.error("    Lancez d'abord :  npm run build\n");
  process.exit(1);
}

function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  res.writeHead(statusCode, { "Content-Type": type, "Cache-Control": "no-cache" });
  stream.pipe(res);
  stream.on("error", () => {
    res.writeHead(500);
    res.end("Erreur de lecture du fichier");
  });
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let filePath = path.join(DIST_DIR, urlPath);

    // Empêche le path traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end("Accès refusé");
      return;
    }

    // Si répertoire -> index.html
    if (urlPath === "/" || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
      filePath = path.join(DIST_DIR, "index.html");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      sendFile(res, filePath);
    } else {
      // SPA fallback : toute route inconnue renvoie index.html
      sendFile(res, path.join(DIST_DIR, "index.html"), 200);
    }
  } catch (err) {
    res.writeHead(500);
    res.end("Erreur serveur interne");
  }
});

server.listen(PORT, HOST, () => {
  console.log("\n  ┌──────────────────────────────────────────────┐");
  console.log("  │   🗓️  EventFlow Pro — serveur local démarré    │");
  console.log("  └──────────────────────────────────────────────┘\n");
  console.log(`  ➜  Local :  http://localhost:${PORT}`);
  if (HOST === "0.0.0.0") {
    console.log(`  ➜  Réseau:  http://<votre-ip-locale>:${PORT}`);
  }
  console.log("\n  (Ctrl+C pour arrêter)\n");
});
