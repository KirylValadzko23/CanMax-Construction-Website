/* Marks the page as "JavaScript on" before it is drawn, so the CSS can
   use the menu, gallery and tape versions made for it. Kept in its own file
   (not written inside the pages) because the site's security rules
   (_headers) only allow scripts that come from the site's own files. */
document.documentElement.className = "js";
