#!/usr/bin/env python3
"""Publish blog posts from the Obsidian vault into this site.

Source:  ~/Dropbox/membrain/blog/*.md       (posts; other subfolders are not published)
         ~/Dropbox/membrain/blog/daily/*.md (daily updates, named YYYY-MM-DD.md or MM-DD.md)
         ~/Dropbox/membrain/blog/assets/    (images, linked as assets/<post>/<file>)
Output:  src/content/posts/                 (mirrored, so deleted posts disappear)
         src/content/daily/
         public/assets/posts/

Daily updates need no frontmatter: the site takes the title and date from the
filename. `draft: true` still keeps one unpublished.

A post is skipped when:
  - its frontmatter has `draft: true` (the "draft" checkbox property in Obsidian)
  - it is missing title, date or tags, or uses a tag the site doesn't know

Image links are rewritten to site paths. Supported forms:
  ![alt](assets/post/img.png)   <img src="assets/post/img.png">   ![[Pasted image.png]]
Images outside blog/assets (e.g. Obsidian's pasted-image folder) are copied in
under the post's name. Wikilinks to other posts become links to their pages.

Usage: sync_blog.py [--no-push]
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path
from urllib.parse import quote, unquote

import yaml

REPO = Path(__file__).resolve().parents[2]
VAULT = Path(os.environ.get("VAULT", Path.home() / "Dropbox/membrain"))
BLOG = VAULT / "blog"
BLOG_ASSETS = BLOG / "assets"
DAILY = BLOG / "daily"
# Obsidian's attachment folder ("attachmentFolderPath" in .obsidian/app.json).
VAULT_ATTACHMENTS = VAULT / "assets"

POSTS_OUT = REPO / "src/content/posts"
DAILY_OUT = REPO / "src/content/daily"
# Must match dailyMeta() in src/content.config.ts, or the build fails.
DAILY_NAME = re.compile(r"^(?:\d{4}-)?\d{1,2}-\d{1,2}$")
ASSETS_OUT = REPO / "public/assets/posts"
ASSETS_URL = "/assets/posts"
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp"}


def log(msg):
    print(msg, flush=True)


def notify(title, body, urgent=False):
    log(f"{title}: {body}")
    try:
        subprocess.run(
            ["notify-send", "-a", "blog-sync", *(["-u", "critical"] if urgent else []), title, body],
            timeout=5, check=False,
        )
    except Exception:
        pass


def allowed_tags():
    """Read the tag enum from the posts schema so the two never drift apart."""
    src = (REPO / "src/content.config.ts").read_text()
    m = re.search(r"tags:\s*z\.array\(\s*z\.enum\(\s*\[([^\]]*)\]", src)
    return set(re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))) if m else None


def split_frontmatter(text):
    m = re.match(r"^---\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|$)", text, re.S)
    if not m:
        return None, text
    return m.group(1), text[m.end():]


def is_true(v):
    return v is True or (isinstance(v, str) and v.strip().lower() in {"true", "yes", "1"})


def slugify(name):
    """Approximate the id Astro's glob loader gives a file (github-slugger)."""
    s = unicodedata.normalize("NFKC", name).lower()
    s = re.sub(r"[^\w\- ]", "", s)
    return s.replace(" ", "-")


class Post:
    def __init__(self, path, fm, body, daily=False):
        self.path = path
        self.fm = fm
        self.body = body
        self.daily = daily
        self.slug = slugify(path.stem) if daily else str(fm.get("slug") or slugify(path.stem))
        self.url = f"/{'daily' if daily else 'posts'}/{self.slug}.html"


def load_posts(tags_ok):
    posts, skipped = [], []
    for path in sorted(BLOG.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        raw, body = split_frontmatter(text)
        try:
            fm = yaml.safe_load(raw) if raw else None
        except yaml.YAMLError as e:
            skipped.append((path.name, f"bad frontmatter: {e.__class__.__name__}"))
            continue
        if not isinstance(fm, dict):
            skipped.append((path.name, "no frontmatter"))
            continue
        if is_true(fm.get("draft")):
            log(f"draft, not published: {path.name}")
            continue
        missing = [k for k in ("title", "date", "tags") if not fm.get(k)]
        if missing:
            skipped.append((path.name, "missing " + ", ".join(missing)))
            continue
        tags = fm["tags"] if isinstance(fm["tags"], list) else [fm["tags"]]
        bad = [t for t in tags if tags_ok is not None and t not in tags_ok]
        if bad:
            skipped.append((path.name, f"unknown tag(s) {bad}; allowed: {sorted(tags_ok)}"))
            continue
        posts.append(Post(path, fm, body))
    return posts, skipped


def load_daily():
    posts, skipped = [], []
    for path in sorted(DAILY.glob("*.md")) if DAILY.is_dir() else []:
        raw, body = split_frontmatter(path.read_text(encoding="utf-8"))
        try:
            fm = (yaml.safe_load(raw) if raw else None) or {}
        except yaml.YAMLError as e:
            skipped.append((f"daily/{path.name}", f"bad frontmatter: {e.__class__.__name__}"))
            continue
        if not isinstance(fm, dict):
            fm = {}
        if is_true(fm.get("draft")):
            log(f"draft, not published: daily/{path.name}")
            continue
        if not DAILY_NAME.match(path.stem):
            skipped.append((f"daily/{path.name}", "name it YYYY-MM-DD.md or MM-DD.md"))
            continue
        posts.append(Post(path, fm, body, daily=True))
    return posts, skipped


class Renderer:
    def __init__(self, stage_assets, posts):
        self.stage_assets = stage_assets
        self.by_name = {}
        for p in posts:
            self.by_name[p.path.stem.lower()] = p
            self.by_name[p.path.name.lower()] = p
        self.missing = []

    def find_file(self, ref, post):
        ref = unquote(ref.split("#")[0].split("?")[0]).strip()
        if not ref:
            return None
        rel = ref.lstrip("/")
        for cand in (post.path.parent / ref, VAULT / rel, BLOG / rel, BLOG_ASSETS / rel):
            if cand.is_file():
                return cand.resolve()
        # Obsidian "shortest path" links are just a file name.
        name = Path(rel).name
        for root in (BLOG_ASSETS, VAULT_ATTACHMENTS, BLOG):
            if root.is_dir():
                hit = next((p for p in root.rglob(name) if p.is_file()), None)
                if hit:
                    return hit.resolve()
        return None

    def asset_url(self, ref, post):
        """Copy the referenced file into the staged assets and return its site URL."""
        if re.match(r"^[a-z][a-z0-9+.-]*:|^//|^#", ref, re.I) or ref.startswith(ASSETS_URL + "/"):
            return None  # external URL, anchor, or already a site path
        f = self.find_file(ref, post)
        if f is None:
            self.missing.append((post.path.name, ref))
            return None
        try:
            rel = f.relative_to(BLOG_ASSETS.resolve())
        except ValueError:
            rel = Path("daily" if post.daily else "", post.slug, f.name)
        dest = self.stage_assets / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dest)
        return ASSETS_URL + "/" + quote(rel.as_posix())

    def render_text(self, text, post):
        def wiki_embed(m):
            target, _, alt = m.group(1).partition("|")
            if Path(target).suffix.lower() not in IMAGE_EXT:
                return m.group(0)
            url = self.asset_url(target, post)
            if url is None:
                return m.group(0)
            if re.fullmatch(r"\d+(x\d+)?", alt.strip()):  # ![[img|300]] is a size, not alt text
                alt = ""
            return f"![{alt.strip()}]({url})"

        def md_image(m):
            alt, ref, title = m.group(1), m.group(2), m.group(3) or ""
            ref = ref[1:-1] if ref.startswith("<") and ref.endswith(">") else ref
            url = self.asset_url(ref, post)
            return m.group(0) if url is None else f"![{alt}]({url}{title})"

        def html_src(m):
            url = self.asset_url(m.group(2), post)
            return m.group(0) if url is None else f"{m.group(1)}{url}{m.group(3)}"

        def wiki_link(m):
            target, _, label = m.group(1).partition("|")
            page, _, heading = target.partition("#")
            other = self.by_name.get(page.strip().lower())
            text = label.strip() or page.strip()
            if other is None:
                return text
            return f"[{text}]({other.url})"

        text = re.sub(r"!\[\[([^\]]+)\]\](?!\()", wiki_embed, text)
        text = re.sub(r'!\[([^\]]*)\]\((<[^>]+>|[^)\s]+)(\s+"[^"]*")?\)', md_image, text)
        text = re.sub(r'(<img\b[^>]*?\bsrc=["\'])([^"\']+)(["\'])', html_src, text, flags=re.I)
        text = re.sub(r"(?<!!)\[\[([^\]]+)\]\](?!\()", wiki_link, text)
        return text

    def render(self, post):
        # Leave fenced and inline code untouched.
        parts = re.split(r"(^```.*?^```[^\n]*$|`[^`\n]+`)", post.body, flags=re.S | re.M)
        body = "".join(p if i % 2 else self.render_text(p, post) for i, p in enumerate(parts))
        raw, _ = split_frontmatter(post.path.read_text(encoding="utf-8"))
        return f"---\n{raw}\n---\n{body}" if raw else body


def mirror(src, dst):
    """Make dst an exact copy of src, touching only files that changed."""
    dst.mkdir(parents=True, exist_ok=True)
    want = {p.relative_to(src) for p in src.rglob("*") if p.is_file()}
    have = {p.relative_to(dst) for p in dst.rglob("*") if p.is_file() and p.name != ".gitkeep"}
    for rel in have - want:
        (dst / rel).unlink()
    for rel in want:
        s, d = src / rel, dst / rel
        if not d.is_file() or d.read_bytes() != s.read_bytes():
            d.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(s, d)
    for d in sorted((p for p in dst.rglob("*") if p.is_dir()), reverse=True):
        if not any(d.iterdir()):
            d.rmdir()


def git(*args, check=True):
    return subprocess.run(["git", "-C", str(REPO), *args], check=check, text=True, capture_output=True)


def main():
    push = "--no-push" not in sys.argv
    if not BLOG.is_dir():
        notify("Blog sync failed", f"{BLOG} not found", urgent=True)
        return 1

    posts, skipped = load_posts(allowed_tags())
    daily, daily_skipped = load_daily()
    skipped += daily_skipped
    with tempfile.TemporaryDirectory() as tmp:
        stage_posts, stage_daily, stage_assets = Path(tmp, "posts"), Path(tmp, "daily"), Path(tmp, "assets")
        for d in (stage_posts, stage_daily, stage_assets):
            d.mkdir()
        r = Renderer(stage_assets, posts + daily)
        for p in posts + daily:
            out = stage_daily if p.daily else stage_posts
            (out / p.path.name).write_text(r.render(p), encoding="utf-8")
        mirror(stage_posts, POSTS_OUT)
        mirror(stage_daily, DAILY_OUT)
        mirror(stage_assets, ASSETS_OUT)

    for name, why in skipped:
        notify("Blog post not published", f"{name}: {why}")
    for name, ref in r.missing:
        notify("Blog image not found", f"{name}: {ref}")

    paths = ["src/content/posts", "src/content/daily", "public/assets/posts"]
    git("add", "-A", "--", *paths)
    changed = git("diff", "--cached", "--name-status", "--", *paths).stdout.strip()
    if not changed:
        unpushed = git("rev-list", "--count", "origin/main..HEAD", check=False).stdout.strip()
        if push and unpushed not in ("", "0"):
            log(f"no changes, retrying push of {unpushed} commit(s)")
            return push_main("earlier changes")
        log("no changes")
        return 0
    log("changes:\n" + changed)

    build = subprocess.run(["npm", "run", "build"], cwd=REPO, text=True, capture_output=True)
    if build.returncode != 0:
        tail = "\n".join((build.stdout + build.stderr).strip().splitlines()[-15:])
        notify("Blog build failed, not published", tail, urgent=True)
        return 1

    if not push:
        log("build ok; --no-push given, leaving changes staged")
        return 0

    names = sorted({Path(line.split("\t")[-1]).stem for line in changed.splitlines()
                    if line.split("\t")[-1].startswith(("src/content/posts/", "src/content/daily/"))})
    summary = ", ".join(names) if names else "assets"
    git("commit", "-q", "-m", f"Sync blog from vault: {summary}", "--", *paths)
    return push_main(summary)


def push_main(summary):
    pull = git("pull", "-q", "--rebase", "--autostash", "origin", "main", check=False)
    res = git("push", "-q", "origin", "main", check=False) if pull.returncode == 0 else pull
    if res.returncode != 0:
        notify("Blog push failed", "Committed locally; will retry on next sync.\n" + res.stderr.strip(), urgent=True)
        return 1
    notify("Blog published", summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
