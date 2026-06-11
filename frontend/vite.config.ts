import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api so'rovlari dev rejimda Spring Boot'ga (8080) yo'naltiriladi —
// CORS bilan ovora bo'lish shart emas.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
