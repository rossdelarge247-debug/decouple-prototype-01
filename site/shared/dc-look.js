/* Decouple · the site-wide look (Site settings › Look and feel). Loaded in <head> by the guide (M02) and the help page (M03), before anything paints.
   Sets <html data-site-theme>, which beats the page's own Tweaks choice. Empty means "as designed": the page uses its Tweaks choice.
   On decouple.uk this file is never served: /api/look sends a two-line version with the live setting in it (spec §4 and §7).
   Here it's a preview: this browser's Site settings (decouple.site.v1.theme). ?theme= in the link wins in both. */
(function () {
  var OK = ["studio", "flat", "lilac", "field", "service"], t = null;
  try { t = new URLSearchParams(location.search).get("theme"); } catch (e) {}
  if (OK.indexOf(t) < 0) { try { t = (JSON.parse(localStorage.getItem("decouple.site.v1")) || {}).theme; } catch (e) { t = null; } }
  if (OK.indexOf(t) >= 0) document.documentElement.setAttribute("data-site-theme", t);
})();
