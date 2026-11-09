/* ==========================================================
   VERSATYL — page Résidents
   Vidéos d'aperçu des panneaux (<video data-preview>) :
   - desktop (souris) : chargée + lancée au survol / focus clavier, en pause sinon ;
   - tactile / mobile : lancée seulement quand la carte est bien visible.
   Une seule vidéo tourne à la fois. Aucune lecture de mise en page au scroll.
   ========================================================== */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const desktop = window.matchMedia("(min-width: 820px) and (hover: hover)");
  const panels = Array.from(document.querySelectorAll(".rs-panel")).filter((p) => p.querySelector("video[data-preview]"));
  if (!panels.length) return;

  let current = null;

  function start(p) {
    const v = p.querySelector("video[data-preview]");
    if (current && current !== p) stop(current);
    current = p;
    if (!v.getAttribute("src")) {
      v.muted = true;
      v.src = v.dataset.preview;
      v.addEventListener("playing", () => { if (current === p) p.classList.add("is-playing"); });
    }
    const pr = v.play();
    if (pr && pr.catch) pr.catch(() => {});
    if (v.readyState > 2) p.classList.add("is-playing");
  }

  function stop(p) {
    const v = p.querySelector("video[data-preview]");
    p.classList.remove("is-playing");
    if (!v.paused) v.pause();
    if (current === p) current = null;
  }

  /* desktop : survol + clavier */
  panels.forEach((p) => {
    p.addEventListener("pointerenter", () => { if (desktop.matches) start(p); });
    p.addEventListener("pointerleave", () => { if (desktop.matches) stop(p); });
    p.addEventListener("focus", () => { if (desktop.matches) start(p); });
    p.addEventListener("blur", () => { if (desktop.matches) stop(p); });
  });

  /* tactile : la carte doit être visible aux 2/3 */
  let io = null;
  function setupTouch() {
    if (io) { io.disconnect(); io = null; }
    if (desktop.matches || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.66) start(e.target);
        else if (e.target === current) stop(e.target);
      });
    }, { threshold: [0, 0.66] });
    panels.forEach((p) => io.observe(p));
  }
  setupTouch();
  const onChange = () => { panels.forEach(stop); setupTouch(); };
  if (desktop.addEventListener) desktop.addEventListener("change", onChange);
  else if (desktop.addListener) desktop.addListener(onChange);
})();
