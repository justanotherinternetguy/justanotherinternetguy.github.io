const navLinks = document.querySelector(".nav-links");
const dropdowns = document.querySelectorAll(".dropdown");
let isAnimating = false;

function closeAllDropdowns() {
  dropdowns.forEach((dropdown) => {
    const menu = dropdown.querySelector(".dropdown-menu");
    menu.classList.remove("show");
    dropdown.classList.remove("active");
    dropdown.classList.remove("hidden");
    const items = menu.querySelectorAll("li");
    items.forEach((item) => {
      item.style.animation = "none";
    });
  });
  navLinks.style.transform = "translate(-50%, -50%)";
}

dropdowns.forEach((dropdown, index) => {
  const trigger = dropdown.querySelector("a");
  const menu = dropdown.querySelector(".dropdown-menu");

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAnimating) return;

    const isOpen = menu.classList.contains("show");

    if (isOpen) {
      isAnimating = true;
      navLinks.classList.remove("hide-non-dropdown");
      closeAllDropdowns();
      setTimeout(() => {
        isAnimating = false;
      }, 1200);
    } else {
      isAnimating = true;
      navLinks.classList.add("hide-non-dropdown");

      dropdowns.forEach((other) => {
        if (other !== dropdown) {
          const otherMenu = other.querySelector(".dropdown-menu");
          otherMenu.classList.remove("show");
          other.classList.remove("active");
          other.classList.add("hidden");
          const otherItems = otherMenu.querySelectorAll("li");
          otherItems.forEach((item) => {
            item.style.animation = "none";
          });
        }
      });

      menu.classList.add("show");
      dropdown.classList.add("active");

      requestAnimationFrame(() => {
        const dropdownRect = dropdown.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();

        const systemLeft = dropdownRect.left;
        const systemRight = menuRect.right;
        const systemWidth = systemRight - systemLeft;
        const systemCenter = systemLeft + systemWidth / 2;

        const viewportCenter = window.innerWidth / 2;

        const shiftAmount = viewportCenter - systemCenter;

        navLinks.style.transform = `translate(calc(-50% + ${shiftAmount}px), -50%)`;
      });

      const items = menu.querySelectorAll("li");
      items.forEach((item, i) => {
        item.style.animation = `slideInSubmenu 0.4s ease forwards ${i * 0.1}s`;
      });

      const submenuAnimationTime = 400 + items.length * 100;
      const totalAnimationTime = Math.max(1200, submenuAnimationTime);

      setTimeout(() => {
        isAnimating = false;
      }, totalAnimationTime);
    }
  });
});

document.addEventListener("click", (e) => {
  if (isAnimating) return;

  if (!navLinks.contains(e.target)) {
    isAnimating = true;
    closeAllDropdowns();
    navLinks.classList.remove("hide-non-dropdown");
    setTimeout(() => {
      isAnimating = false;
    }, 1200);
  }
});

const style = document.createElement("style");
style.textContent = `
  @keyframes slideInSubmenu {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
