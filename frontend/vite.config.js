import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "npm run dev" sends /api calls to the backend. In Docker, Nginx does this instead.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8000" } },
});
