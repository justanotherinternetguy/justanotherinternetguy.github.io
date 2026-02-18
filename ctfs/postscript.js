document.addEventListener("DOMContentLoaded", function () {
  const toc = document.getElementById("toc");
  const article = document.querySelector(".blog-post");

  if (!toc || !article) return;

  const headings = article.querySelectorAll("h1, h2");

  let tocHTML = "";
  let currentH1Item = null;

  headings.forEach((heading, index) => {
    if (heading.classList.contains("blog-header-title")) return;

    if (!heading.id) {
      heading.id = "heading-" + index;
    }

    const text = heading.textContent.trim();
    const level = heading.tagName.toLowerCase();

    if (level === "h1") {
      if (currentH1Item) {
        tocHTML += "</ul></li>";
      }

      tocHTML += `<li class="toc-h1"><a href="#${heading.id}">${text}</a>`;
      currentH1Item = true;
    } else if (level === "h2") {
      if (currentH1Item === true) {
        tocHTML += '<ul class="toc-nested">';
        currentH1Item = "has-nested";
      } else if (!currentH1Item) {
        tocHTML += `<li class="toc-h2"><a href="#${heading.id}">${text}</a></li>`;
        return;
      }

      tocHTML += `<li class="toc-h2"><a href="#${heading.id}">${text}</a></li>`;
    }
  });

  if (currentH1Item) {
    if (currentH1Item === "has-nested") {
      tocHTML += "</ul>";
    }
    tocHTML += "</li>";
  }

  toc.innerHTML = tocHTML;

  const tocLinks = toc.querySelectorAll("a");
  tocLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        history.pushState(null, null, "#" + targetId);
      }
    });
  });

  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -70% 0px",
    threshold: 0,
  };

  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        tocLinks.forEach((link) => link.classList.remove("active"));

        const activeLink = toc.querySelector(`a[href="#${entry.target.id}"]`);
        if (activeLink) {
          activeLink.classList.add("active");
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  headings.forEach((heading) => {
    if (heading.id && !heading.classList.contains("blog-header-title")) {
      observer.observe(heading);
    }
  });
});
