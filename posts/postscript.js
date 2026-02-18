const toc = document.getElementById("toc");
const headings = document.querySelectorAll("main article h1");

headings.forEach((h1, index) => {
  if (!h1.id) {
    h1.id =
      h1.textContent
        .toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/^-|-$/g, "") || `section-${index}`;
  }

  const li = document.createElement("li");
  const a = document.createElement("a");

  a.href = `#${h1.id}`;
  a.textContent = h1.textContent;

  li.appendChild(a);
  toc.appendChild(li);
});
