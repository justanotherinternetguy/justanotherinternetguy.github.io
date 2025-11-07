(function () {
  async function getResourceSizeViaFetch(url) {
    try {
      const head = await fetch(url, { method: "HEAD", mode: "cors" });
      if (head.ok) {
        const cl = head.headers.get("content-length");
        if (cl) return parseInt(cl, 10);
      }
    } catch {}
    try {
      const res = await fetch(url, { mode: "cors" });
      if (res.ok) {
        const cl = res.headers.get("content-length");
        if (cl) return parseInt(cl, 10);
        const buf = await res.arrayBuffer();
        return buf.byteLength;
      }
    } catch {}
    return null;
  }

  function human(n) {
    if (!n) return "unknown";
    const units = ["B", "KB", "MB"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return n.toFixed(2) + " " + units[i];
  }

  async function measureSiteSize() {
    const el = document.getElementById("site-size-display");
    const nav = performance.getEntriesByType("navigation")[0];
    let total = nav?.transferSize || 0;

    const resources = performance.getEntriesByType("resource");
    for (const r of resources) {
      total +=
        r.transferSize ||
        r.encodedBodySize ||
        (await getResourceSizeViaFetch(r.name)) ||
        0;
    }

    el.textContent = `Total size: ${human(total)}`;
  }

  if (document.readyState === "complete") setTimeout(measureSiteSize, 500);
  else window.addEventListener("load", () => setTimeout(measureSiteSize, 500));
})();
