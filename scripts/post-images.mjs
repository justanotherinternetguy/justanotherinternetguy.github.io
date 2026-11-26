// Shrinks the images posts use, without touching the originals.
//
// The vault sync drops full-size PNGs into public/assets/posts (some are
// several MB). This file leaves them alone and instead:
//
//   1. makes resized WebP copies of each one, cached in node_modules/.cache;
//   2. rewrites <img> tags in a post's rendered HTML to point at the copies,
//      with srcset, real width/height (no layout jump) and lazy loading
//      (`optimizeImages`, called from src/components/Post.astro);
//   3. serves the copies in `astro dev` and writes them into dist/ on build
//      (`postImages`, the integration in astro.config.mjs).
//
// It works on finished HTML rather than as a Markdown plugin, so it does
// not care which Markdown processor Astro uses.
//
// A copy sits next to its original: image.png -> image.png.1024.webp.
// Small files (see MIN_BYTES) are served as they are.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Astro always runs from the project root. (Not import.meta.url: this file
// is also bundled into the page renderer, where that points elsewhere.)
const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const CACHE = path.join(ROOT, 'node_modules/.cache/post-images');
const PREFIX = '/assets/posts/';
const RASTER = /\.(png|jpe?g|webp)$/i;
const VARIANT = /\.(\d+)\.webp$/;
/** Widths to offer: one for phones and 1x screens, one for 2x desktops. */
const WIDTHS = [1024, 1600];
/** Below this size a second request costs more than it saves. */
const MIN_BYTES = 60_000;
/** The text column is about 720px wide; phones use the full width. */
const SIZES = '(max-width: 760px) calc(100vw - 44px), 720px';

let sharpLoad;
const loadSharp = () =>
	(sharpLoad ??= import('sharp').then(
		(m) => m.default,
		() => {
			console.warn('[post-images] sharp is not installed; post images are served unoptimized.');
			return null;
		},
	));

/** url -> Promise of { width, height, variants: [{ width, url, file }] } or null. */
const jobs = new Map();

/** Work out (and create, if missing) the WebP copies for one image URL. */
function describe(url) {
	if (!jobs.has(url)) jobs.set(url, build(url).catch(() => null));
	return jobs.get(url);
}

async function build(url) {
	const sharp = await loadSharp();
	if (!sharp) return null;
	const file = path.join(PUBLIC, decodeURIComponent(url));
	if (!file.startsWith(PUBLIC + path.sep)) return null;
	const stat = await fs.stat(file);
	const { width, height, pages } = await sharp(file).metadata();
	// Animations stay as they are.
	if (!width || !height || (pages ?? 1) > 1) return null;
	if (stat.size < MIN_BYTES) return { width, height, variants: [] };

	// Never upscale; drop a width that is nearly the same as the next one up.
	let widths = [...new Set(WIDTHS.map((w) => Math.min(w, width)))];
	if (widths.length > 1 && widths[1] < widths[0] * 1.25) widths = [widths[1]];

	// The cache key covers the file's contents-as-seen-by-stat, so an edited
	// image gets fresh copies and an untouched one is never redone.
	const key = createHash('sha1').update(`${url}:${stat.size}:${stat.mtimeMs}`).digest('hex').slice(0, 16);
	await fs.mkdir(CACHE, { recursive: true });
	const variants = await Promise.all(
		widths.map(async (w) => {
			const out = path.join(CACHE, `${key}.${w}.webp`);
			try {
				await fs.access(out);
			} catch {
				const tmp = `${out}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
				await sharp(file).resize({ width: w }).webp({ quality: 82, effort: 5, smartSubsample: true }).toFile(tmp);
				await fs.rename(tmp, out);
			}
			return { width: w, url: `${url}.${w}.webp`, file: out };
		}),
	);
	return { width, height, variants };
}

// One <img> tag, allowing ">" inside quoted attribute values.
const IMG = /<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const ATTR = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/** Rewrite one tag; returns it unchanged if it is not a post image. */
async function rewrite(tag) {
	const attrs = new Map();
	for (const m of tag.slice(4, tag.endsWith('/>') ? -2 : -1).matchAll(ATTR)) {
		attrs.set(m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? null);
	}
	const src = attrs.get('src');
	if (!src?.startsWith(PREFIX)) return tag;

	if (!attrs.has('loading')) attrs.set('loading', 'lazy');
	if (!attrs.has('decoding')) attrs.set('decoding', 'async');
	const info = RASTER.test(src) ? await describe(src) : null;
	if (info) {
		if (!attrs.has('width')) attrs.set('width', String(info.width));
		if (!attrs.has('height')) attrs.set('height', String(info.height));
		const largest = info.variants.at(-1);
		if (largest) {
			attrs.set('src', largest.url);
			// The image viewer opens this one.
			attrs.set('data-full', largest.url);
			if (info.variants.length > 1) {
				attrs.set('srcset', info.variants.map((v) => `${v.url} ${v.width}w`).join(', '));
				attrs.set('sizes', SIZES);
			}
		}
	}
	// Values came out of HTML and go back in untouched, so they stay escaped.
	return '<img' + [...attrs].map(([k, v]) => (v === null ? ` ${k}` : ` ${k}="${v}"`)).join('') + '>';
}

/** Point every post image in a chunk of rendered HTML at its WebP copies. */
export async function optimizeImages(html) {
	const tags = html.match(IMG);
	if (!tags) return html;
	const done = await Promise.all(tags.map(rewrite));
	let i = 0;
	return html.replace(IMG, () => done[i++]);
}

/** All raster image URLs under public/assets/posts. */
async function* sources(dir = path.join(PUBLIC, PREFIX)) {
	let entries = [];
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) yield* sources(full);
		else if (RASTER.test(entry.name)) {
			yield '/' + path.relative(PUBLIC, full).split(path.sep).map(encodeURIComponent).join('/');
		}
	}
}

/** Astro integration: serve the copies in dev, write them out on build. */
export function postImages() {
	return {
		name: 'post-images',
		hooks: {
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(async (req, res, next) => {
					const url = (req.url ?? '').split('?')[0];
					const match = url.startsWith(PREFIX) ? url.match(VARIANT) : null;
					if (!match) return next();
					const info = await describe(url.slice(0, match.index));
					const variant = info?.variants.find((v) => v.width === Number(match[1]));
					if (!variant) return next();
					res.setHeader('Content-Type', 'image/webp');
					res.end(await fs.readFile(variant.file));
				});
			},
			'astro:build:done': async ({ dir, logger }) => {
				const out = fileURLToPath(dir);
				let count = 0;
				let before = 0;
				let after = 0;
				for await (const url of sources()) {
					const info = await describe(url);
					if (!info?.variants.length) continue;
					before += (await fs.stat(path.join(PUBLIC, decodeURIComponent(url)))).size;
					for (const v of info.variants) {
						const dest = path.join(out, decodeURIComponent(v.url));
						await fs.mkdir(path.dirname(dest), { recursive: true });
						await fs.copyFile(v.file, dest);
						count++;
					}
					after += (await fs.stat(info.variants.at(-1).file)).size;
				}
				const mb = (n) => (n / 1e6).toFixed(2) + ' MB';
				logger.info(`${count} WebP copies written; largest copies total ${mb(after)} (originals ${mb(before)})`);
			},
		},
	};
}
