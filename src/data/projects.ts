// Projects shown on /projects.html, one window each, in this order.
// `blurb` is quoted verbatim from Hendry's own words (GitHub repo
// descriptions, ISEF titles, posts). Leave it out rather than invent one.

export const kinds = ['research', 'hackathon', 'other'] as const;
export type Kind = (typeof kinds)[number];

export interface Project {
	name: string;
	kind: Kind;
	/** Shown in a wider window. */
	featured?: boolean;
	year: string;
	blurb?: string;
	/** Award or result, shown highlighted. */
	award?: string;
	/** Where it was made or shown (event, club, course). */
	context?: string;
	links: { label: string; href: string }[];
}

export const projects: Project[] = [
	{
		name: 'StutterZero',
		kind: 'research',
		featured: true,
		year: '2025',
		blurb: 'end-to-end correction of stutters',
		award: '1st place, CBIO',
		context: 'ISEF 2025',
		links: [
			{ label: 'isef', href: 'https://isef.net/project/cbio057-stutterzero-end-to-end-correction-of-stutters' },
			{ label: 'ieee', href: 'https://ieeexplore.ieee.org/document/11288978' },
			{ label: 'github', href: 'https://github.com/justanotherinternetguy/StutterZero' },
		],
	},
	{
		name: 'TerraFormer',
		kind: 'research',
		featured: true,
		year: '2026',
		blurb: 'A Multimodal Latent World Model for Soil Dynamics',
		award: '3rd place, SFTD + AAAI award',
		context: 'ISEF 2026',
		links: [
			{ label: 'isef', href: 'https://isef.net/project/sftd041-terraformer-a-soil-world-model' },
			{ label: 'github', href: 'https://github.com/justanotherinternetguy/TerraFormer-A-Multimodal-Latent-World-Model-for-Soil-Dynamics' },
		],
	},
	{
		name: 'XSpeech',
		kind: 'research',
		year: '2025',
		blurb: 'A Novel Deep Learning Approach to Classifying Stutters',
		links: [{ label: 'github', href: 'https://github.com/justanotherinternetguy/XSpeech' }],
	},
	{
		name: 'HoloTouch',
		kind: 'hackathon',
		year: '2026',
		blurb: 'navigating human-computer interaction, reimagined',
		award: '1st overall',
		context: 'bigredhacks (cornell)',
		links: [
			{ label: 'devpost', href: 'https://devpost.com/software/holotouch' },
			{ label: 'github', href: 'https://github.com/justanotherinternetguy/HoloTouch' },
			{ label: 'post', href: '/posts/big-red-hacks-2026.html' },
		],
	},
	{
		name: 'sen_dex',
		kind: 'hackathon',
		year: '2025',
		award: '1st edtech',
		context: 'pennapps 2025 (upenn)',
		links: [{ label: 'devpost', href: 'https://devpost.com/software/sen_dex' }],
	},
	{
		name: 'Beehyv',
		kind: 'hackathon',
		year: '2026',
		award: "organizer's choice",
		context: 'lahacks 2026 (ucla)',
		links: [
			{ label: 'devpost', href: 'https://devpost.com/software/beehyv' },
			{ label: 'github', href: 'https://github.com/justanotherinternetguy/Beehyv' },
		],
	},
	{
		name: 'pip',
		kind: 'hackathon',
		year: '2026',
		blurb: 'an intelligent personal safety app (think: life360)',
		context: 'calhacks 2026',
		links: [
			{ label: 'devpost', href: 'https://devpost.com/software/pip-1a9w3t' },
			{ label: 'github', href: 'https://github.com/justanotherinternetguy/calhacks-pip' },
			{ label: 'post', href: '/posts/calhacks-2026.html' },
		],
	},
	{
		name: 'Ithaca',
		kind: 'hackathon',
		year: '2026',
		blurb: 'a more immersive homebuying experience',
		context: 'hackprinceton fall 2026',
		links: [
			{ label: 'devpost', href: 'https://devpost.com/software/ithaca-oiqtaz' },
			{ label: 'post', href: '/posts/hackprinceton-fall-2026.html' },
		],
	},
	{
		name: 'toyRNN',
		kind: 'other',
		year: '2026',
		blurb: 'an AI model exploitation challenge',
		context: 'Cybear Day 2026 (cornell cybersec)',
		links: [{ label: 'writeup', href: '/posts/toyRNN.html' }],
	},
	{
		name: 'tilde@Cornell',
		kind: 'other',
		year: '2026',
		blurb: "Cornell's student-run tildenet and Linux User's Group.",
		context: 'co-founder and maintainer',
		links: [{ label: 'site', href: 'https://cornelltilde.com/' }],
	},
	{
		name: 'Language-Design',
		kind: 'other',
		year: '2023',
		blurb: 'i try to make compilers for esolangs and make my own langs here :/',
		links: [{ label: 'github', href: 'https://github.com/justanotherinternetguy/Language-Design' }],
	},
	{
		name: 'Kilo-Jaig',
		kind: 'other',
		year: '2022',
		blurb: 'my implementation of the Kilo text editor in C',
		links: [{ label: 'github', href: 'https://github.com/justanotherinternetguy/Kilo-Jaig' }],
	},
];
