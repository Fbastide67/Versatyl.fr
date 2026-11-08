/* ==========================================================
   VERSATYL — interactions de la page
   ========================================================== */
(function () {
  "use strict";
  const CFG = window.VERSATYL_CONFIG;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- liens (boutique GitHub, réseaux, mail) ---------- */
  $$("[data-shop]").forEach((a) => (a.href = CFG.shopUrl));
  $$("[data-insta]").forEach((a) => (a.href = CFG.instagram));
  $$("[data-tiktok]").forEach((a) => (a.href = CFG.tiktok));
  $$("[data-mail]").forEach((a) => { a.href = "mailto:" + CFG.email; a.textContent = CFG.email; });

  /* ---------- menu mobile ---------- */
  const burger = document.querySelector(".topbar-burger");
  const menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- curseur ---------- */
  const cursor = document.querySelector(".cursor");
  const label = cursor.querySelector(".cursor-label");
  let cx = -100, cy = -100, tx = -100, ty = -100;
  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  $$("a, button, .event-card, .resident").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      const txt = el.matches("[data-shop]") ? "Shop" : el.matches(".resident") ? "Crew" : el.matches(".event-card") ? "Soirée" : "";
      if (!txt) return;
      label.textContent = txt; cursor.classList.add("is-big");
    });
    el.addEventListener("pointerleave", () => cursor.classList.remove("is-big"));
  });

  /* ---------- apparitions au scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- vidéos des sections concept ---------- */
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target.querySelector(".concept-video");
      if (e.isIntersecting) {
        if (!v.src) v.src = "assets/video/" + e.target.dataset.video + ".mp4";
        if (!reduce) v.play().catch(() => {});
      } else v.pause();
    });
  }, { threshold: 0.1 });
  $$(".concept").forEach((s) => vio.observe(s));

  /* ---------- rangées défilantes (texte ondulé + galerie) ---------- */
  const rows = $$(".wave-row").map((el) => {
    const span = el.querySelector("span");
    for (let i = 0; i < 5; i++) el.appendChild(span.cloneNode(true));
    return { el, dir: Number(el.dataset.dir) || 1, x: 0, w: 0 };
  });
  const strips = $$(".gallery-track").map((t) => ({ el: t.querySelector(".gallery-strip"), dir: Number(t.dataset.dir) || 1, x: 0, paused: false }));
  strips.forEach((s) => {
    s.el.addEventListener("pointerenter", () => (s.paused = true));
    s.el.addEventListener("pointerleave", () => (s.paused = false));
  });
  const turb = document.getElementById("waveTurb");

  let lastY = window.scrollY, scrollVel = 0;
  const visible = new Set();
  const vis = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
  });
  $$(".wavewords, .gallery, .bigword").forEach((s) => vis.observe(s));

  const big = document.querySelector(".bigword-3d");
  let bx = 0, by = 0;

  let prev = performance.now();
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - prev) / 1000); prev = t;
    const y = window.scrollY;
    scrollVel += ((y - lastY) - scrollVel) * 0.2; lastY = y;
    cx += (tx - cx) * 0.25; cy += (ty - cy) * 0.25;
    cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
    if (reduce) return;

    if (visible.has(document.querySelector(".wavewords"))) {
      rows.forEach((r) => {
        const half = r.el.scrollWidth / 6;
        r.x += (40 + Math.abs(scrollVel) * 6) * dt * r.dir;
        if (r.x <= -half) r.x += half;
        if (r.x > 0) r.x -= half;
        r.el.style.transform = "translate3d(" + r.x + "px,0,0)";
      });
      if (turb) {
        const f = 0.004 + Math.sin(t / 1400) * 0.0015;
        turb.setAttribute("baseFrequency", f.toFixed(4) + " " + (0.02 + Math.cos(t / 1700) * 0.006).toFixed(4));
      }
    }
    if (visible.has(document.querySelector(".gallery"))) {
      strips.forEach((s) => {
        if (s.paused) return;
        const half = s.el.scrollWidth / 2;
        s.x += (30 + Math.abs(scrollVel) * 4) * dt * s.dir;
        if (s.x <= -half) s.x += half;
        if (s.x > 0) s.x -= half;
        s.el.style.transform = "translate3d(" + s.x + "px,0,0)";
      });
    }
    if (big && visible.has(document.querySelector(".bigword"))) {
      const nx = tx / window.innerWidth - 0.5, ny = ty / window.innerHeight - 0.5;
      bx += (nx * 28 - bx) * 0.06; by += (-ny * 18 - by) * 0.06;
      big.style.transform = "rotateY(" + bx.toFixed(2) + "deg) rotateX(" + by.toFixed(2) + "deg)";
    }
  }
  requestAnimationFrame(loop);
  // départ décalé des galeries pour que la 2e rangée soit pleine
  strips.forEach((s) => { if (s.dir > 0) s.x = -s.el.scrollWidth / 4; });

  /* ---------- cartes résidents : inclinaison ---------- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    $$(".resident").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 10).toFixed(2) + "deg)";
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });
  }
})();
