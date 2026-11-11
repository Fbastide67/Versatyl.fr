/* ==========================================================
   VERSATYL — page Soirées
   - compte à rebours des prochaines dates
   - accordéon des formats (un seul ouvert à la fois)
   - filtre des archives par lieu
   Aucune lecture de mise en page au scroll.
   ========================================================== */
(function () {
  "use strict";
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- à venir : J-x ---------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // les dates ajoutées depuis Shotgun arrivent en fin de liste : on remet tout dans l'ordre
  const grid = document.querySelector(".up-grid");
  if (grid) $$(".up-card[data-date]", grid)
    .sort((a, b) => a.dataset.date.localeCompare(b.dataset.date))
    .forEach((c) => grid.appendChild(c));
  const cards = $$(".up-card[data-date]");
  // sous-titre "N dates · mois → mois", recalculé sur les dates pas encore passées
  const sub = document.getElementById("up-sub");
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const coming = cards.map((c) => c.dataset.date).filter((d) => d >= iso(today));
  if (sub && coming.length) {
    const month = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { month: "long" });
    const first = month(coming[0]), last = month(coming[coming.length - 1]);
    sub.textContent = coming.length + (coming.length > 1 ? " dates" : " date") + " · " + (first === last ? first : first + " → " + last);
  }
  let next = null;
  cards.forEach((card) => {
    const p = card.dataset.date.split("-").map(Number);
    const days = Math.round((new Date(p[0], p[1] - 1, p[2]) - today) / 864e5);
    const out = card.querySelector(".up-count");
    if (days < 0) {
      card.classList.add("is-past");
      if (out) out.textContent = "C'est passé";
      return;
    }
    if (!next) next = card;
    if (out) out.textContent = days === 0 ? "Ce soir" : days === 1 ? "Demain" : "J-" + days;
  });
  // si la date mise en avant est passée, le badge passe à la suivante
  const current = document.querySelector(".up-card--next");
  if (next && current && next !== current) {
    const badge = current.querySelector(".up-badge");
    const place = next.querySelector(".up-place");
    current.classList.remove("up-card--next");
    next.classList.add("up-card--next");
    if (badge && place) place.replaceWith(badge);
  }

  /* ---------- formats : un seul ouvert à la fois ---------- */
  const fmts = $$(".fmt");
  let byUser = false;
  fmts.forEach((d) => {
    const sum = d.querySelector("summary");
    if (sum) sum.addEventListener("click", () => { byUser = true; });
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      fmts.forEach((o) => { if (o !== d && o.open) o.open = false; });
      if (!byUser) return;
      byUser = false;
      // une seule mesure, au clic : on remet le titre dans l'écran s'il en sort
      requestAnimationFrame(() => {
        const top = d.getBoundingClientRect().top;
        if (top < 50 || top > window.innerHeight * 0.7) {
          d.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
        }
      });
    });
  });

  /* ---------- archives : filtre par lieu ---------- */
  const chips = $$(".arch-chip");
  const items = $$(".arch-card");
  const empty = document.querySelector(".arch-empty");
  chips.forEach((chip) => {
    const f = chip.dataset.filter;
    const n = f === "all" ? items.length : items.filter((c) => c.dataset.venue === f).length;
    const span = chip.querySelector(".arch-n");
    if (span) span.textContent = String(n);
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      let shown = 0;
      items.forEach((c) => {
        const ok = f === "all" || c.dataset.venue === f;
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  });
})();
