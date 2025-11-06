import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ✅ Allows local network access (useful when testing on Raspberry Pi)
  server: {
    host: true,       // Makes Vite accessible via local IP (e.g., 192.168.x.x)
    port: 5173,       // Default port
  },

  // ✅ Fix build path for deployment (important for Vercel)
  build: {
    outDir: "dist",   // Output folder Vercel uses
  },
});
