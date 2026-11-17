import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // During development, send /api calls to the backend.
    proxy: { "/api": "http://localhost:3001" },
  },
});
