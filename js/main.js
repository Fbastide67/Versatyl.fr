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
  $$("[data-mail]").forEach((a) => {
    a.href = "mailto:" + CFG.email + (a.dataset.subject ? "?subject=" + encodeURIComponent(a.dataset.subject) : "");
    if (!a.textContent.trim()) a.textContent = CFG.email;
  });
  $$("[data-form]").forEach((a) => (a.href = CFG.recrutementForm));

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

  /* ---------- vignettes du hero ----------
     L'arrivée en rotation est en CSS (hero-card-in). Ici :
     - à la souris, elles sont posées à des places fixes autour du logo (SPOTS plus bas) ;
     - --p (0 → 1) suit le scroll du hero, elles dérivent et tournent avec lui ;
     - on les attrape à la souris (--x / --y / --t), et lâchées elles gardent leur élan.
     Au doigt, elles restent rangées et sont de simples liens (sinon on ne pourrait plus scroller). */
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
    const FRICTION = 0.945;  // vitesse gardée à chaque image (60/s) une fois lâchée : plus haut = glisse plus loin
    const BOUNCE = 0.5;      // part de la vitesse rendue quand la vignette tape un bord du hero
    const FOLLOW = 0.4;      // souplesse du suivi de la souris : plus bas = vignette plus lourde
    const MAX_SPEED = 3.2;   // px par milliseconde
    const EDGE = 12;         // marge gardée avec les bords du hero
    const barH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar-h")) || 46;
    let topZ = 5;
    const vignettes = heroCards.map((card) => {
      let id = null, held = false, moved = false, raf = 0, prevT = 0, box = null;
      let sx = 0, sy = 0, ox = 0, oy = 0;      // départ du geste (souris, vignette)
      let x = 0, y = 0, gx = 0, gy = 0;        // position de la vignette, position visée
      let vx = 0, vy = 0, tilt = 0;            // vitesse (px/ms) et inclinaison (deg)
      const apply = () => {
        card.style.setProperty("--x", x.toFixed(1) + "px");
        card.style.setProperty("--y", y.toFixed(1) + "px");
        card.style.setProperty("--t", tilt.toFixed(2) + "deg");
      };
      // place d'origine dans la page (sans les déplacements ni l'animation d'arrivée)
      // et déplacements permis pour rester dans le hero, sous la barre du haut
      const bounds = () => {
        const o = card.offsetParent.getBoundingClientRect(), h = heroEl.getBoundingClientRect();
        const l = o.left + card.offsetLeft, t = o.top + card.offsetTop, w = card.offsetWidth, ht = card.offsetHeight;
        return { l, t, w, h: ht, x0: h.left + EDGE - l, x1: h.right - EDGE - l - w, y0: h.top + barH() + EDGE - t, y1: h.bottom - EDGE - t - ht };
      };
      // une seule boucle : elle suit la souris tant qu'on tient la vignette,
      // puis la laisse glisser sur son élan, freiner et rebondir sur les bords
      const tick = (t) => {
        const dt = Math.min(34, Math.max(1, t - prevT)); prevT = t;
        const k = dt / 16.7;
        if (held) {
          const nx = x + (gx - x) * Math.min(1, FOLLOW * k), ny = y + (gy - y) * Math.min(1, FOLLOW * k);
          vx += ((nx - x) / dt - vx) * 0.5; vy += ((ny - y) / dt - vy) * 0.5;
          x = nx; y = ny;
        } else {
          x += vx * dt; y += vy * dt;
          const x1 = Math.max(box.x0, box.x1), y1 = Math.max(box.y0, box.y1);
          if (x < box.x0) { x = box.x0; vx = -vx * BOUNCE; } else if (x > x1) { x = x1; vx = -vx * BOUNCE; }
          if (y < box.y0) { y = box.y0; vy = -vy * BOUNCE; } else if (y > y1) { y = y1; vy = -vy * BOUNCE; }
          const f = Math.pow(FRICTION, k); vx *= f; vy *= f;
        }
        // la vignette penche dans le sens de sa vitesse et se redresse en s'arrêtant
        tilt += (clamp(vx * 16, -18, 18) - tilt) * Math.min(1, 0.22 * k);
        if (held || Math.hypot(vx, vy) > 0.015 || Math.abs(tilt) > 0.2) { apply(); raf = requestAnimationFrame(tick); return; }
        raf = 0; vx = vy = tilt = 0; apply(); card.classList.remove("is-glide");
      };
      const start = () => { if (!raf) { prevT = performance.now(); raf = requestAnimationFrame(tick); } };

      card.addEventListener("dragstart", (e) => e.preventDefault());
      card.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        // on rattrape une vignette en plein vol : elle s'arrête net et le clic n'ouvre pas le lien
        const caught = !!raf;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        card.classList.remove("is-glide");
        vx = vy = 0;
        id = e.pointerId; held = true; moved = caught;
        sx = e.clientX; sy = e.clientY; ox = gx = x; oy = gy = y;
        box = bounds();
        try { card.setPointerCapture(id); } catch (err) { /* pointeur déjà relâché */ }
        if (caught) { card.classList.add("is-drag"); start(); }
      });
      card.addEventListener("pointermove", (e) => {
        if (e.pointerId !== id || !held) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved) {
          if (Math.hypot(dx, dy) < 6) return;
          moved = true;
        }
        if (!card.classList.contains("is-drag")) { card.classList.add("is-drag"); card.style.zIndex = String(++topZ); }
        gx = clamp(ox + dx, box.x0, box.x1); gy = clamp(oy + dy, box.y0, box.y1);
        start();
      });
      const drop = (e) => {
        if (e.pointerId !== id) return;
        id = null; held = false;
        if (!card.classList.contains("is-drag")) return;
        card.classList.remove("is-drag");
        if (reduce) { x = gx; y = gy; vx = vy = 0; }
        else {
          const sp = Math.hypot(vx, vy);
          if (sp > MAX_SPEED) { vx *= MAX_SPEED / sp; vy *= MAX_SPEED / sp; }
          card.classList.add("is-glide");
        }
        start();
      };
      card.addEventListener("pointerup", drop);
      card.addEventListener("pointercancel", drop);
      // après un déplacement, le clic qui suit ne doit pas ouvrir le lien
      card.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } });

      return {
        card, bounds,
        place(nx, ny) { x = gx = nx; y = gy = ny; apply(); },
        // fenêtre redimensionnée : la vignette revient dans le hero si elle en est sortie
        refit() { if (held || raf) return; const b = bounds(); x = gx = clamp(x, b.x0, b.x1); y = gy = clamp(y, b.y0, b.y1); apply(); }
      };
    });

    /* posées à des places fixes (toujours les mêmes) : « Résidents » à gauche du logo,
       « T-shirt » à droite, la prochaine date reste en bas à droite.
       Positions en fraction du hero (gauche ou droite de la vignette, haut de la vignette).
       Seulement à la souris et sur grand écran : là où on peut ensuite les déplacer. */
    const SPOTS = [{ left: 0.056, top: 0.41 }, { right: 0.93, top: 0.41 }, null];
    const canScatter = () => finePointer && window.innerWidth > 820;
    let scattered = false;
    const placeAll = () => {
      const h = heroEl.getBoundingClientRect(), vh = Math.min(h.height, window.innerHeight);
      vignettes.forEach((v, i) => {
        const s = SPOTS[i];
        if (!s) { v.place(0, 0); return; }
        const b = v.bounds();
        const left = s.left != null ? h.left + s.left * h.width : h.left + s.right * h.width - b.w;
        const top = h.top + s.top * vh;
        v.place(clamp(left - b.l, b.x0, b.x1), clamp(top - b.t, b.y0, b.y1));
      });
    };
    if (canScatter()) { scattered = true; placeAll(); }
    let fitT;
    window.addEventListener("resize", () => {
      clearTimeout(fitT);
      fitT = setTimeout(() => {
        // passage en petit écran : elles retournent se ranger en bas
        if (scattered && !canScatter()) { scattered = false; vignettes.forEach((v) => v.place(0, 0)); }
        else if (canScatter()) { scattered = true; placeAll(); }
        else vignettes.forEach((v) => v.refit());
      }, 150);
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

  /* ---------- page collectif, nos valeurs : la section se fige et les valeurs s'écrivent
     l'une après l'autre, mot à mot, au fil du scroll (même principe que le manifeste) ---------- */
  const vsSec = $("[data-scrub-values]");
  if (vsSec && !reduce) {
    const pin = $(".vs-pin", vsSec);
    const items = $$(".values-grid li", vsSec).map((li) => {
      const p = $("p", li);
      const wrap = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
              else { const sp = document.createElement("span"); sp.className = "w"; sp.textContent = part; frag.appendChild(sp); }
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1) wrap(n);
        });
      };
      if (p) wrap(p);
      return { li, words: p ? $$(".w", p) : [] };
    });
    if (pin && items.length) {
      vsSec.classList.add("is-scrub");
      pin.style.setProperty("--n", items.length);
      let lastI = -1, lastN = -1;
      const update = () => {
        const r = pin.getBoundingClientRect();
        const run = Math.max(1, r.height - innerHeight);
        const p = Math.min(1, Math.max(0, -r.top / run)) * items.length;
        const i = Math.min(items.length - 1, Math.floor(p));
        const it = items[i];
        // chaque valeur : ses mots s'allument sur les 3/4 de sa part de scroll, puis elle reste lisible
        const n = Math.round(Math.min(1, (p - i) / 0.75) * it.words.length);
        if (i !== lastI) {
          items.forEach((o, k) => o.li.classList.toggle("is-active", k === i));
          lastI = i; lastN = -1;
        }
        if (n !== lastN) { it.words.forEach((w, k) => w.classList.toggle("on", k < n)); lastN = n; }
      };
      addEventListener("scroll", update, { passive: true });
      addEventListener("resize", update);
      update();
    }
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
