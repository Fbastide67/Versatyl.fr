/* ==========================================================
   VERSATYL — page Soirées : carte de Marseille derrière le hero
   - fond gris, un point rose par lieu
   - clic sur la carte : le titre s'efface, la carte devient libre
   - clic sur un point : les soirées du lieu (à venir + archives)
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
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const events = {};
  const push = (v, ev) => { if (VENUES[v]) (events[v] = events[v] || []).push(ev); };

  document.querySelectorAll(".up-card[data-venue]").forEach((c) => {
    const p = c.dataset.date.split("-").map(Number);
    const past = new Date(p[0], p[1] - 1, p[2]) < today;
    push(c.dataset.venue, {
      date: c.dataset.date, label: text(c, ".up-date"),
      name: (c.querySelector(".up-name") || {}).getAttribute?.("aria-label") || text(c, ".up-name"),
      href: "#" + c.id, upcoming: !past
    });
  });
  document.querySelectorAll(".arch-card[data-venue]").forEach((c) => {
    const t = c.querySelector("time");
    // la page de la soirée en priorité, sinon la page Shotgun
    const page = c.querySelector("a.event-link--page");
    const link = page || c.querySelector("a.event-link");
    push(c.dataset.venue, {
      date: t ? t.getAttribute("datetime") : "", label: t ? t.textContent.trim() : "",
      name: text(c, ".event-name"), href: link ? link.href : "#archives", ext: !!link && !page, upcoming: false
    });
  });
  Object.values(events).forEach((l) => l.sort((a, b) => (a.upcoming === b.upcoming ? 0 : a.upcoming ? -1 : 1) || (a.upcoming ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))));

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function popupHtml(key) {
    const v = VENUES[key], list = events[key] || [];
    const up = list.filter((e) => e.upcoming), old = list.filter((e) => !e.upcoming);
    const row = (e) => `<li><a href="${esc(e.href)}"${e.ext ? ' target="_blank" rel="noopener"' : ""}><b>${esc(e.label)}</b> ${esc(e.name)}${e.ext ? ' <span aria-hidden="true">↗</span>' : ""}</a></li>`;
    return `<div class="mp">
      <p class="mp-name">${esc(v.name)}</p><p class="mp-where">${esc(v.where)}</p>
      ${up.length ? `<p class="mp-h">À venir</p><ul class="mp-list mp-list--up">${up.map(row).join("")}</ul>` : ""}
      ${old.length ? `<p class="mp-h">Déjà passées · ${old.length}</p><ul class="mp-list">${old.map(row).join("")}</ul>` : ""}
    </div>`;
  }

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
    markers[key] = m;
  });
  const bounds = L.latLngBounds(Object.values(VENUES).map((v) => v.ll));

  /* ---------- mode carte ---------- */
  const back = hero.querySelector(".sv-map-back");
  let open = false;
  const H = ["dragging", "scrollWheelZoom", "doubleClickZoom", "touchZoom", "boxZoom", "keyboard"];

  function enter() {
    if (open) return;
    open = true;
    hero.classList.add("is-map");
    H.forEach((h) => map[h].enable());
    zoomCtl.addTo(map);
    if (back) { back.hidden = false; back.focus({ preventScroll: true }); }
    map.flyToBounds(bounds, { padding: [60, 60], duration: reduce ? 0 : 0.9, maxZoom: 15 });
  }
  function leave() {
    if (!open) return;
    open = false;
    hero.classList.remove("is-map");
    H.forEach((h) => map[h].disable());
    zoomCtl.remove();
    map.closePopup();
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
  if (back) back.addEventListener("click", (e) => { e.stopPropagation(); leave(); });
  // un lien interne du popup (date à venir, archives) referme la carte avant de descendre
  el.addEventListener("click", (e) => {
    const a = e.target.closest(".mp-list a[href^='#']");
    if (a && open) leave();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) leave(); });

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
