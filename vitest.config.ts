import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Testkonfiguration der Produktwebanwendung.
 *
 * Bewusst schlank: `environment: "node"` genügt für die Hilfsfunktionen und
 * Vertragstests, die hier entstehen. Komponententests (DOM) kommen erst, wenn
 * es dafür einen Anlass gibt — dann mit eigener Umgebung je Datei.
 *
 * Das Alias `@` entspricht dem `paths`-Eintrag in `tsconfig.json`; ohne es
 * fänden die Tests die Module nur über relative Pfade.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    restoreMocks: true,
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
