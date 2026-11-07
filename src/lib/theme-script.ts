export const THEME_KEY = "theme";
export const THEME_EVENT = "themechange";

/** Runs before paint (inlined in layout.tsx) so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t}catch(e){}})();`;
