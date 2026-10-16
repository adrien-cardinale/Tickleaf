import { copyFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import pkg from "./package.json" with { type: "json" }

const STATIC_MODE = "static"
const THEME_COLOR = "#ffffff"
const MAX_PRECACHE_BYTES = 4 * 1024 * 1024

// GitHub Pages sert 404.html pour toute URL inconnue : une copie de index.html y fait démarrer la SPA.
function spaFallback(): Plugin {
  let outDir = ""
  return {
    name: "spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(join(outDir, "index.html"), join(outDir, "404.html"))
    },
  }
}

export default defineConfig(({ mode }) => {
  const staticSite = mode === STATIC_MODE
  const base = staticSite ? (process.env.BASE_PATH ?? "/") : "/"
  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
        manifest: {
          name: "Tickleaf",
          short_name: "Tickleaf",
          description: "Tâches locales, sans compte ni serveur.",
          lang: "fr",
          display: "standalone",
          start_url: base,
          scope: base,
          theme_color: THEME_COLOR,
          background_color: THEME_COLOR,
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,wasm,woff2}"],
          maximumFileSizeToCacheInBytes: MAX_PRECACHE_BYTES,
          navigateFallback: "index.html",
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
        },
      }),
      staticSite && spaFallback(),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: true,
      proxy: {
        "/api": "http://localhost:3000",
      },
    },
    preview: {
      host: true,
    },
    build: {
      target: "es2022",
    },
  }
})
