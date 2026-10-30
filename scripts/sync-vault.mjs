#!/usr/bin/env node
/**
 * Publish blog posts from the Obsidian vault.
 *
 * Mirrors <vault>/blog/*.md into src/content/posts and <vault>/blog/assets
 * into public/assets/posts, rewrites image links to site URLs, checks that
 * the site builds, then commits and pushes. GitHub Actions deploys the push.
 *
 *   node scripts/sync-vault.mjs            sync, commit, push
 *   node scripts/sync-vault.mjs --dry-run  sync and build, but don't commit
 *
 * Posts are skipped if they have no frontmatter or have `draft: true`.
 * Exit codes: 0 ok, 1 content or build problem, 75 network problem (retry).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const VAULT = process.env.VAULT ?? path.join(os.homedir(), 'Dropbox/membrain');
const BLOG = path.join(VAULT, 'blog');
const BLOG_ASSETS = path.join(BLOG, 'assets');
const POSTS_OUT = path.join(REPO, 'src/content/posts');
const ASSETS_OUT = path.join(REPO, 'public/assets/posts');
const URL_PREFIX = '/assets/posts/';
const OUT_PATHS = ['src/content/posts', 'public/assets/posts'];
const DRY_RUN = process.argv.includes('--dry-run');

class TempFail extends Error {}

const log = (msg) => console.log(`[sync-vault] ${msg}`);

function notify(msg) {
	try {
		execFileSync('notify-send', ['-u', 'critical', 'Blog sync failed', msg], { stdio: 'ignore' });
	} catch {
		// No desktop session; the journal still has the error.
	}
}

function git(...args) {
	return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
}

/** Push and pull through the gh CLI login, without changing git config. */
function gitRemote(...args) {
	try {
		execFileSync(
			'git',
			['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', ...args],
			{ cwd: REPO, stdio: 'inherit' },
		);
	} catch {
		throw new TempFail(`git ${args[0]} failed`);
	}
}

function walk(dir, skip = () => false) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.')) continue;
		const full = path.join(dir, entry.name);
		if (skip(full)) continue;
		if (entry.isDirectory()) out.push(...walk(full, skip));
		else out.push(full);
	}
	return out;
}

const isInside = (file, dir) => {
	const rel = path.relative(dir, file);
	return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};

const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

/** Find the vault file an image link points at, the way Obsidian would. */
function resolveImage(target, postFile) {
	let t = target.replace(/^<|>$/g, '');
	try {
		t = decodeURIComponent(t);
	} catch {}
	if (t.startsWith(URL_PREFIX)) t = path.join('blog/assets', t.slice(URL_PREFIX.length));

	const candidates = [path.resolve(path.dirname(postFile), t), path.resolve(VAULT, t.replace(/^\/+/, ''))];
	const found = candidates.find(isFile);
	if (found) return found;

	// Bare names like ![[image.png]]: look for the name under blog/assets.
	if (!t.includes('/') && fs.existsSync(BLOG_ASSETS)) {
		return walk(BLOG_ASSETS).find((f) => path.basename(f) === t) ?? null;
	}
	return null;
}

/** Rewrite image links in one post body to /assets/posts/... URLs. */
function rewriteImages(body, postFile, errors) {
	const name = path.relative(BLOG, postFile);

	const toUrl = (target) => {
		if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) return null; // external or anchor
		const file = resolveImage(target, postFile);
		if (!file) {
			errors.push(`${name}: image not found: ${target}`);
			return null;
		}
		if (!isInside(file, BLOG_ASSETS)) {
			errors.push(`${name}: image ${path.relative(VAULT, file)} is outside blog/assets, move it there`);
			return null;
		}
		return URL_PREFIX + path.relative(BLOG_ASSETS, file).split(path.sep).map(encodeURIComponent).join('/');
	};

	const rewrite = (text) =>
		text
			// ![[image.png]], ![[image.png|alt]], ![[image.png|300]]
			.replace(/!\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (whole, target, alias = '') => {
				const url = toUrl(target.trim());
				if (!url) return whole;
				const alt = /^\d+(x\d+)?$/.test(alias.trim()) ? '' : alias.trim();
				return `![${alt}](${url})`;
			})
			// ![alt](path "title")
			.replace(/(!\[[^\]]*\]\()\s*(<[^>]+>|[^)\s]+)((?:\s+"[^"]*")?\s*\))/g, (whole, start, target, end) => {
				const url = toUrl(target);
				return url ? `${start}${url}${end}` : whole;
			})
			// <img src="path">
			.replace(/(<img\b[^>]*?\bsrc=)(["'])(.*?)\2/g, (whole, start, quote, target) => {
				const url = toUrl(target);
				return url ? `${start}${quote}${url}${quote}` : whole;
			});

	// Leave fenced code blocks alone; odd pieces of the split are the fences.
	return body
		.split(/(^```[\s\S]*?^```)/m)
		.map((piece, i) => (i % 2 ? piece : rewrite(piece)))
		.join('');
}

function collectPosts(errors) {
	const posts = [];
	const files = walk(BLOG, (f) => f === BLOG_ASSETS).filter((f) => f.endsWith('.md'));
	for (const file of files) {
		const text = fs.readFileSync(file, 'utf8');
		const name = path.relative(BLOG, file);
		const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!fm) {
			log(`skip ${name} (no frontmatter)`);
			continue;
		}
		if (/^draft:\s*true\s*$/m.test(fm[1])) {
			log(`skip ${name} (draft)`);
			continue;
		}
		posts.push({ name, text: rewriteImages(text, file, errors) });
	}
	return posts;
}

function main() {
	if (!fs.existsSync(BLOG)) throw new Error(`vault blog folder not found: ${BLOG}`);
	// Guard against an unmounted or half-synced Dropbox wiping the site.
	if (!walk(BLOG, (f) => f === BLOG_ASSETS).some((f) => f.endsWith('.md'))) {
		throw new Error(`no posts in ${BLOG}, refusing to delete every post`);
	}

	const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
	if (branch !== 'main') throw new Error(`repo is on branch ${branch}, expected main`);
	if (!DRY_RUN) gitRemote('pull', '--rebase', '--autostash', 'origin', 'main');

	const errors = [];
	const posts = collectPosts(errors);
	if (errors.length) throw new Error(errors.join('\n'));

	fs.rmSync(POSTS_OUT, { recursive: true, force: true });
	fs.rmSync(ASSETS_OUT, { recursive: true, force: true });
	for (const { name, text } of posts) {
		const out = path.join(POSTS_OUT, name);
		fs.mkdirSync(path.dirname(out), { recursive: true });
		fs.writeFileSync(out, text);
	}
	if (fs.existsSync(BLOG_ASSETS)) fs.cpSync(BLOG_ASSETS, ASSETS_OUT, { recursive: true });
	log(`${posts.length} posts written`);

	const changes = git('status', '--porcelain', '--untracked-files=all', '--', ...OUT_PATHS);
	if (!changes) {
		log('site already up to date');
		return;
	}
	log(`changes:\n${changes}`);

	try {
		execFileSync('npm', ['run', 'build'], { cwd: REPO, stdio: 'inherit' });
	} catch {
		throw new Error('site build failed, nothing was pushed (see `journalctl --user -u blog-sync`)');
	}

	if (DRY_RUN) {
		log('dry run: not committing');
		return;
	}
	git('add', '-A', '--', ...OUT_PATHS);
	git('commit', '-m', `Sync blog from Obsidian vault\n\n${changes}`, '--', ...OUT_PATHS);
	gitRemote('push', 'origin', 'HEAD:main');
	log('pushed');
}

try {
	main();
} catch (err) {
	console.error(`[sync-vault] ${err.message}`);
	if (err instanceof TempFail) process.exit(75);
	notify(err.message);
	process.exit(1);
}
