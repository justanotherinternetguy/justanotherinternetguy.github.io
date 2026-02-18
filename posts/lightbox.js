document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  if (lightbox && lightboxImg) {
    document
      .querySelectorAll(".gum-table img, .blog-post img")
      .forEach((img) => {
        img.addEventListener("click", () => {
          lightboxImg.src = img.src;
          lightbox.classList.remove("hidden");
        });
      });

    lightbox.addEventListener("click", (e) => {
      if (e.target !== lightboxImg) {
        lightbox.classList.add("hidden");
        lightboxImg.src = "";
      }
    });
  }
});
