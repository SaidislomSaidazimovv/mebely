import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The CITY build (mebelchi-next). Two apps from one build, same origin:
//   prilozhenie/  → App-1 + App-2 (korpus + main.tsx)
//   kuznitsa/     → App-3 Forge (verstak/harness/main.tsx)
// §D: self-contained — @mebelchi/* live in the city (pakety/), engine = dvizhok. No repo reference.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        prilozhenie: r("prilozhenie/index.html"),
        kuznitsa: r("kuznitsa/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      // §D: app packages now live IN the city (pakety/) — no repo reference (self-contained).
      "@mebelchi/schema": r("pakety/schema/src/index.ts"),
      "@mebelchi/pricing": r("pakety/pricing/src/index.ts"),
      // App-3 (verstak) pulls three's addons (OrbitControls / TransformControls / BufferGeometryUtils)
      "three/addons": r("node_modules/three/examples/jsm"),
      // §C: korpus (App-1+2) imports the engine by a fixed relative path (`../../../../engine`).
      // SINGLE ENGINE («движка копий не существует») — point it at the city's own dvizhok.
      "../../../../engine": r("dvizhok"),
    },
  },
  server: {
    host: true,
    // §8: self-contained — everything (pakety, dvizhok, engine, node_modules) lives under the city root.
    fs: { allow: [r(".")] },
  },
});
