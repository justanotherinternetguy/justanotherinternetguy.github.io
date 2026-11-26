// @ts-check
import { defineConfig } from 'astro/config';
import { postImages } from './scripts/post-images.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://internetguy.dev',
	build: {
		// Emit /posts/<slug>.html to match the old site's URLs.
		format: 'file',
		// Each page carries only the CSS it uses (see src/styles), small enough
		// to ship inside the HTML: first paint needs one request, not two.
		inlineStylesheets: 'always',
	},
	// Compression drops line breaks next to inline tags, gluing words together.
	compressHTML: false,
	// Fetch a page when its link is hovered or focused, so the click is instant.
	prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
	// Resized WebP copies of post images; see scripts/post-images.mjs.
	integrations: [postImages()],
	markdown: {
		// Syntax colors come from --astro-code-* variables in prose.css,
		// so code blocks share the site palette.
		shikiConfig: { theme: 'css-variables' },
	},
});
