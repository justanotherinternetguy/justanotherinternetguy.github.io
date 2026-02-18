document.addEventListener("DOMContentLoaded", async () => {
  const navPlaceholder = document.getElementById("nav-placeholder");
  if (!navPlaceholder) return;

  try {
    const response = await fetch("/nav.html");
    if (!response.ok) throw new Error("Failed to load nav");
    const html = await response.text();
    navPlaceholder.outerHTML = html;
  } catch (error) {
    console.error("Error loading navigation:", error);
    // Fallback navigation if fetch fails
    navPlaceholder.outerHTML = `
      <nav class="glass">
        <a href="/" class="nav-brand">~/</a>
        <ul class="nav-links">
          <li><a href="/" class="non-dropdown">home</a></li>
          <li><a href="blog.html" class="non-dropdown">blog</a></li>
        </ul>
      </nav>
    `;
  }
});
