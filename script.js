$(function () {
  let zIndexCounter = 1000;

  function bringToFront($window) {
    $window.css("z-index", ++zIndexCounter);
  }

  function initializeWindow($window) {
    $window.draggable({
      handle: ".title-bar",
      containment: "body",
      start: function () {
        bringToFront($(this));
        $(this).find("iframe").css("pointer-events", "none");
      },
      stop: function () {
        $(this).find("iframe").css("pointer-events", "auto");
      },
    });

    $window.on("resizestart", function () {
      $(this).find("iframe").css("pointer-events", "none");
    });

    $window.on("resizestop", function () {
      $(this).find("iframe").css("pointer-events", "auto");
    });

    $window.resizable({
      handles: "e, s, se",
      minHeight: 150,
      minWidth: 200,
      resize: function () {
        const $content = $(this).find(".window-content");
        const titleBarHeight = $(this).find(".title-bar").outerHeight();
        $content.height($(this).height() - titleBarHeight);
      },
    });

    $window.on("mousedown", function () {
      bringToFront($(this));
    });

    $window.find(".close-btn").on("click", function (e) {
      e.stopPropagation();
      $(this).closest(".window").addClass("rotclose");
      setTimeout(() => $(this).closest(".window").remove(), 800);
    });

    $window.find(".minimize-btn").on("click", function (e) {
      e.stopPropagation();
      const $win = $(this).closest(".window");
      const $content = $win.find(".window-content");

      if ($content.is(":visible")) {
        const currentHeight = $win.outerHeight();
        const titleBarHeight = $win.find(".title-bar").outerHeight();
        $win.data("prev-height", currentHeight);
        $content.slideUp(200, () =>
          $win.animate({ height: titleBarHeight }, 200)
        );
      } else {
        const prevHeight = $win.data("prev-height") || 300;
        $win.animate({ height: prevHeight }, 200, () =>
          $content.slideDown(200)
        );
      }
    });

    $window.find(".fullscreen-btn").on("click", function (e) {
      e.stopPropagation();
      const $win = $(this).closest(".window");

      if (!$win.hasClass("fullscreen")) {
        $win
          .data("prev-style", {
            top: $win.css("top"),
            left: $win.css("left"),
            width: $win.css("width"),
            height: $win.css("height"),
          })
          .addClass("fullscreen")
          .css({ top: 0, left: 0, width: "100vw", height: "100vh" });

        const titleBarHeight = $win.find(".title-bar").outerHeight();
        $win
          .find(".window-content")
          .height(`calc(100vh - ${titleBarHeight}px)`);
      } else {
        const prev = $win.data("prev-style");
        $win.removeClass("fullscreen").css(prev);
        const titleBarHeight = $win.find(".title-bar").outerHeight();
        $win
          .find(".window-content")
          .height(parseInt(prev.height) - titleBarHeight);
      }
    });
  }

  function createWindow(id, top, left, iframeSrc) {
    const $newWindow = $(`
      <div class="window" style="top: ${top}px; left: ${left}px" id="${id}">
        <span class="title-bar">
          ${id.replace("window", "Window ")}
          <button class="minimize-btn" title="Minimize">–</button>
          <button class="fullscreen-btn" title="Fullscreen">⛶</button>
          <button class="close-btn" title="Close">×</button>
        </span>
        <div class="window-content">
          <iframe src="${iframeSrc}" frameborder="0"></iframe>
        </div>
      </div>
    `).appendTo("body");

    initializeWindow($newWindow);
    bringToFront($newWindow);
  }

  $(".desktop-icon").on("click", function () {
    const id = $(this).data("window");
    const iframeSrc = $(this).data("src");
    const existingWindow = $(`#${id}`);

    if (existingWindow.length > 0) {
      bringToFront(existingWindow);
    } else {
      createWindow(id, 100, 300, iframeSrc);
    }
  });
});
