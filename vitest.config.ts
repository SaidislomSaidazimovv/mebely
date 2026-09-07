import { defineConfig } from "vitest/config";

// Город's engine suite — the Golden Cabinet Suite + primitive proofs + schema/advisor tests,
// moved here from the mebelchi-engine repo so the CANON (dvizhok) tests itself. Tests import
// `../dvizhok/*` (was `../engine/*` in the origin repo). joint_extractor is NOT included yet
// (it shells out to tools/joint_extractor.py + the XML examples, not carried into the city).
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
