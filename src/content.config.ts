import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		tags: z.array(z.enum(['cyber', 'general', 'adventure'])),
	}),
});

const daily = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/daily' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
	}),
});

export const collections = { posts, daily };
