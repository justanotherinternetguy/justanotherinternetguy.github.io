export default {
  async fetch(request) {
    const acceptsMarkdown = (request.headers.get("Accept") ?? "").includes("text/markdown");
    const upstream = await fetch(request);
    const headers = new Headers(upstream.headers);
    headers.set("Link", '</about>; rel="service-doc"');

    const isHtml = (upstream.headers.get("Content-Type") ?? "").includes("text/html");
    if (!acceptsMarkdown || !isHtml) {
      return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
    }

    const markdown = await toMarkdown(upstream);
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.delete("Content-Encoding");
    headers.delete("Content-Length");
    headers.set("x-markdown-tokens", String(Math.ceil(markdown.length / 4)));
    return new Response(markdown, { status: upstream.status, statusText: upstream.statusText, headers });
  },
};

async function toMarkdown(response) {
  const rewriter = new HTMLRewriter()
    .on("script,style,head,nav,footer", { element: (el) => el.remove() })
    .on("h1", { element: (el) => { el.before("\n# "); el.after("\n"); } })
    .on("h2", { element: (el) => { el.before("\n## "); el.after("\n"); } })
    .on("h3", { element: (el) => { el.before("\n### "); el.after("\n"); } })
    .on("h4", { element: (el) => { el.before("\n#### "); el.after("\n"); } })
    .on("h5", { element: (el) => { el.before("\n##### "); el.after("\n"); } })
    .on("h6", { element: (el) => { el.before("\n###### "); el.after("\n"); } })
    .on("p,div,section,article", { element: (el) => el.after("\n") })
    .on("li", { element: (el) => { el.before("- "); el.after("\n"); } })
    .on("br", { element: (el) => el.before("\n") })
    .on("hr", { element: (el) => el.replaceWith("\n---\n") })
    .on("pre", { element: (el) => { el.before("\n```\n"); el.after("\n```\n"); } })
    .on("a[href]", {
      element(el) {
        el.before("[");
        el.after(`](${el.getAttribute("href") ?? ""})`);
      },
    });

  const raw = await rewriter.transform(response).text();

  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
