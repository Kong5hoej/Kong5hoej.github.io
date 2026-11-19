import { useLayoutEffect } from "react";

// The site and Pixel Town have stylesheets that would fight each other (both
// style <body>), so each part of the app adds its own while it's on screen.
// Layout effects run before the browser paints, so nothing flashes unstyled
// when moving between them.
export function useStylesheet(css: string) {
  useLayoutEffect(() => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.append(el);
    return () => el.remove();
  }, [css]);
}
