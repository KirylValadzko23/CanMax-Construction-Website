/* ==========================================================================
   Header behaviour
   1. Fixes page links when the site is opened by double-clicking a file.
   2. Opens and closes the mobile menu (keyboard and screen-reader friendly).
   ========================================================================== */
(function () {
  "use strict";

  /* ---- 1. Opened from the computer (file://) -----------------------------
     Web servers turn "services/" into "services/index.html" automatically;
     a double-clicked file doesn't, and shows a folder listing instead.
     Only runs for file:// — no effect on the real website.               */
  if (window.location.protocol === "file:") {
    Array.prototype.forEach.call(document.querySelectorAll("a[href]"), function (link) {
      var href = link.getAttribute("href");
      if (/^(?:[a-z]+:|#|\/\/)/i.test(href)) return; // web links, tel:, #anchors
      // Split "folder/" from any "?filter" or "#section" that follows it.
      var parts = href.match(/^([^?#]*)(.*)$/);
      if (parts[1].slice(-1) === "/") {
        link.setAttribute("href", parts[1] + "index.html" + parts[2]);
      }
    });
  }

  var header = document.querySelector("[data-header]");
  if (!header) return;

  /* ---- 2. Mobile menu -------------------------------------------------- */
  var toggle = header.querySelector("[data-menu-toggle]");
  var menu = toggle && document.getElementById(toggle.getAttribute("aria-controls"));
  if (!menu) return;

  var label = toggle.querySelector("[data-menu-label]");
  var desktop = window.matchMedia("(min-width: 80rem)");

  function isOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  function openMenu() {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    label.textContent = "Fermer le menu";
    document.body.classList.add("menu-open");
    document.addEventListener("keydown", onKeydown);
    var firstLink = menu.querySelector("a[href]");
    if (firstLink) firstLink.focus();
  }

  function closeMenu(returnFocus) {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    label.textContent = "Ouvrir le menu";
    document.body.classList.remove("menu-open");
    document.removeEventListener("keydown", onKeydown);
    if (returnFocus) toggle.focus();
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      closeMenu(true);
      return;
    }
    if (event.key !== "Tab") return;

    // Keep keyboard focus inside the open menu (plus its close button).
    var focusable = [toggle].concat(
      Array.prototype.slice.call(menu.querySelectorAll("a[href], button:not([disabled])"))
    );
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener("click", function () {
    if (isOpen()) {
      closeMenu(false);
    } else {
      openMenu();
    }
  });

  // Picking a link closes the menu.
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu(false);
  });

  // If the window grows to desktop size, the panel is no longer needed.
  desktop.addEventListener("change", function (event) {
    if (event.matches && isOpen()) closeMenu(false);
  });
})();
