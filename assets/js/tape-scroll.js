/* ==========================================================================
   Measuring-tape scrollbar
   Builds the tape, pulls it out (once, when the page opens) as far as the
   page is scrolled, then keeps it out and following the scroll. Mouse
   users can click or drag the tape to jump around the page.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var PULL_OUT = 520; // ms, matches the pull-out animation in the CSS

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

  // The sliding part: ruler markings and the metal tip.
  var body = document.createElement("div");
  body.className = "tape__body";

  var tip = document.createElement("div");
  tip.className = "tape__tip";

  body.appendChild(buildRuler("tape__ruler"));
  body.appendChild(tip);
  tape.appendChild(body);
  document.body.appendChild(tape);
  root.classList.add("has-tape");

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

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  // Page height changes as images and fonts load.
  if ("ResizeObserver" in window) {
    new ResizeObserver(requestUpdate).observe(document.body);
  }
  update();

  /* ---- Pull it out once, then follow the scroll closely --------------- */
  window.requestAnimationFrame(function () {
    tape.classList.add("is-visible");
    setTimeout(function () {
      tape.classList.add("is-following");
    }, PULL_OUT);
  });

  /* ---- Click / drag to jump ------------------------------------------- */
  // The tape's full height stands for the whole page.
  var dragging = false;

  function jumpTo(clientY) {
    var rect = tape.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    window.scrollTo({ top: ratio * maxScroll(), behavior: "instant" });
  }

  body.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;
    event.preventDefault();
    dragging = true;
    tape.classList.add("is-dragging");
    body.setPointerCapture(event.pointerId);
    jumpTo(event.clientY);
  });

  body.addEventListener("pointermove", function (event) {
    if (dragging) jumpTo(event.clientY);
  });

  function stopDragging() {
    dragging = false;
    tape.classList.remove("is-dragging");
  }

  body.addEventListener("pointerup", stopDragging);
  body.addEventListener("pointercancel", stopDragging);
})();
