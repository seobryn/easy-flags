import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  site: "https://easy-flags.orangeember.com",
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
  integrations: [react(), sitemap(), robotsTxt()],
  adapter: isProduction ? vercel() : node({ mode: "standalone" }),
});
