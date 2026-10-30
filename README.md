# internetguy.dev

## Writing posts

Posts live in the Obsidian vault at `~/Dropbox/membrain/blog/`, with images in
`blog/assets/`. Don't edit `src/content/posts/` or `public/assets/posts/` here;
`scripts/sync-vault.mjs` overwrites them.

A systemd user timer (`~/.config/systemd/user/blog-sync.timer`) runs the sync
every day: it copies posts and images in, rewrites image links, builds the
site, then commits and pushes. Posts without frontmatter or with `draft: true`
are skipped.

- Sync now: `systemctl --user start blog-sync`
- See logs: `journalctl --user -u blog-sync`
- Test without pushing: `node scripts/sync-vault.mjs --dry-run`

# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
