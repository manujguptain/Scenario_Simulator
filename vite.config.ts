import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  // Relative assets work when the same dist/ folder is copied to either
  // /Scenario_Simulator/ or /future-map/. Set VITE_BASE_PATH for an explicit path.
  base: process.env.VITE_BASE_PATH || "./",
  plugins: [react()],
  server: isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : undefined,
});
