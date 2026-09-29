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
- Routes: `/` (bio + post columns), `/posts.html`, `/daily.html`, `/posts/<slug>.html`, `/daily/<id>.html`.

## Capabilities and Constraints

- `build.format: 'file'` keeps `/posts/<slug>.html` and `/daily/<id>.html` URLs; these existing URLs must keep working.
- `compressHTML: false` is deliberate (compression glued inline words together).
- A motion toggle (persisted in `localStorage`, applied before first paint) lets visitors turn animations off.
- Adding new post tags requires updating the zod enum in `src/content.config.ts`.

## Brand Commitments

- **Voice:** lowercase, casual, first-person. Keep it.
- **Human-written only:** no LLM-written prose on the site. Design and code work must never rewrite, add, or "improve" Hendry's copy; ask before touching any words.
- **Old-web / space vibe:** the space GIF backgrounds (`public/spacebackground.gif`, `space_bg.gif`, `space_bg2.gif`), the pane layout, and the personal-web feel are part of the identity.
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
3. **Personality is not optional.** The old-web character is the brand, and it must coexist with a fast skim for evaluators.
4. **Posts are first-class entry points.** Many visitors land on a single post; every post page should orient them to who wrote it.
5. **Don't break the web.** Existing URLs stay stable.

## Accessibility & Inclusion

Motion must remain user-controllable (existing motion toggle); animated backgrounds should respect it.
