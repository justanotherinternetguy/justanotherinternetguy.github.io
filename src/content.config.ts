import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		tags: z.array(z.enum(['cyber', 'general', 'adventure', 'cornell'])),
	}),
});

/**
 * Work out a daily post's date and title from its filename, so the file
 * needs no frontmatter. Accepted names:
 *   2026-10-20.md  exact date
 *   10-20.md       year is the most recent one where that day isn't in the future
 */
function dailyMeta(id: string) {
	const name = id.split('/').pop()!;
	const match = name.match(/^(?:(\d{4})-)?(\d{1,2})-(\d{1,2})$/);
	if (!match) {
		throw new Error(`Daily post "${id}" must be named MM-DD.md or YYYY-MM-DD.md`);
	}
	const [, y, m, d] = match;
	const month = Number(m);
	const day = Number(d);

	let year: number;
	if (y) {
		year = Number(y);
	} else {
		// Allow a day of slack so a post isn't pushed back a year by timezone differences.
		const now = Date.now() + 24 * 60 * 60 * 1000;
		year = new Date().getUTCFullYear();
		if (Date.UTC(year, month - 1, day) > now) year -= 1;
	}

	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		throw new Error(`Daily post "${id}" has an invalid date in its filename`);
	}
	return { title: name, date };
}

/** The glob loader, with title and date filled in from each filename. */
function dailyLoader(): Loader {
	const base = glob({ pattern: '**/*.md', base: './src/content/daily' });
	return {
		name: 'daily-loader',
		load: (ctx) =>
			base.load({
				...ctx,
				parseData: (props) =>
					ctx.parseData({ ...props, data: { ...props.data, ...dailyMeta(props.id) } }),
			}),
	};
}

const daily = defineCollection({
	loader: dailyLoader(),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
	}),
});

export const collections = { posts, daily };
