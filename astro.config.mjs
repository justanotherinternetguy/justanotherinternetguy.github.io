// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
import rehypeWrapH1 from "./src/lib/rehypeWrapH1.js";
import rehypeImageCaption from "./src/lib/rehypeImageCaption.js";

import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://internetguy.dev",
  markdown: {
    rehypePlugins: [rehypeWrapH1, rehypeImageCaption],
  },

  integrations: [react(), sitemap()],
});