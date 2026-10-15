/* ==========================================================================
   Measuring-tape scrollbar
   Builds the tape, keeps it in sync with the scroll position, shows it
   only while scrolling (or when the mouse reaches the right edge), and
   lets mouse users click or drag it to jump around the page.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var HIDE_DELAY = 1200; // ms after scrolling stops before the tape hides
  var EDGE = 32; // px from the right edge of the window that reveals it

  /* ---- Build the tape ------------------------------------------------- */
  function buildRuler(className) {
    var layer = document.createElement("div");
    layer.className = className;

    var ticks = document.createElement("div");
    ticks.className = "tape__ticks";
    layer.appendChild(ticks);

    for (var n = 0; n <= 100; n += 10) {
      var label = document.createElement("span");
      label.className = "tape__label";
      label.style.setProperty("--at", n / 100);
      label.textContent = n;
      layer.appendChild(label);
    }
    return layer;
  }

  var tape = document.createElement("div");
  tape.className = "tape";
  // Purely visual: keyboard and screen-reader users scroll the page as usual.
  tape.setAttribute("aria-hidden", "true");

  // The sliding part: ruler layers, position marker and the metal tip.
  var body = document.createElement("div");
  body.className = "tape__body";

  var cursor = document.createElement("div");
  cursor.className = "tape__cursor";

  var tip = document.createElement("div");
  tip.className = "tape__tip";

  body.appendChild(buildRuler("tape__track"));
  body.appendChild(buildRuler("tape__blade"));
  body.appendChild(cursor);
  body.appendChild(tip);
  tape.appendChild(body);
  document.body.appendChild(tape);
  root.classList.add("has-tape");

  /* ---- Show / hide ---------------------------------------------------- */
  var hideTimer = null;
  var atEdge = false;
  var dragging = false;

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (!atEdge && !dragging) tape.classList.remove("is-visible");
    }, HIDE_DELAY);
  }

  function show() {
    tape.classList.add("is-visible");
    scheduleHide();
  }

  // Mouse near the right edge (or over the tape): keep it out.
  document.addEventListener(
    "mousemove",
    function (event) {
      var zone = Math.max(EDGE, tape.offsetWidth + 8);
      var near = event.clientX >= window.innerWidth - zone;
      if (near === atEdge) return;
      atEdge = near;
      if (near) {
        clearTimeout(hideTimer);
        tape.classList.add("is-visible");
      } else {
        scheduleHide();
      }
    },
    { passive: true }
  );

  // Mouse leaves the window: let the tape hide.
  root.addEventListener("mouseleave", function () {
    atEdge = false;
    scheduleHide();
  });

  /* ---- Keep it in sync ------------------------------------------------ */
  function maxScroll() {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  }

  var ticking = false;

  function update() {
    ticking = false;
    var max = maxScroll();
    var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    tape.style.setProperty("--p", progress);
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener(
    "scroll",
    function () {
      requestUpdate();
      show();
    },
    { passive: true }
  );
  window.addEventListener("resize", requestUpdate);
  // Page height changes as images and fonts load.
  if ("ResizeObserver" in window) {
    new ResizeObserver(requestUpdate).observe(document.body);
  }
  update();

  /* ---- Click / drag to jump ------------------------------------------- */
  function jumpTo(clientY) {
    var rect = body.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    window.scrollTo({ top: ratio * maxScroll(), behavior: "instant" });
  }

  tape.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;
    event.preventDefault();
    dragging = true;
    tape.classList.add("is-dragging");
    tape.setPointerCapture(event.pointerId);
    jumpTo(event.clientY);
  });

  tape.addEventListener("pointermove", function (event) {
    if (dragging) jumpTo(event.clientY);
  });

  function stopDragging() {
    dragging = false;
    tape.classList.remove("is-dragging");
    scheduleHide();
  }

  tape.addEventListener("pointerup", stopDragging);
  tape.addEventListener("pointercancel", stopDragging);
})();
