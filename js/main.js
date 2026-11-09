/* ==========================================================
   VERSATYL — interactions communes à toutes les pages
   ========================================================== */
(function () {
  "use strict";
  const CFG = window.VERSATYL_CONFIG || {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- liens (boutique, réseaux, mail) ---------- */
  $$("[data-shop]").forEach((a) => (a.href = CFG.shopUrl));
  $$("[data-insta]").forEach((a) => (a.href = CFG.instagram));
  $$("[data-tiktok]").forEach((a) => (a.href = CFG.tiktok));
  $$("[data-shotgun]").forEach((a) => { if (!a.getAttribute("href") || a.getAttribute("href") === "#") a.href = CFG.shotgun; });
  $$("[data-mail]").forEach((a) => { a.href = "mailto:" + CFG.email; if (!a.textContent.trim()) a.textContent = CFG.email; });

  /* ---------- menu mobile ---------- */
  const burger = $(".topbar-burger");
  const menu = $("#mobile-menu");
  if (burger && menu) {
    const setMenu = (open) => {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      menu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  }

  /* ---------- boutons : petit « pop » au clic avant de changer de page ---------- */
  const POP = ".btn, .btn-sticker, .topbar-shop, .event-link, .text-link, .topbar-nav a, .mobile-menu a, .footer-links a, .footer-mail, .footer-bottom a, [data-pop]";
  document.addEventListener("click", (e) => {
    const el = e.target.closest(POP);
    if (!el) return;
    el.classList.remove("is-pop"); void el.offsetWidth; el.classList.add("is-pop");
    setTimeout(() => el.classList.remove("is-pop"), 400);
    // lien interne vers une autre page : on laisse le bouton grossir avant de partir
    if (reduce || el.tagName !== "A" || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (el.target === "_blank" || el.hasAttribute("download")) return;
    const url = new URL(el.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // ancre sur la même page
    e.preventDefault();
    setTimeout(() => { location.href = url.href; }, 170);
  });

  /* ---------- curseur ---------- */
  const cursor = $(".cursor");
  const label = cursor && $(".cursor-label", cursor);
  let cx = -100, cy = -100, tx = -100, ty = -100;
  const useCursor = !!(cursor && finePointer);
  if (useCursor) {
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; wake(); }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const el = e.target.closest("[data-cursor], a, button");
      if (!el || el.closest(".hero")) return;
      const txt = el.dataset.cursor || (el.matches("[data-shop]") ? "Shop" : "");
      if (txt) { label.textContent = txt; cursor.classList.add("is-big"); }
      else cursor.classList.remove("is-big");
    });
    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest("[data-cursor], a, button");
      if (el && !el.contains(e.relatedTarget)) cursor.classList.remove("is-big");
    });
  }

  /* ---------- apparitions au scroll ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else $$(".reveal").forEach((el) => el.classList.add("is-in"));

  /* ---------- vidéos : chargées et lancées seulement quand elles sont visibles ----------
     <video data-src="..."> (ou section.concept[data-video]) */
  const lazyVideos = $$("video[data-src]");
  // vidéos des concepts (plein écran) : une seule à la fois, seulement quand bien visible
  const conceptVideos = $$(".concept[data-video]").map((s) => {
    const v = $(".concept-video", s);
    if (v && !v.dataset.src) v.dataset.src = "assets/video/" + s.dataset.video + ".mp4";
    return v;
  }).filter(Boolean);
  if (conceptVideos.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          conceptVideos.forEach((o) => { if (o !== v && !o.paused) o.pause(); });
          if (!v.getAttribute("src")) v.src = v.dataset.src;
          if (!reduce) v.play().catch(() => {});
        } else if (!v.paused) v.pause();
      });
    }, { threshold: 0.35 });
    conceptVideos.forEach((v) => { v.muted = true; cio.observe(v); });
  }
  if (lazyVideos.length) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (!v.getAttribute("src")) v.src = v.dataset.src;
          if (!reduce) v.play().catch(() => {});
        } else if (!v.paused) v.pause();
      });
    }, { threshold: 0.05, rootMargin: "200px 0px" });
    lazyVideos.forEach((v) => { v.muted = true; vio.observe(v); });
  }

  /* ---------- rangées défilantes (texte ondulé + galerie) ----------
     Les largeurs sont mesurées une fois (et au redimensionnement),
     jamais pendant l'animation : plus de recalcul de mise en page à chaque image. */
  const rows = $$(".wave-row").map((el) => {
    const span = $("span", el);
    for (let i = 0; i < 3; i++) el.appendChild(span.cloneNode(true));
    return { el, unit: span, dir: Number(el.dataset.dir) || 1, x: 0, w: 1 };
  });
  const strips = $$(".gallery-track").map((t) => ({ el: $(".gallery-strip", t), dir: Number(t.dataset.dir) || 1, x: 0, w: 1, paused: false }));
  strips.forEach((s) => {
    s.el.addEventListener("pointerenter", () => (s.paused = true));
    s.el.addEventListener("pointerleave", () => (s.paused = false));
  });
  function measure() {
    rows.forEach((r) => { r.w = r.unit.getBoundingClientRect().width || 1; });
    strips.forEach((s) => {
      s.w = s.el.scrollWidth / 2 || 1;
      if (!s.started) { s.started = true; if (s.dir > 0) s.x = -s.w / 2; }
    });
  }
  measure();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 150); });
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  const visible = new Set();
  const wavewords = $(".wavewords"), gallery = $(".gallery"), bigword = $(".bigword");
  if ("IntersectionObserver" in window) {
    const vis = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      wake();
    }, { rootMargin: "100px 0px" });
    [wavewords, gallery, bigword].forEach((s) => s && vis.observe(s));
  }

  const big = $(".bigword-3d");
  let bx = 0, by = 0;
  let lastY = window.scrollY, scrollVel = 0;
  window.addEventListener("scroll", wake, { passive: true });

  /* boucle d'animation : elle s'arrête d'elle-même quand rien ne bouge */
  let running = false, prev = 0;
  function wake() { if (!running) { running = true; prev = performance.now(); requestAnimationFrame(loop); } }
  function loop(t) {
    const dt = Math.min(0.05, (t - prev) / 1000); prev = t;
    const y = window.scrollY;
    scrollVel += ((y - lastY) - scrollVel) * 0.2; lastY = y;
    let busy = false;

    if (useCursor) {
      cx += (tx - cx) * 0.3; cy += (ty - cy) * 0.3;
      cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) busy = true;
    }
    if (!reduce) {
      if (visible.has(wavewords)) {
        busy = true;
        const v = (40 + Math.min(600, Math.abs(scrollVel) * 6)) * dt;
        rows.forEach((r) => {
          r.x += v * r.dir;
          if (r.x <= -r.w) r.x += r.w;
          if (r.x > 0) r.x -= r.w;
          r.el.style.transform = "translate3d(" + r.x.toFixed(1) + "px,0,0)";
        });
      }
      if (visible.has(gallery)) {
        busy = true;
        const v = (30 + Math.min(400, Math.abs(scrollVel) * 4)) * dt;
        strips.forEach((s) => {
          if (s.paused) return;
          s.x += v * s.dir;
          if (s.x <= -s.w) s.x += s.w;
          if (s.x > 0) s.x -= s.w;
          s.el.style.transform = "translate3d(" + s.x.toFixed(1) + "px,0,0)";
        });
      }
      if (big && visible.has(bigword) && finePointer) {
        const nx = tx / window.innerWidth - 0.5, ny = ty / window.innerHeight - 0.5;
        bx += (nx * 28 - bx) * 0.06; by += (-ny * 18 - by) * 0.06;
        big.style.transform = "rotateY(" + bx.toFixed(2) + "deg) rotateX(" + by.toFixed(2) + "deg)";
        busy = true;
      }
    }
    if (Math.abs(scrollVel) > 0.1) busy = true;
    if (busy) requestAnimationFrame(loop); else running = false;
  }
  wake();

  /* ---------- cartes : légère inclinaison ---------- */
  if (!reduce && finePointer) {
    $$("[data-tilt]").forEach((card) => {
      let r = null;
      card.addEventListener("pointerenter", () => { r = card.getBoundingClientRect(); });
      card.addEventListener("pointermove", (e) => {
        if (!r) r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + (x * 8).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg)";
      });
      card.addEventListener("pointerleave", () => { r = null; card.style.transform = ""; });
    });
  }
})();
