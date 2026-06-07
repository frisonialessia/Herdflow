import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// `@/x` → repo-root `/x`, mirroring tsconfig `paths` so tests import exactly
// like the app does. Node environment: the suite covers pure domain logic and
// the Postgres data layer (no DOM).
const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": root } },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    // DB integration tests open a pool and clean up in afterAll; give them room.
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
