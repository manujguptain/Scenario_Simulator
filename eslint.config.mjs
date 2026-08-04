import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores(["dist/**", "node_modules/**", "build/**", "db/**", "worker/**", "examples/**"]),
  ...tseslint.configs.recommended,
]);

export default eslintConfig;
