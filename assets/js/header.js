/* ==========================================================================
   Header behaviour
   1. Draws the red line under the header once the page is scrolled.
   2. Opens and closes the mobile menu (keyboard and screen-reader friendly).
   ========================================================================== */
(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  if (!header) return;

  /* ---- 1. Scrolled state ---------------------------------------------- */
  var ticking = false;

  function updateScrolled() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScrolled);
      }
    },
    { passive: true }
  );
  updateScrolled();

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
