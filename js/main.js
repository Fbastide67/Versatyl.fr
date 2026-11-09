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

  /* ---------- vignettes du hero : dérive au scroll + déplacement à la souris ----------
     L'arrivée en rotation est en CSS (hero-card-in). Ici :
     --p (0 → 1) suit le scroll du hero, les vignettes dérivent et tournent avec lui ;
     --x / --y / --t suivent la souris quand on attrape une vignette.
     Au doigt, les vignettes restent de simples liens (sinon on ne pourrait plus scroller). */
  const heroCards = $$(".hero-card");
  const heroEl = $(".hero");
  if (heroCards.length && heroEl) {
    if (!reduce) {
      const drift = () => {
        const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, heroEl.offsetHeight)));
        heroEl.style.setProperty("--p", p.toFixed(3));
      };
      window.addEventListener("scroll", drift, { passive: true });
      drift();
    }
    const clamp = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b));
    let topZ = 5;
    heroCards.forEach((card) => {
      let id = null, sx = 0, sy = 0, ox = 0, oy = 0, x = 0, y = 0, lastX = 0, tilt = 0, moved = false, box = null;
      card.addEventListener("dragstart", (e) => e.preventDefault());
      card.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        id = e.pointerId; sx = lastX = e.clientX; sy = e.clientY; ox = x; oy = y; moved = false; tilt = 0;
        // limites : la vignette reste dans le hero, sous la barre du haut
        const r = card.getBoundingClientRect(), h = heroEl.getBoundingClientRect();
        const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar-h")) || 46;
        box = { x0: ox + h.left - r.left, x1: ox + h.right - r.right, y0: oy + Math.max(h.top, 0) + bar - r.top, y1: oy + h.bottom - r.bottom };
        card.setPointerCapture(id);
      });
      card.addEventListener("pointermove", (e) => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved) {
          if (Math.hypot(dx, dy) < 6) return;
          moved = true; card.classList.add("is-drag"); card.style.zIndex = String(++topZ);
        }
        x = clamp(ox + dx, box.x0, box.x1); y = clamp(oy + dy, box.y0, box.y1);
        // la vignette penche dans le sens du geste
        tilt += (clamp((e.clientX - lastX) * 1.2, -14, 14) - tilt) * 0.35; lastX = e.clientX;
        card.style.setProperty("--x", x.toFixed(1) + "px");
        card.style.setProperty("--y", y.toFixed(1) + "px");
        card.style.setProperty("--t", tilt.toFixed(2) + "deg");
      });
      const drop = (e) => {
        if (e.pointerId !== id) return;
        id = null; card.classList.remove("is-drag"); card.style.setProperty("--t", "0deg");
      };
      card.addEventListener("pointerup", drop);
      card.addEventListener("pointercancel", drop);
      // après un déplacement, le clic qui suit ne doit pas ouvrir le lien
      card.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } });
    });
  }

  /* ---------- apparitions au scroll ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else $$(".reveal").forEach((el) => el.classList.add("is-in"));

  /* ---------- manifeste : les mots s'allument au fil du scroll ---------- */
  const scrub = $(".manifesto-text[data-scrub]");
  if (scrub) {
    const sec = scrub.closest(".manifesto");
    const split = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const sp = document.createElement("span"); sp.className = "w"; sp.textContent = part; frag.appendChild(sp); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    };
    split(scrub);
    const words = $$(".w", scrub);
    let lastN = -1;
    const update = () => {
      const r = sec.getBoundingClientRect();
      const run = Math.max(1, r.height - innerHeight);
      const p = reduce ? 1 : Math.min(1, Math.max(0, -r.top / run));
      sec.style.setProperty("--mp", p.toFixed(3));
      const n = Math.round(Math.min(1, p / 0.8) * words.length);
      if (n !== lastN) {
        words.forEach((w, i) => w.classList.toggle("on", i < n));
        sec.classList.toggle("is-done", n >= words.length);
        lastN = n;
      }
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

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
