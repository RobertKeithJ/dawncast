import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Daily Motivation AR",
        short_name: "DailyQuotes",
        description: "Weather-aware motivational quotes with AR display",
        theme_color: "#0c0c0c",
        background_color: "#0c0c0c",
        display: "standalone",
        orientation: "portrait",
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "weather-api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 2, // 2 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/api\/daily-quote.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "daily-quote-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true },
    }),
  ],
});
