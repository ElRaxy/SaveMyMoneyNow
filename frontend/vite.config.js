/**
 * Vite config — SaveMyMoneyNow frontend
 *
 * manualChunks (code splitting):
 *   Separamos en chunks independientes las dependencias pesadas y estables
 *   para que el navegador cachee `charts` (recharts + d3) y `react-vendor`
 *   entre deploys. Cuando solo cambie el código de la app, esos bundles
 *   siguen cacheados y el usuario solo descarga el chunk principal.
 *
 *   - charts        → recharts, d3-*, victory-vendor (la lib mas pesada).
 *   - react-vendor  → react, react-dom, react-router-dom, scheduler.
 *   - axios         → cliente HTTP.
 *   - vendor        → resto de node_modules.
 *   - index         → código propio de la app.
 *
 *   Beneficio: menor TTI en navegaciones repetidas y elimina el aviso de
 *   Vite "chunks larger than 500 kB" al evitar un único bundle gigante.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5180,
    strictPort: true
  },
  preview: {
    host: "127.0.0.1",
    port: 5180,
    strictPort: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Charts: recharts + sus deps internas (d3 + victory-vendor).
            if (/[\\/](recharts|victory-vendor)[\\/]/.test(id)) return "charts";
            if (/[\\/]d3-[^\\/]+[\\/]/.test(id)) return "charts";
            if (/[\\/]internmap[\\/]|[\\/]robust-predicates[\\/]|[\\/]delaunator[\\/]/.test(id)) return "charts";
            // React core + router + runtime helpers comparten chunk para
            // evitar dependencias circulares con `vendor`.
            if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run[\\/]router)[\\/]/.test(id)) return "react-vendor";
            if (/[\\/]axios[\\/]/.test(id)) return "axios";
            return "vendor";
          }
        }
      }
    }
  }
});
