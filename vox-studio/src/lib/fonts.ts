// Bundled open-licence fonts (OFL) via Fontsource, so renders are identical on
// any machine. Rendering waits until every face is decoded.
import "@fontsource/inter/500.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/ibm-plex-mono/600.css";
import { continueRender, delayRender } from "remotion";

const FACES = [
  "500 40px Inter",
  "800 40px Inter",
  "900 40px Inter",
  "700 40px 'Playfair Display'",
  "italic 400 40px 'Playfair Display'",
  "italic 700 40px 'Playfair Display'",
  "600 40px 'IBM Plex Mono'",
];

let started = false;
export const ensureFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading fonts");
  Promise.all(FACES.map((f) => document.fonts.load(f, "AaÄ°–0123456789")))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error("font load failed", err);
      continueRender(handle);
    });
};
