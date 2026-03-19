import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

const isProduction = process.env.VERCEL === "1";

export default defineConfig({
  integrations: [react(), tailwind()],
  output: "server",
  adapter: isProduction ? vercel() : node({ mode: "standalone" }),
  server: {
    port: 3000,
    host: true,
  },
  vite: {
    ssr: {
      external: ["bcryptjs", "jsonwebtoken"],
    },
  },
});
