/* ==========================================================================
   Before / after slider
   Moves the dividing line as the (invisible) range input changes.
   Works with mouse, touch and the keyboard arrow keys.
   ========================================================================== */
(function () {
  "use strict";

  var sliders = document.querySelectorAll("[data-ba]");

  Array.prototype.forEach.call(sliders, function (slider) {
    var range = slider.querySelector(".ba__range");
    if (!range) return;

    function update() {
      slider.style.setProperty("--pos", range.value + "%");
      range.setAttribute("aria-valuetext", "Avant " + range.value + " %, après " + (100 - range.value) + " %");
    }

    range.addEventListener("input", update);
    update();
  });
})();
