/* The site-wide look (spec §4, §7 /api/look): the one-line script the guide and the help page load in
   <head> at /shared/dc-look.js, before they paint. ?theme= in the page's link wins; otherwise the
   setting, or nothing at all for "page", which leaves each page its own look. */
import type { Theme } from './settings.js'

/** the address the pages load; /api/look answers it, and the design project's preview file is never served */
export const LOOK_PATH = '/shared/dc-look.js'

export function lookScript(theme: Theme | null | undefined): string {
  const T = theme && theme !== 'page' ? JSON.stringify(theme) : 'null'
  return `(function(){var O=["studio","flat","lilac","field","service"],t=null;try{t=new URLSearchParams(location.search).get("theme")}catch(e){}if(O.indexOf(t)<0)t=${T};if(O.indexOf(t)>=0)document.documentElement.setAttribute("data-site-theme",t)})();`
}
