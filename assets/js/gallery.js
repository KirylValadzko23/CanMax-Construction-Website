/* ==========================================================================
   Gallery behaviour
   1. Filter buttons show/hide projects by sector (and count them).
   2. Clicking a project opens it full screen; arrows move between the
      projects currently shown by the filter.
   ========================================================================== */
(function () {
  "use strict";

  var gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  var projects = Array.prototype.slice.call(gallery.querySelectorAll("[data-category]"));
  var filters = Array.prototype.slice.call(gallery.querySelectorAll("[data-filter]"));
  var status = gallery.querySelector("[data-gallery-status]");

  /* ---- 1. Filters ------------------------------------------------------ */
  function matches(project, filter) {
    if (filter === "tous") return true;
    if (filter === "avant-apres") return project.hasAttribute("data-before-after");
    return project.getAttribute("data-category") === filter;
  }

  filters.forEach(function (button) {
    var filter = button.getAttribute("data-filter");
    var count = projects.filter(function (p) {
      return matches(p, filter);
    }).length;
    var countEl = button.querySelector(".filter__count");
    if (countEl) countEl.textContent = count;

    button.addEventListener("click", function () {
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === button));
      });
      projects.forEach(function (p) {
        p.hidden = !matches(p, filter);
      });
      if (status) {
        status.textContent = count + (count > 1 ? " projets affichés" : " projet affiché");
      }
    });
  });

  /* ---- 2. Photo viewer ------------------------------------------------- */
  var dialog = document.getElementById("visionneuse");
  if (!dialog || typeof dialog.showModal !== "function") return;

  var stage = dialog.querySelector("[data-lb-stage]");
  var counter = dialog.querySelector("[data-lb-count]");
  var category = dialog.querySelector("[data-lb-cat]");
  var title = dialog.querySelector("[data-lb-title]");
  var current = [];
  var index = 0;

  function openable() {
    return projects.filter(function (p) {
      return !p.hidden && p.querySelector("[data-lightbox]");
    });
  }

  function show(i) {
    index = (i + current.length) % current.length;
    var project = current[index];
    var media = project.querySelector(".project__media");
    var img = media.querySelector("img");

    stage.innerHTML = "";
    if (img) {
      var big = document.createElement("img");
      big.src = img.getAttribute("data-full") || img.src;
      big.alt = img.alt;
      stage.appendChild(big);
    } else {
      stage.appendChild(media.querySelector(".ph").cloneNode(true));
    }

    category.textContent = project.querySelector(".project__cat").textContent;
    title.textContent = project.querySelector(".project__title").textContent;
    counter.textContent = index + 1 + " / " + current.length;
  }

  gallery.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-lightbox]");
    if (!trigger) return;
    current = openable();
    show(current.indexOf(trigger.closest("[data-category]")));
    dialog.showModal();
  });

  dialog.querySelector("[data-lb-prev]").addEventListener("click", function () {
    show(index - 1);
  });
  dialog.querySelector("[data-lb-next]").addEventListener("click", function () {
    show(index + 1);
  });
  dialog.querySelector("[data-lb-close]").addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });

  // Clicking the dark area around the photo closes the viewer.
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
})();
