/* ==========================================================================
   Form checks (shared by every form marked data-form)
   - Required fields, email and phone format, with French messages
     shown under each field (screen-reader friendly).
   - Groups marked data-one-of="a b" need at least one of those fields
     (e.g. a CV link OR a CV file).
   - File size/type limits, file name preview, link clean-up.
   If everything is fine, the form is sent normally.
   ========================================================================== */
(function () {
  "use strict";

  var MESSAGES = {
    required: "Ce champ est obligatoire.",
    email: "Entrez une adresse courriel valide (ex. : nom@exemple.com).",
    tel: "Entrez un numéro de téléphone valide (10 chiffres).",
    url: "Ce lien n'est pas valide. Vérifiez l'adresse (ex. : https://…).",
    oneOf: "Ajoutez un lien vers votre CV ou téléversez un fichier.",
    fileSize: "Le fichier dépasse la taille maximale de {mb} Mo.",
    fileType: "Format non accepté. Utilisez un fichier PDF, Word ou une image."
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-form]"), setUpForm);

  function setUpForm(form) {
    var submitted = false;

    /* ---- Show / clear an error ----------------------------------------- */
    function setError(target, errorEl, message) {
      if (!errorEl) return;
      var fields = target.matches("fieldset") ? target.querySelectorAll("input") : [target];
      Array.prototype.forEach.call(fields, function (f) {
        if (message) {
          f.setAttribute("aria-invalid", "true");
          f.setAttribute("aria-describedby", errorEl.id);
        } else {
          f.removeAttribute("aria-invalid");
          f.removeAttribute("aria-describedby");
        }
      });
      if (target.matches("fieldset")) target.classList.toggle("is-invalid", !!message);
      errorEl.textContent = message || "";
      errorEl.hidden = !message;
    }

    /* ---- Single field rules -------------------------------------------- */
    function checkField(input) {
      var value = input.value.trim();
      if (input.required && !value) {
        return input.getAttribute("data-required-message") || MESSAGES.required;
      }
      if (!value) return "";
      if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return MESSAGES.email;
      if (input.type === "tel" && value.replace(/\D/g, "").length < 10) return MESSAGES.tel;
      if (input.type === "url" && !input.validity.valid) return MESSAGES.url;
      if (input.type === "file") return checkFile(input);
      return "";
    }

    function checkFile(input) {
      var file = input.files && input.files[0];
      if (!file) return "";
      var maxMb = parseFloat(input.getAttribute("data-max-mb")) || 8;
      if (file.size > maxMb * 1024 * 1024) return MESSAGES.fileSize.replace("{mb}", maxMb);
      var accept = (input.getAttribute("accept") || "").toLowerCase().split(",");
      var ext = "." + file.name.split(".").pop().toLowerCase();
      if (accept[0] && accept.indexOf(ext) === -1) {
        return input.getAttribute("data-type-message") || MESSAGES.fileType;
      }
      return "";
    }

    /* ---- "At least one of" groups --------------------------------------- */
    function checkGroup(group) {
      var ids = group.getAttribute("data-one-of").split(" ");
      var inputs = ids.map(function (id) {
        return document.getElementById(id);
      });
      var filled = inputs.filter(function (i) {
        return i.type === "file" ? i.files && i.files.length : i.value.trim();
      });
      if (!filled.length) return MESSAGES.oneOf;
      for (var k = 0; k < filled.length; k++) {
        var message = checkField(filled[k]);
        if (message) return message;
      }
      return "";
    }

    /* ---- Check everything; returns the first problem element ------------ */
    function validate() {
      var firstInvalid = null;

      // Every field except those inside a "one of" group (checked below).
      var singles = Array.prototype.filter.call(
        form.querySelectorAll(".field input, .field select, .field textarea"),
        function (input) {
          return !input.closest("[data-one-of]");
        }
      );

      singles.forEach(function (input) {
        var message = checkField(input);
        setError(input, document.getElementById(input.id + "-erreur"), message);
        if (message && !firstInvalid) firstInvalid = input;
      });

      Array.prototype.forEach.call(form.querySelectorAll("[data-one-of]"), function (group) {
        var message = checkGroup(group);
        setError(group, document.getElementById(group.getAttribute("data-error-id")), message);
        if (message && !firstInvalid) firstInvalid = group.querySelector("input");
      });

      return firstInvalid;
    }

    /* ---- Helpers while typing ------------------------------------------ */
    // Add https:// to links typed without it (e.g. linkedin.com/in/…).
    Array.prototype.forEach.call(form.querySelectorAll('input[type="url"]'), function (input) {
      input.addEventListener("blur", function () {
        var v = input.value.trim();
        if (v && !/^https?:\/\//i.test(v)) input.value = "https://" + v;
        if (submitted) validate();
      });
    });

    // Show the chosen file's name next to the button.
    Array.prototype.forEach.call(form.querySelectorAll('input[type="file"]'), function (input) {
      var nameEl = input.parentElement.querySelector("[data-file-name]");
      var empty = nameEl ? nameEl.textContent : "";
      input.addEventListener("change", function () {
        if (nameEl) nameEl.textContent = input.files.length ? input.files[0].name : empty;
        if (submitted) validate();
      });
    });

    // After a first attempt, update messages live as people fix things.
    form.addEventListener("input", function () {
      if (submitted) validate();
    });

    /* ---- Submit -------------------------------------------------------- */
    form.addEventListener("submit", function (event) {
      submitted = true;

      // Spam trap filled in: silently drop.
      var trap = form.querySelector(".form__trap input");
      if (trap && trap.value) {
        event.preventDefault();
        return;
      }

      var firstInvalid = validate();
      if (firstInvalid) {
        event.preventDefault();
        firstInvalid.focus();
        return;
      }

      var button = form.querySelector('[type="submit"]');
      if (button) {
        button.dataset.label = button.textContent;
        button.disabled = true;
        button.textContent = "Envoi en cours…";
      }
    });

    // Coming back with the browser's Back button can restore the page as it
    // was, with the button still locked: unlock it so the form can be resent.
    window.addEventListener("pageshow", function (event) {
      var button = form.querySelector('[type="submit"]');
      if (event.persisted && button && button.disabled) {
        button.disabled = false;
        button.textContent = button.dataset.label || button.textContent;
      }
    });
  }
})();
