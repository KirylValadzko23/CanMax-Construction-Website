/* ==========================================================================
   Gallery behaviour
   1. Filter buttons show/hide projects by sector (and count them).
      Buttons with no matching projects are hidden.
   2. "Voir plus" reveals photos a page at a time (data-page-size).
   3. Clicking a project opens it full screen; arrows move between the
      projects currently shown.
   ========================================================================== */
(function () {
  "use strict";

  var gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  var projects = Array.prototype.slice.call(gallery.querySelectorAll("[data-category]"));
  var filters = Array.prototype.slice.call(gallery.querySelectorAll("[data-filter]"));
  var filterGroup = gallery.querySelector(".filters");
  var status = gallery.querySelector("[data-gallery-status]");
  var moreButton = gallery.querySelector("[data-more]");
  var moreCount = gallery.querySelector("[data-more-count]");
  var pageSize = parseInt(gallery.getAttribute("data-page-size"), 10) || Infinity;

  var currentFilter = "tous";
  var limit = pageSize;

  function matches(project, filter) {
    if (filter === "tous") return true;
    if (filter === "avant-apres") return project.hasAttribute("data-before-after");
    return project.getAttribute("data-category") === filter;
  }

  function matching(filter) {
    return projects.filter(function (p) {
      return matches(p, filter);
    });
  }

  /* ---- Show the right projects ----------------------------------------- */
  function render() {
    var list = matching(currentFilter);
    projects.forEach(function (p) {
      p.hidden = true;
    });
    list.forEach(function (p, i) {
      p.hidden = i >= limit;
    });

    var remaining = list.length - Math.min(limit, list.length);
    if (moreButton) {
      moreButton.hidden = remaining <= 0;
      if (moreCount) moreCount.textContent = "(" + remaining + ")";
    }
    return list.length;
  }

  /* ---- 1. Filters ------------------------------------------------------ */
  var visibleFilters = 0;
  filters.forEach(function (button) {
    var filter = button.getAttribute("data-filter");
    var count = matching(filter).length;
    var countEl = button.querySelector(".filter__count");
    if (countEl) countEl.textContent = count;

    // Hide sectors that have no projects yet (except "Tous").
    button.hidden = count === 0 && filter !== "tous";
    if (!button.hidden) visibleFilters++;

    button.addEventListener("click", function () {
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === button));
      });
      currentFilter = filter;
      limit = pageSize;
      var total = render();
      if (status) {
        status.textContent = total + (total > 1 ? " photos" : " photo");
      }
    });
  });

  // A lone "Tous" button is pointless, so hide the whole row.
  if (filterGroup && visibleFilters <= 1) filterGroup.hidden = true;

  /* ---- 2. Voir plus ------------------------------------------------------ */
  if (moreButton) {
    moreButton.addEventListener("click", function () {
      var firstNew = matching(currentFilter)[limit];
      limit += pageSize;
      render();
      // Move keyboard focus to the first newly shown photo.
      var focusTarget = firstNew && firstNew.querySelector("button, a, input");
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    });
  }

  render();

  /* ---- 3. Photo viewer ------------------------------------------------- */
  var dialog = document.getElementById("visionneuse");
  if (!dialog || typeof dialog.showModal !== "function") return;

  var stage = dialog.querySelector("[data-lb-stage]");
  var counter = dialog.querySelector("[data-lb-count]");
  var category = dialog.querySelector("[data-lb-cat]");
  var title = dialog.querySelector("[data-lb-title]");
  var current = [];
  var index = 0;

  // Filter names double as captions: data-category "cuisines" -> "Cuisines".
  var labels = {};
  filters.forEach(function (button) {
    var label = button.querySelector(".filter__label");
    if (label) labels[button.getAttribute("data-filter")] = label.textContent;
  });

  function openable() {
    return projects.filter(function (p) {
      return !p.hidden && p.querySelector("[data-lightbox]");
    });
  }

  function textOf(project, selector, fallback) {
    var el = project.querySelector(selector);
    return el ? el.textContent : fallback;
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

    category.textContent = textOf(
      project,
      ".project__cat",
      labels[project.getAttribute("data-category")] || "Nos réalisations"
    );
    title.textContent = textOf(project, ".project__title", "Canmax Construction");
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
