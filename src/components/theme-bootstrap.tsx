"use client";

/**
 * Reads the persisted theme/density from localStorage *before* React hydrates
 * the rest of the tree, to prevent a flash of dark/light mismatch.
 * Renders nothing.
 */
export function ThemeBootstrap() {
  const script = `(function(){try{var t=localStorage.getItem('pf-theme')||'dark';var d=localStorage.getItem('pf-density')||'compact';var r=document.documentElement;r.setAttribute('data-theme',t);r.setAttribute('data-density',d);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
