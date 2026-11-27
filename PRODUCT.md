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
- Speed: CSS is inlined into each page (`build.inlineStylesheets: 'always'`), so page-only styles live in their own files under `src/styles/` and are imported by the page that needs them; keep `global.css` to what every page uses. Links prefetch on hover. The YouTube player (over 1 MB) only loads once the music bar is on screen or touched.
- Post images in `public/assets/posts` are served as resized WebP copies made at build time by `scripts/post-images.mjs`; the originals (synced from the vault) are never modified.

## Brand Commitments

- **Voice:** lowercase, casual, first-person. Keep it.
- **Human-written only:** no LLM-written prose on the site. Design and code work must never rewrite, add, or "improve" Hendry's copy; ask before touching any words.
- **Personal-computer feel:** the site is a customized personal interface, not a templated portfolio. As of 2026-11-27 (requested by Hendry) it follows the Windows XP Visual Guidelines (2001, https://aresluna.org/ui-style-guides/Windows/Windows%20XP%20Visual%20Guidelines%20(2001)/default.htm) in the default blue scheme: every page is one Explorer window (`src/layouts/Layout.astro`) with a task pane of task boxes (`TaskBox.astro`), content groups (`Window.astro`), a status bar, a taskbar and a Start menu; the music player is a tool-palette window. Colours and metrics come from the guide's own values or are sampled from its screenshots; icons are original SVGs drawn to the guide's icon rules (`Icons.astro`), with no Windows flag. Type is Tahoma (Wine's LGPL copy as the webfont), Trebuchet MS for title bars, Verdana for the tool palette, and Libre Franklin standing in for Franklin Gothic Medium. This replaced the Lain/navi terminal base, the frutiger aero skin and the drifting gas background (their assets stay in `public/` unreferenced). Looping animations are limited to the music player's meter while a song plays; the tray clock redraws once a minute.
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
