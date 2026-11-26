# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Professional evaluators:** research PIs, labs, recruiters, and internship/fellowship reviewers deciding whether Hendry is worth a conversation. They arrive from a link on an application, email, or profile and skim quickly.
- **Fellow nerds:** the Linux / tilde / CTF / ham radio / Hacker News crowd who come for writeups and posts, often landing directly on a single post.

Friends (and Hendry, as a personal log) read it too, but design decisions serve the two audiences above.

## Product Purpose

internetguy.dev is Hendry Xu's (justanotherinternetguy / nyaarch) personal site and blog. A visit succeeds when the visitor comes away crediting Hendry: the research, awards, and work are clear and verifiable first; the writing (CTF writeups, general posts, hiking adventures, a daily log) supports that picture and gives nerds a reason to stay.

## Positioning

A personal-web site written entirely by a human, in the author's own lowercase voice, that doubles as a credible record of real research (speech/linguistics + deep learning, world models) and real competition results — not a templated portfolio.

## Operating Context

- Static Astro site deployed to `internetguy.dev` via GitHub Actions (`.github/workflows/deploy.yml`, `public/CNAME`).
- Content lives in Markdown collections: `src/content/posts` (tagged `cyber`, `general`, `adventure`) and `src/content/daily`. `src/content/secret` exists but is not routed.
- Routes: `/` (bio + post columns), `/posts.html`, `/daily.html`, `/quotes.html` (data in `src/data/quotes.ts`), `/posts/<slug>.html`, `/daily/<id>.html`.

## Capabilities and Constraints

- `build.format: 'file'` keeps `/posts/<slug>.html` and `/daily/<id>.html` URLs; these existing URLs must keep working.
- `compressHTML: false` is deliberate (compression glued inline words together).
- A motion toggle (persisted in `localStorage`, applied before first paint) lets visitors turn animations off.
- Adding new post tags requires updating the zod enum in `src/content.config.ts`.
- Speed: CSS is inlined into each page (`build.inlineStylesheets: 'always'`), so page-only styles live in their own files under `src/styles/` and are imported by the page that needs them; keep `global.css` and `skins.css` to what every page uses. Links prefetch on hover. The YouTube player (over 1 MB) only loads once the music bar is on screen or touched.
- Post images in `public/assets/posts` are served as resized WebP copies made at build time by `scripts/post-images.mjs`; the originals (synced from the vault) are never modified.

## Brand Commitments

- **Voice:** lowercase, casual, first-person. Keep it.
- **Human-written only:** no LLM-written prose on the site. Design and code work must never rewrite, add, or "improve" Hendry's copy; ask before touching any words.
- **Personal-computer feel:** the site is a customized personal interface, not a templated portfolio. As of 2026-09-29 this is a Serial Experiments Lain / Navi terminal look (requested by Hendry), replacing the earlier space-GIF glassmorphism; the old GIFs stay in `public/` unreferenced. As of 2026-11-25 (also requested by Hendry) every window uses a frutiger aero glass skin (`aero`, the default in `src/components/Window.astro`, styled in `src/styles/skins.css`) painted over that terminal base. Retro-web and glitchcore skins were tried the same day and removed at Hendry's request; don't bring them back unasked. The drifting gas background must look exactly as committed (Hendry reverted two attempts to change it): its CSS in `global.css` is untouched, and `Layout.astro` swaps in a canvas copy that only the compositor moves. It is pixel-identical at whole-number display scales in Chromium and Firefox; at fractional scales 1.4-2.7% of dots land on the neighbouring pixel, about as much as the CSS version already differs between those two browsers. Never replace it with a plain moving `div`; that visibly blinks at fractional display scaling (see the note in `skins.css`). Nav tabs stay the one accent blue. Looping animations there must stay transform/opacity-only and stepped on the shared clock described at the top of `skins.css`, so they add no screen redraws beyond the background's own.
- Handles: justanotherinternetguy, nyaarch, gentoouinely, internetguy. Links: GitHub, Mastodon (`rel="me"`), Discord `@justanotherinternetguy`.

## Evidence on Hand

Real, linkable facts currently on the home page (`src/pages/index.astro`):

- Cornell University freshman, CS / mathematics / linguistics; Milstein Program researcher.
- IEEE publication on end-to-end speech conversion.
- ISEF 2025 — 1st place, CBIO (StutterZero); ISEF 2026 — 3rd place, SFTD + AAAI award (Terraformer).
- Work at Sync Labs (internship) and FluencyAI.
- Co-founder/maintainer of tilde@Cornell; CTFs with squid proxy lovers and Cornell Cybersec; ham Technician license; Wikipedia editor.
- ~16 published posts and a daily log.

No testimonials, press, metrics, or images of projects exist; do not fabricate any.

## Product Principles

1. **Credibility is earned by specifics.** Real names, results, and links do the persuading; never pad with generic claims.
2. **The author's words, untouched.** Structure and presentation can change; the prose cannot without asking.
3. **Personality is not optional.** The personal-interface character is the brand, and it must coexist with a fast skim for evaluators.
4. **Posts are first-class entry points.** Many visitors land on a single post; every post page should orient them to who wrote it.
5. **Don't break the web.** Existing URLs stay stable.

## Accessibility & Inclusion

Motion must remain user-controllable (existing motion toggle); animated backgrounds should respect it.
