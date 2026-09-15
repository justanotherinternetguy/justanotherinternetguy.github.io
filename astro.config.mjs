// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://internetguy.dev',
	// Emit /posts/<slug>.html to match the old site's URLs.
	build: { format: 'file' },
	// Compression drops line breaks next to inline tags, gluing words together.
	compressHTML: false,
});
