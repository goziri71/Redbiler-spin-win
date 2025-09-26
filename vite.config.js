import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Use relative asset paths so dist can be opened directly or hosted in a subfolder
  base: "./",
  plugins: [react()],
});
