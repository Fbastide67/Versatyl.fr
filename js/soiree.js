/* ==========================================================
   VERSATYL — page d'une soirée passée
   - défilé infini des cartes (les rangées se dupliquent pour boucler)
   - visionneuse photo (flèches, Échap, clavier)
   ========================================================== */
(function () {
  "use strict";
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- défilé ---------- */
  if (!reduce) {
    $$(".sc-row").forEach((row) => {
      const strip = row.querySelector(".sc-strip");
      if (!strip) return;
      // on double la rangée : l'animation glisse de -50 %, la fin rejoint le début sans saut
      Array.from(strip.children).forEach((c) => {
        const k = c.cloneNode(true);
        k.setAttribute("aria-hidden", "true");
        strip.appendChild(k);
      });
      row.classList.add("is-live");
    });
    // pause quand le défilé n'est pas à l'écran (économise la batterie)
    const reel = document.querySelector(".so-reel");
    if (reel && "IntersectionObserver" in window) {
      new IntersectionObserver((e) => {
        $$(".sc-strip", reel).forEach((s) => { s.style.animationPlayState = e[0].isIntersecting ? "" : "paused"; });
      }).observe(reel);
    }
  }

  /* ---------- visionneuse ---------- */
  const box = document.querySelector(".so-lightbox");
  const thumbs = $$(".so-ph");
  if (!box || !thumbs.length || typeof box.showModal !== "function") return;
  const img = box.querySelector("img");
  let i = 0;
  const show = (n) => {
    i = (n + thumbs.length) % thumbs.length;
    img.src = thumbs[i].dataset.full;
    img.alt = thumbs[i].querySelector("img").alt;
  };
  thumbs.forEach((t, n) => t.addEventListener("click", () => { show(n); box.showModal(); }));
  box.querySelector(".so-lb-prev").addEventListener("click", () => show(i - 1));
  box.querySelector(".so-lb-next").addEventListener("click", () => show(i + 1));
  box.querySelector(".so-lb-close").addEventListener("click", () => box.close());
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });
  box.addEventListener("close", () => { if (thumbs[i]) thumbs[i].focus({ preventScroll: true }); });
  const hide = thumbs.length < 2;
  box.querySelector(".so-lb-prev").hidden = hide;
  box.querySelector(".so-lb-next").hidden = hide;
})();
