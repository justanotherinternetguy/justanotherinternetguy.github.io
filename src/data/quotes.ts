// Quotes for /quotes.html, listed in the order they appear on the page.
//
// quotes.md is copied from the vault (blog/quotes.md) by
// scripts/vault-sync/sync_blog.py, so edit it there, not here.
// Each quote is a blockquote, optionally followed by an attribution line
// starting with "—", "–" or "--":
//
//   > Not all those who wander are lost.
//
//   — Bilbo Baggins
//
// Headings and %% Obsidian comments %% are ignored. Any other text is an
// error, so a quote missing its ">" fails the build instead of vanishing.
import source from './quotes.md?raw';

export interface Quote {
	text: string;
	by: string;
}

const ATTRIBUTION = /^(?:—|–|--?)\s*(.+)$/;

function parseQuotes(src: string): Quote[] {
	// Blank out frontmatter and %% comments, keeping line numbers intact.
	const blank = (s: string) => s.replace(/[^\n]/g, '');
	const text = src
		.replace(/\r\n?/g, '\n')
		.replace(/^---\n[\s\S]*?\n---[ \t]*(?=\n|$)/, blank)
		.replace(/%%[\s\S]*?%%/g, blank);

	const quotes: Quote[] = [];
	let block: string[] | null = null;
	let blockStart = 0;

	const endBlock = () => {
		if (!block) return;
		while (block.length && !block[block.length - 1].trim()) block.pop();
		// An attribution written inside the blockquote ("> — Name") also counts.
		const last = block.length > 1 ? block[block.length - 1].trim().match(ATTRIBUTION) : null;
		if (last) block.pop();
		const body = block.join('\n').trim();
		if (!body) throw new Error(`quotes.md line ${blockStart}: empty quote`);
		quotes.push({ text: body, by: last ? last[1].trim() : '' });
		block = null;
	};

	text.split('\n').forEach((line, i) => {
		const n = i + 1;
		const quoted = line.match(/^\s*>\s?(.*)$/);
		if (quoted) {
			if (!block) {
				block = [];
				blockStart = n;
			}
			block.push(quoted[1]);
			return;
		}
		endBlock();
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) return;

		const by = trimmed.match(ATTRIBUTION);
		const prev = quotes[quotes.length - 1];
		if (by && prev && !prev.by) {
			prev.by = by[1].trim();
			return;
		}
		throw new Error(
			by
				? `quotes.md line ${n}: attribution "${trimmed}" has no quote above it, or that quote already has one`
				: `quotes.md line ${n}: "${trimmed}" is not a quote; start quote lines with ">"`,
		);
	});
	endBlock();
	return quotes;
}

export const quotes: Quote[] = parseQuotes(source);
