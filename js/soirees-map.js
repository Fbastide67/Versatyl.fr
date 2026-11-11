/* ==========================================================
   VERSATYL — page Soirées : carte de Marseille derrière le hero
   - fond gris, un point rose par lieu
   - clic ou zoom sur la carte : le titre s'efface, la carte devient libre
   - dézoomer jusqu'au bout : retour à la page
   - point : les soirées du lieu ; survol d'une date = aperçu avec
     l'affiche, clic = la soirée en grand au milieu de l'écran
   Les soirées sont lues dans la page (cartes "À venir" et archives),
   il suffit donc d'ajouter data-venue="..." à une nouvelle carte.
   ========================================================== */
(function () {
  "use strict";
  const hero = document.querySelector(".sv-hero");
  const el = document.getElementById("sv-map");
  if (!hero || !el || !window.L) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const VENUES = {
    absolem:    { name: "Absolem",             where: "Club · Voûtes de la Major, 2e",       ll: [43.2988, 5.3637] },
    danceteria: { name: "Danceteria",          where: "Club · 18 rue Saint-Saëns, 1er",      ll: [43.2927, 5.3742] },
    manray:     { name: "Manray",              where: "Club · 38 rue Saint-Saëns, 1er",      ll: [43.2917, 5.3731] },
    traverse:   { name: "La Traverse des Balkis", where: "Bar · 1 rue des Trois Rois, 6e",   ll: [43.2939, 5.3849] },
    nucleaire:  { name: "Le Nucléaire",        where: "Bar · rue André Poggioli, 6e",        ll: [43.2911, 5.3860] },
    estaminet:  { name: "L'Estaminet",         where: "Club · Notre-Dame-du-Mont, 6e",       ll: [43.2919, 5.3842], left: true },
    florida:    { name: "Florida Palace",      where: "Salle · 162 av. Mireille Lauze, 10e", ll: [43.2828, 5.4147] }
  };

  /* ---------- soirées lues dans la page ---------- */
  const text = (root, s) => { const n = root.querySelector(s); return n ? n.textContent.replace(/\s+/g, " ").trim() : ""; };
  const label = (root, s) => { const n = root.querySelector(s); return n ? (n.getAttribute("aria-label") || text(root, s)) : ""; };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const all = [];          // toutes les soirées, indexées par data-ev
  const events = {};       // par lieu
  const push = (v, ev) => { if (!VENUES[v]) return; ev.venue = v; ev.i = all.length; all.push(ev); (events[v] = events[v] || []).push(ev); };

  document.querySelectorAll(".up-card[data-venue]").forEach((c) => {
    const p = c.dataset.date.split("-").map(Number);
    const past = new Date(p[0], p[1] - 1, p[2]) < today;
    const link = c.querySelector("a.btn[href]");
    push(c.dataset.venue, {
      date: c.dataset.date, label: text(c, ".up-date"),
      name: label(c, ".up-name"), info: text(c, ".up-info"),
      tags: Array.from(c.querySelectorAll(".up-tags li")).map((li) => li.textContent.trim()),
      count: text(c, ".up-count"),
      href: link ? link.href : "", cta: link ? link.textContent.replace("↗", "").replace(/\s+/g, " ").trim() : "",
      upcoming: !past
    });
  });
  document.querySelectorAll(".arch-card[data-venue]").forEach((c) => {
    const t = c.querySelector("time");
    // la page de la soirée (si elle existe) + la page Shotgun
    const page = c.querySelector("a.event-link--page");
    const link = c.querySelector("a.event-link:not(.event-link--page)");
    const img = c.querySelector(".event-visual img");
    const nw = c.querySelector(".event-top .nw");
    push(c.dataset.venue, {
      date: t ? t.getAttribute("datetime") : "", label: t ? t.textContent.trim() : "",
      name: text(c, ".event-name"), img: img ? img.getAttribute("src") : "",
      tags: nw ? [nw.textContent.trim()] : [],
      page: page ? page.getAttribute("href") : "",
      href: link ? link.href : "", cta: link ? "Page Shotgun" : "", upcoming: false
    });
  });
  Object.values(events).forEach((l) => l.sort((a, b) => (a.upcoming === b.upcoming ? 0 : a.upcoming ? -1 : 1) || (a.upcoming ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))));

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const fullDate = (e) => {
    if (!e.date) return e.label;
    const p = e.date.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  function popupHtml(key) {
    const v = VENUES[key], list = events[key] || [];
    const up = list.filter((e) => e.upcoming), old = list.filter((e) => !e.upcoming);
    const row = (e) => `<li><button type="button" class="mp-row" data-ev="${e.i}"><b>${esc(e.label)}</b> ${esc(e.name)}</button></li>`;
    return `<div class="mp">
      <p class="mp-name">${esc(v.name)}</p><p class="mp-where">${esc(v.where)}</p>
      ${up.length ? `<p class="mp-h">À venir</p><ul class="mp-list mp-list--up">${up.map(row).join("")}</ul>` : ""}
      ${old.length ? `<p class="mp-h">Déjà passées · ${old.length}</p><ul class="mp-list">${old.map(row).join("")}</ul>` : ""}
    </div>`;
  }

  // visuel d'une soirée : l'affiche, sinon un carton typographique
  const visual = (e) => e.img
    ? `<img src="${esc(e.img)}" alt="Affiche ${esc(e.name)}" decoding="async">`
    : `<span class="ev-noposter"><b>${esc(e.label)}</b><span>${esc(e.name)}</span></span>`;
  const when = (e) => `<p class="ev-date">${esc(fullDate(e))}${e.upcoming && e.count ? ` · <span class="ev-count">${esc(e.count)}</span>` : ""}</p>`;
  const where = (e) => `<p class="ev-venue">${esc(VENUES[e.venue].name)} <span>${esc(VENUES[e.venue].where)}</span></p>`;
  const tags = (e) => e.tags.length ? `<ul class="ev-tags">${e.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";

  /* ---------- survol d'une date : petit encadré ---------- */
  const peek = document.createElement("div");
  peek.className = "ev-peek"; peek.setAttribute("aria-hidden", "true"); peek.hidden = true;
  document.body.appendChild(peek);
  let peekFor = null;
  function showPeek(btn) {
    const e = all[+btn.dataset.ev];
    if (!e) return;
    if (peekFor !== btn) {
      peekFor = btn;
      peek.innerHTML = `<div class="ev-peek-visual">${visual(e)}</div><div class="ev-peek-body">
        ${when(e)}<p class="ev-name">${esc(e.name)}</p>${where(e)}${tags(e)}
        <p class="ev-peek-hint">Clique pour l'ouvrir</p></div>`;
    }
    peek.hidden = false;
    const r = btn.getBoundingClientRect(), pw = peek.offsetWidth, ph = peek.offsetHeight, m = 12;
    const pop = btn.closest(".leaflet-popup");
    const pr = pop ? pop.getBoundingClientRect() : r;
    let x = pr.right + m;
    if (x + pw > window.innerWidth - m) x = pr.left - pw - m;
    if (x < m) x = Math.max(m, Math.min(window.innerWidth - pw - m, r.left));
    let y = r.top + r.height / 2 - ph / 2;
    y = Math.max(m, Math.min(window.innerHeight - ph - m, y));
    peek.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    requestAnimationFrame(() => peek.classList.add("is-on"));
  }
  function hidePeek() { peekFor = null; peek.classList.remove("is-on"); peek.hidden = true; }

  /* ---------- clic sur une date : la soirée au milieu de l'écran ---------- */
  const modal = document.createElement("div");
  modal.className = "ev-modal"; modal.hidden = true;
  modal.innerHTML = `<div class="ev-modal-back" data-close></div>
    <div class="ev-modal-box" role="dialog" aria-modal="true" aria-labelledby="ev-modal-title" tabindex="-1">
      <button type="button" class="ev-modal-x" data-close aria-label="Fermer">×</button>
      <div class="ev-modal-content"></div>
    </div>`;
  document.body.appendChild(modal);
  const box = modal.querySelector(".ev-modal-box");
  let lastFocus = null, closeTimer = 0;
  function openModal(e) {
    hidePeek();
    clearTimeout(closeTimer);
    const v = VENUES[e.venue];
    modal.querySelector(".ev-modal-content").innerHTML = `
      <div class="ev-modal-visual">${visual(e)}</div>
      <div class="ev-modal-body">
        <span class="hud-label"><span class="hud-chev">›››</span> ${e.upcoming ? "À venir" : "Archive"} // ${esc(v.name)}</span>
        <p class="ev-modal-date">${esc(e.label)}</p>
        <h2 class="ev-modal-name" id="ev-modal-title">${esc(e.name)}</h2>
        ${when(e)}${where(e)}
        ${e.info ? `<p class="ev-info">${esc(e.info)}</p>` : ""}
        ${tags(e)}
        <div class="ev-modal-actions">
          ${e.page ? `<a class="btn btn--fuchsia" href="${esc(e.page)}">La soirée <span aria-hidden="true">→</span></a>` : ""}
          ${e.href ? `<a class="btn${e.page ? "" : " btn--fuchsia"}" href="${esc(e.href)}" target="_blank" rel="noopener">${esc(e.cta || "Infos")} <span aria-hidden="true">↗</span></a>` : ""}
        </div>
      </div>`;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add("ev-lock");
    requestAnimationFrame(() => { modal.classList.add("is-on"); box.focus({ preventScroll: true }); });
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.classList.remove("is-on");
    document.documentElement.classList.remove("ev-lock");
    closeTimer = setTimeout(() => { modal.hidden = true; }, reduce ? 0 : 250);
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden || !modal.classList.contains("is-on")) return;
    if (e.key === "Escape") { e.stopImmediatePropagation(); closeModal(); }
    else if (e.key === "Tab") {
      const f = Array.from(box.querySelectorAll("a[href], button"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  el.addEventListener("click", (e) => {
    const b = e.target.closest(".mp-row");
    if (b && all[+b.dataset.ev]) openModal(all[+b.dataset.ev]);
  });
  el.addEventListener("mouseover", (e) => { const b = e.target.closest(".mp-row"); if (b) showPeek(b); });
  el.addEventListener("mouseout", (e) => {
    const b = e.target.closest(".mp-row");
    if (b && !b.contains(e.relatedTarget)) hidePeek();
  });
  el.addEventListener("focusin", (e) => { const b = e.target.closest(".mp-row"); if (b && b.matches(":focus-visible")) showPeek(b); });
  el.addEventListener("focusout", (e) => { if (e.target.closest(".mp-row")) hidePeek(); });

  /* ---------- carte ---------- */
  const map = L.map(el, {
    center: [43.2935, 5.3800], zoom: 14, minZoom: 12, maxZoom: 16,
    zoomControl: false, attributionControl: true,
    dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false,
    zoomSnap: 0.25
  });
  const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
  L.tileLayer(ESRI + "World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16, maxNativeZoom: 16, className: "sv-tiles",
    attribution: 'Fond &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, OpenStreetMap'
  }).addTo(map);
  L.tileLayer(ESRI + "World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16, maxNativeZoom: 16, className: "sv-tiles sv-tiles--labels"
  }).addTo(map);
  const zoomCtl = L.control.zoom({ position: "bottomright" });

  const markers = {};
  Object.keys(VENUES).forEach((key) => {
    const list = events[key] || [];
    const hot = list.some((e) => e.upcoming);
    const icon = L.divIcon({
      className: "mk" + (hot ? " mk--hot" : "") + (VENUES[key].left ? " mk--left" : ""), iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12],
      html: `<span class="mk-dot"></span><span class="mk-n">${list.length}</span><span class="mk-label">${esc(VENUES[key].name)}</span>`
    });
    const m = L.marker(VENUES[key].ll, { icon, keyboard: true, title: VENUES[key].name, riseOnHover: true })
      .bindPopup(() => popupHtml(key), { className: "mp-pop", maxWidth: 300, minWidth: 220, autoPanPadding: [24, 70] })
      .addTo(map);
    m.on("click", () => { if (!open) enter(); });
    m.on("mouseover", () => { if (open && !m.isPopupOpen()) m.openPopup(); });
    markers[key] = m;
  });
  const bounds = L.latLngBounds(Object.values(VENUES).map((v) => v.ll));

  /* ---------- mode carte ----------
     entrer : clic, molette vers le haut (en haut de page), pinch / ctrl+molette
     sortir : bouton Retour, Échap, ou dézoomer jusqu'au bout */
  const back = hero.querySelector(".sv-map-back");
  let open = false, busy = false, quietUntil = 0;
  const OUT_ZOOM = 12.5;    // à ce niveau de dézoom, on ressort de la carte
  const H = ["dragging", "doubleClickZoom", "touchZoom", "boxZoom", "keyboard"];

  function enter() {
    if (open) return;
    open = true; busy = true;
    quietUntil = performance.now() + 700;
    hero.classList.add("is-map");
    H.forEach((h) => map[h].enable());
    zoomCtl.addTo(map);
    if (back) back.hidden = false;
    map.once("moveend", () => { busy = false; if (open) map.scrollWheelZoom.enable(); });
    map.flyToBounds(bounds, { padding: [60, 60], duration: reduce ? 0 : 0.9, maxZoom: 15 });
  }
  function leave() {
    if (!open) return;
    open = false; busy = false;
    quietUntil = performance.now() + 700;
    hero.classList.remove("is-map");
    H.forEach((h) => map[h].disable());
    map.scrollWheelZoom.disable();
    zoomCtl.remove();
    map.closePopup();
    hidePeek();
    if (back) back.hidden = true;
    map.flyTo(home(), 14, { duration: reduce ? 0 : 0.8 });
  }
  // au repos, la carte se décale à droite pour laisser le titre lisible à gauche
  function home() {
    const w = el.clientWidth;
    const shift = w > 760 ? -w * 0.3 : 0;
    const c = map.project([43.2925, 5.3800], 14).add([shift, 40]);
    return map.unproject(c, 14);
  }

  hero.addEventListener("click", (e) => {
    if (open) return;
    if (e.target.closest("a, button, .leaflet-marker-icon, .leaflet-popup, .leaflet-control")) return;
    enter();
  });
  // zoomer sur la carte = y entrer ; le reste du temps la molette fait défiler la page
  hero.addEventListener("wheel", (e) => {
    const now = performance.now();
    if (open) { if (busy || now < quietUntil) e.preventDefault(); return; }
    if (now < quietUntil) { if (e.deltaY < 0 || e.ctrlKey) e.preventDefault(); return; }
    const zoomIn = e.deltaY < 0 && (e.ctrlKey || window.scrollY < 4);
    if (!zoomIn) return;
    e.preventDefault();
    enter();
  }, { passive: false });
  // pinch à deux doigts sur mobile
  hero.addEventListener("touchstart", (e) => { if (!open && e.touches.length > 1) enter(); }, { passive: true });
  // dézoomer jusqu'au bout = revenir à la page
  map.on("zoomend", () => { if (open && !busy && map.getZoom() <= OUT_ZOOM) leave(); });

  if (back) back.addEventListener("click", (e) => { e.stopPropagation(); leave(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) leave(); });
  map.on("popupclose", hidePeek);

  /* ---------- un peu de vie au repos ---------- */
  map.setView(home(), reduce ? 14 : 12.5, { animate: false });
  if (!reduce) {
    const io = new IntersectionObserver((ents) => {
      if (!ents[0].isIntersecting) return;
      io.disconnect();
      setTimeout(() => { if (!open) map.flyTo(home(), 14, { duration: 2.4 }); }, 250);
    });
    io.observe(el);
  }
  window.addEventListener("resize", () => { map.invalidateSize(); if (!open) map.setView(home(), 14, { animate: false }); });
})();
