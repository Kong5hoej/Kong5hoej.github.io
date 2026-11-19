import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router";
import Layout from "./site/Layout.tsx";
import Home from "./site/pages/Home.tsx";
import Projects from "./site/pages/Projects.tsx";
import Experience from "./site/pages/Experience.tsx";
import Toolbox from "./site/pages/Toolbox.tsx";
import Contact from "./site/pages/Contact.tsx";
import Cv from "./site/pages/Cv.tsx";
import NotFound from "./site/pages/NotFound.tsx";
import { PAGES } from "./meta.ts";

// Links to the old site (projects.html, cv.html?view=all, play.html#map)
// keep working: they move to the new address, query and hash included.
function OldAddress() {
  const { pathname, search, hash } = useLocation();
  const to = pathname.replace(/(index)?\.html$/, "") || "/";
  return <Navigate to={{ pathname: to, search, hash }} replace />;
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "projects", element: <Projects /> },
      { path: "experience", element: <Experience /> },
      { path: "toolbox", element: <Toolbox /> },
      { path: "contact", element: <Contact /> },
      { path: "cv", element: <Cv /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  // Pixel Town is loaded only when someone goes there.
  { path: "play", lazy: async () => ({ Component: (await import("./game/Play.tsx")).default }) },
  ...["/index", ...Object.keys(PAGES).filter((p) => p !== "/")].map((p) => ({ path: `${p}.html`, element: <OldAddress /> })),
]);

// The intro (stars first, then the page) plays once, on arrival: any move
// inside the app ends it.
router.subscribe(() => document.documentElement.classList.remove("intro"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
