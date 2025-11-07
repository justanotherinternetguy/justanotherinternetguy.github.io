const btn = document.getElementById("stop-animations");
let animationsStopped = false;
let disableStyle;

btn.addEventListener("click", () => {
  if (!animationsStopped) {
    // Disable animations & transitions
    disableStyle = document.createElement("style");
    disableStyle.innerHTML = `
      * {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(disableStyle);

    // Freeze the animated background
    document.body.style.backgroundImage =
      "url('./assets/Background064_still.png')";

    // Update button
    btn.textContent = "▶ Resume Animations";
    animationsStopped = true;
  } else {
    // Restore animations
    if (disableStyle) disableStyle.remove();

    // Restore the animated background
    document.body.style.backgroundImage = "url('./assets/Background064.gif')";

    // Update button
    btn.textContent = "⏸ Stop Animations";
    animationsStopped = false;
  }
});
