/* ==========================================================
   VERSATYL — page d'une soirée passée
   - défilé infini des cartes, qu'on peut aussi glisser à la souris / au doigt (avec élan)
   - clic sur une carte : la photo s'ouvre en grand (flèches, Échap, clavier)
   ========================================================== */
(function () {
  "use strict";
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reel = document.querySelector(".so-reel");

  /* ---------- visionneuse ---------- */
  const box = document.querySelector(".so-lightbox");
  const canBox = !!(box && typeof box.showModal === "function");
  const img = box && box.querySelector("img");
  // une seule entrée par image, dans l'ordre d'apparition
  const srcs = [...new Set($$(".sc-card[data-full]").map((c) => c.dataset.full))];
  let cur = 0, opener = null;
  const show = (n) => {
    cur = (n + srcs.length) % srcs.length;
    img.src = srcs[cur];
    const card = document.querySelector(`.sc-card[data-full="${CSS.escape(srcs[cur])}"] img`);
    img.alt = card ? card.alt : "";
  };
  function open(card) {
    if (!canBox || !card || !card.dataset.full) return;
    opener = card;
    show(srcs.indexOf(card.dataset.full));
    box.showModal();
  }
  if (canBox) {
    box.querySelector(".so-lb-prev").addEventListener("click", () => show(cur - 1));
    box.querySelector(".so-lb-next").addEventListener("click", () => show(cur + 1));
    box.querySelector(".so-lb-close").addEventListener("click", () => box.close());
    box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
    box.addEventListener("close", () => { if (opener) opener.focus({ preventScroll: true }); });
    const one = srcs.length < 2;
    box.querySelector(".so-lb-prev").hidden = one;
    box.querySelector(".so-lb-next").hidden = one;
  }
  // clavier : Entrée / Espace sur une carte
  document.addEventListener("keydown", (e) => {
    const c = e.target.closest && e.target.closest(".sc-card[data-full]");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(c); }
  });

  if (!reel) return;

  /* ---------- défilé + glisser ---------- */
  const rows = $$(".sc-row", reel).map((row) => {
    const strip = row.querySelector(".sc-strip");
    // on double la rangée pour boucler sans saut
    Array.from(strip.children).forEach((c) => {
      const k = c.cloneNode(true);
      k.setAttribute("aria-hidden", "true");
      k.removeAttribute("tabindex");
      strip.appendChild(k);
    });
    const secs = parseFloat(getComputedStyle(row).getPropertyValue("--speed")) || 70;
    return { row, strip, dir: Number(row.dataset.dir) || -1, secs, x: 0, v: 0, half: 0 };
  });
  const measure = () => rows.forEach((r) => { r.half = r.strip.scrollWidth / 2; });
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  const wrap = (r) => {
    if (!r.half) return;
    r.x = ((r.x % r.half) + r.half) % r.half - r.half; // reste dans ]-moitié, 0]
  };

  let hover = false, visible = true, drag = null, last = performance.now();
  reel.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hover = true; });
  reel.addEventListener("pointerleave", () => { hover = false; });
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(reel);

  function tick(now) {
    const dt = Math.min(64, now - last) / 1000; last = now;
    if (visible) rows.forEach((r) => {
      if (drag && drag.r === r) return;
      // vitesse de croisière (nulle si on survole ou si l'utilisateur préfère moins d'animations)
      const cruise = reduce || hover ? 0 : (r.dir * r.half) / r.secs;
      r.v += (cruise - r.v) * Math.min(1, dt * 2.2);   // l'élan du lâcher retombe doucement vers la croisière
      r.x += r.v * dt;
      wrap(r);
      r.strip.style.transform = `translate3d(${r.x.toFixed(1)}px,0,0)`;
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  rows.forEach((r) => {
    r.row.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      drag = { r, id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: r.x, lx: e.clientX, lt: e.timeStamp, vx: 0, moved: false, card: e.target.closest(".sc-card") };
    });
    r.row.addEventListener("pointermove", (e) => {
      if (!drag || drag.r !== r || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      if (!drag.moved) {
        // au doigt, un geste plutôt vertical reste un scroll de la page
        if (Math.abs(dx) < 6) return;
        if (e.pointerType !== "mouse" && Math.abs(e.clientY - drag.sy) > Math.abs(dx)) { drag = null; return; }
        drag.moved = true;
        r.row.setPointerCapture(e.pointerId);
        reel.classList.add("is-dragging");
      }
      const dt = Math.max(1, e.timeStamp - drag.lt);
      drag.vx = drag.vx * 0.6 + ((e.clientX - drag.lx) / dt) * 1000 * 0.4; // px/s lissée
      drag.lx = e.clientX; drag.lt = e.timeStamp;
      r.x = drag.x0 + dx;
      wrap(r);                                          // la boucle est modulaire : la carte reste sous le doigt
      r.strip.style.transform = `translate3d(${r.x.toFixed(1)}px,0,0)`;
    });
    const end = (e) => {
      if (!drag || drag.r !== r || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      reel.classList.remove("is-dragging");
      if (d.moved) { r.v = Math.max(-3000, Math.min(3000, d.vx)); return; }
      if (e.type === "pointerup") open(d.card);        // simple clic : on ouvre la photo
    };
    r.row.addEventListener("pointerup", end);
    r.row.addEventListener("pointercancel", end);
  });
})();
