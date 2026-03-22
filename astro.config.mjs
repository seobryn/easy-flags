import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

const isProduction = process.env.VERCEL === "1";

export default defineConfig({
  output: "server",
  server: {
    port: 3000,
    host: true,
  },
  vite: {
    ssr: {
      external: ["bcryptjs", "jsonwebtoken"],
    },
    plugins: [tailwindcss()],
  },
  integrations: [react()],
  adapter: isProduction ? vercel() : node({ mode: "standalone" }),
});
