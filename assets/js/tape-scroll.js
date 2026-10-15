/* ==========================================================================
   Measuring-tape scrollbar
   Builds the tape, keeps it in sync with the scroll position, and lets
   mouse users click or drag it to jump around the page.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

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

  var cursor = document.createElement("div");
  cursor.className = "tape__cursor";
  var readout = document.createElement("span");
  readout.className = "tape__readout";
  cursor.appendChild(readout);

  tape.appendChild(buildRuler("tape__track"));
  tape.appendChild(buildRuler("tape__blade"));
  tape.appendChild(cursor);
  document.body.appendChild(tape);
  root.classList.add("has-tape");

  /* ---- Keep it in sync ------------------------------------------------ */
  function maxScroll() {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  }

  var ticking = false;
  var lastPercent = -1;

  function update() {
    ticking = false;
    var max = maxScroll();
    var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    tape.style.setProperty("--p", progress);

    var percent = Math.round(progress * 100);
    if (percent !== lastPercent) {
      readout.textContent = percent + " %"; // French style: 47 %
      lastPercent = percent;
    }
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

  /* ---- Click / drag to jump ------------------------------------------- */
  var dragging = false;

  function jumpTo(clientY) {
    var rect = tape.getBoundingClientRect();
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
  }

  tape.addEventListener("pointerup", stopDragging);
  tape.addEventListener("pointercancel", stopDragging);
})();
