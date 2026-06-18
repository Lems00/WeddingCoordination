import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config dédiée aux tests : environnement Node (logique pure, crypto Web,
// mappers). Pas de plugins de build (singlefile/tailwind) inutiles ici.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.{ts,tsx,js}", "functions/**/*.test.js"],
  },
export default {
  build: {
    manifest: true
  }
}
});
