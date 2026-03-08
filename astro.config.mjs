// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
import rehypeWrapH1 from "./src/lib/rehypeWrapH1.js";

import react from "@astrojs/react";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeWrapH1],
  },

  integrations: [react()],
});