import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api so'rovlari dev rejimda Spring Boot'ga yo'naltiriladi — CORS bilan ovora bo'lish shart emas.
// Backend boshqa portda bo'lsa: API_TARGET=http://localhost:8099 npm run dev
const apiTarget = process.env.API_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": apiTarget,
    },
  },
});
