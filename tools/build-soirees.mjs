/* ==========================================================
   VERSATYL — génère une page par soirée passée : soirees/<slug>.html
   Données : tools/soirees-data.mjs
   Lancer depuis la racine du site :  node tools/build-soirees.mjs
   ========================================================== */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { VENUES, SOIREES } from "./soirees-data.mjs";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// en-tête (logo, menu) et pied de page repris d'une page résident, pour rester identiques au reste du site
const tpl = readFileSync("residents/dj-tiger.html", "utf8");
const logo = tpl.slice(tpl.indexOf('<svg width="0"'), tpl.indexOf('<div class="cursor"'));
const header = tpl.slice(tpl.indexOf('<div class="cursor"'), tpl.indexOf('<main class="page-top"'))
  .replace(/ aria-current="page"/g, "")
  .replace('<a href="../soirees.html">Soirées</a>', '<a href="../soirees.html" aria-current="page">Soirées</a>');
const footer = tpl.slice(tpl.indexOf('<footer class="footer"'), tpl.indexOf("<script"));

const list = [...SOIREES].sort((a, b) => b.date.localeCompare(a.date));

function info(s) {
  const [y, m, d] = s.date.split("-").map(Number);
  const wd = JOURS[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
  const v = VENUES[s.venue];
  const photos = [];
  for (let i = 1; i <= (s.photos || 0); i++) photos.push(`../assets/img/soirees/${s.slug}/${String(i).padStart(2, "0")}.jpg`);
  (s.extra || []).forEach((p) => photos.push(`../assets/img/${p}`));
  photos.forEach((p) => { if (!existsSync(p.replace("../", ""))) throw new Error(`Photo introuvable : ${p}`); });
  return {
    v, photos, wd,
    short: `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${String(y).slice(2)}`,
    long: `${wd} ${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`,
    poster: s.poster ? `../assets/img/affiches/${s.poster}` : ""
  };
}

/* ---------- le défilé de cartes ---------- */
function cards(s, I) {
  // les mots écrits en gros sous chaque carte
  const words = [I.short, I.v.name.replace(/^(L'|La |Le )/, ""), ...s.lineup.map((l) => l[0]), ...s.tags, "Versatyl"]
    .filter((w, i, a) => a.indexOf(w) === i);
  const pics = I.photos.length ? I.photos : [];
  const n = Math.max(8, pics.length);
  const rows = [[], [], []];
  for (let i = 0; i < n * 3 && i < 36; i++) {
    const r = i % 3, k = Math.floor(i / 3);      // rangée, position dans la rangée
    const pic = pics.length ? pics[(k + r * Math.ceil(pics.length / 3)) % pics.length] : "";
    const usePoster = I.poster && (!pics.length ? (k + r) % 3 === 1 : (k + r * 2) % 9 === 4);
    const word = words[(k + r * 3) % words.length];
    const rot = ((i * 37) % 9) - 4;              // -4° → +4°
    const dy = ((i * 53) % 5) * 6 - 12;          // -12px → +12px
    let media;
    if (usePoster) media = `<img src="${I.poster}" alt="" loading="lazy" decoding="async">`;
    else if (pic) media = `<img src="${pic}" alt="" loading="lazy" decoding="async">`;
    else media = `<span class="sc-type" aria-hidden="true"><b>${esc(I.short)}</b><i>${esc(s.tags[i % s.tags.length] || "Versatyl")}</i></span>`;
    rows[r].push(`<figure class="sc-card${usePoster ? " sc-card--poster" : ""}${!usePoster && !pic ? " sc-card--type" : ""}" style="--r:${rot}deg;--y:${dy}px">
          <div class="sc-head"><svg viewBox="0 0 867.18 358.54" aria-hidden="true"><use href="#vt-logo"/></svg><span>${esc(I.short)}</span></div>
          <div class="sc-media">${media}</div>
          <figcaption class="sc-cap">${esc(word)}</figcaption>
        </figure>`);
  }
  return rows.map((r, i) => `<div class="sc-row" data-dir="${i % 2 ? 1 : -1}" style="--speed:${[62, 78, 70][i]}s"><div class="sc-strip">
        ${r.join("\n        ")}
      </div></div>`).join("\n      ");
}

function page(s, idx) {
  const I = info(s);
  const prev = list[idx + 1], next = list[idx - 1]; // prev = plus ancienne, next = plus récente
  const title = `${s.title} · ${I.short}`;
  const desc = `${s.full || s.title}, soirée Versatyl du ${I.long} à ${I.v.name}, Marseille. Line-up, infos et photos.`;
  const facts = [
    ["Date", I.long[0].toUpperCase() + I.long.slice(1)],
    ["Lieu", `${I.v.name} · ${I.v.sub.split(" · ")[1] || ""}`],
    ["Adresse", I.v.addr],
    s.hours && ["Horaires", s.hours],
    s.capacity && ["Jauge", s.capacity],
    s.price && ["Tarifs", s.price]
  ].filter(Boolean);
  const og = I.poster ? I.poster.replace("../", "https://versatyl.fr/") : "https://versatyl.fr/assets/img/og.jpg";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — Versatyl Marseille</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="theme-color" content="#0E0118">
  <link rel="icon" href="../assets/img/chauve-souris.png">
  <link rel="apple-touch-icon" href="../assets/img/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)} — Versatyl Marseille">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${esc(og)}">
  <link rel="preload" href="../assets/fonts/Redband-Regular.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="../assets/fonts/GoodTimesRg-Bold.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="../css/style.css?v=15">
  <link rel="stylesheet" href="../css/soiree.css?v=2">
</head>
<body class="page page--soiree">

<!-- Page générée par tools/build-soirees.mjs : modifier tools/soirees-data.mjs puis relancer le script -->
${logo}${header}<main class="page-top" id="top">

  <section class="so-hero">
    <div class="so-hero-text">
      <a class="so-back text-link" href="../soirees.html#archives">‹‹‹ Archives</a>
      <span class="hud-label"><span class="hud-chev">›››</span> Versatyl // ${esc(I.v.name)}</span>
      <h1 class="so-title">${esc(s.title)}</h1>
      <p class="so-when"><time datetime="${s.date}">${esc(I.short)}</time> <span>${esc(I.wd)}${s.hours ? " · " + esc(s.hours) : ""}</span></p>
      <div class="so-pills">${s.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>
      ${s.shotgun ? `<a class="btn btn--fuchsia" href="${esc(s.shotgun)}" target="_blank" rel="noopener">Page Shotgun <span aria-hidden="true">↗</span></a>` : ""}
    </div>
    ${I.poster ? `<figure class="so-poster" data-tilt>
      <img src="${I.poster}" alt="Affiche ${esc(s.full || s.title)}, ${esc(I.long)}" fetchpriority="high" decoding="async">
      <span class="brackets brackets--fuchsia" aria-hidden="true"></span>
    </figure>` : `<div class="so-poster so-poster--type" aria-hidden="true"><b>${esc(s.title)}</b><span>${esc(I.short)}</span></div>`}
  </section>

  <section class="so-reel" aria-label="Souvenirs de la soirée">
    <div class="so-reel-rows">
      ${cards(s, I)}
    </div>
  </section>

  <section class="so-section" aria-labelledby="infos-titre">
    <div class="so-split">
      <div>
        <h2 class="so-h2 reveal" id="infos-titre">La soirée</h2>
        ${s.text.map((p) => `<p class="so-text">${esc(p)}</p>`).join("\n        ")}
      </div>
      <dl class="so-facts">
        ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("\n        ")}
      </dl>
    </div>
  </section>

  ${s.lineup.length ? `<section class="so-section" aria-labelledby="lineup-titre">
    <h2 class="so-h2 reveal" id="lineup-titre">Line-up</h2>
    <ol class="so-lineup">
      ${s.lineup.map(([n, st], i) => `<li data-pop><span class="so-n">${String(i + 1).padStart(2, "0")}</span><span class="so-dj">${esc(n)}</span>${st ? `<span class="so-style">${esc(st)}</span>` : ""}</li>`).join("\n      ")}
    </ol>
  </section>` : ""}

  <section class="so-section" aria-labelledby="photos-titre">
    <div class="so-head">
      <h2 class="so-h2 reveal" id="photos-titre">Photos</h2>
      ${I.photos.length ? `<span class="hud-label"><span class="hud-chev">›››</span> ${I.photos.length} photo${I.photos.length > 1 ? "s" : ""}${s.credit ? " · " + esc(s.credit) : ""}</span>` : ""}
    </div>
    ${I.photos.length ? `<div class="so-grid">
      ${I.photos.map((p, i) => `<button type="button" class="so-ph" data-full="${p}" data-cursor="Voir" aria-label="Agrandir la photo ${i + 1}"><img src="${p}" alt="Photo de la soirée ${esc(s.title)}, ${esc(I.short)}" loading="lazy" decoding="async"></button>`).join("\n      ")}
    </div>` : `<p class="so-empty">Les photos de cette soirée arrivent bientôt. Tu en as&nbsp;? Envoie-les à <a data-mail href="#">versatyl.marseille@gmail.com</a>.</p>`}
    ${s.poster2 ? `<figure class="so-poster2" data-tilt><img src="../assets/img/affiches/${s.poster2}" alt="Line-up ${esc(s.title)}" loading="lazy" decoding="async"></figure>` : ""}
  </section>

  <nav class="dj-nav so-nav" aria-label="Autres soirées">
    ${prev ? `<a class="dj-nav-link dj-nav-link--prev" href="${prev.slug}.html" data-pop data-cursor="Soirée" aria-label="Soirée précédente : ${esc(prev.title)}"><span class="dj-nav-dir">‹‹‹ ${esc(info(prev).short)}</span><span class="dj-nav-name">${esc(prev.title)}</span></a>` : "<span></span>"}
    <div class="dj-nav-mid"><a class="btn" href="../soirees.html#archives">Toutes les soirées</a></div>
    ${next ? `<a class="dj-nav-link dj-nav-link--next" href="${next.slug}.html" data-pop data-cursor="Soirée" aria-label="Soirée suivante : ${esc(next.title)}"><span class="dj-nav-dir">${esc(info(next).short)} ›››</span><span class="dj-nav-name">${esc(next.title)}</span></a>` : "<span></span>"}
  </nav>

</main>

${footer}<dialog class="so-lightbox" aria-label="Photo agrandie">
  <img alt="">
  <button type="button" class="so-lb-prev" aria-label="Photo précédente">‹</button>
  <button type="button" class="so-lb-next" aria-label="Photo suivante">›</button>
  <button type="button" class="so-lb-close" aria-label="Fermer">×</button>
</dialog>

<script src="../js/config.js?v=8"></script>
<script src="../js/main.js?v=9"></script>
<script src="../js/soiree.js?v=1"></script>
</body>
</html>
`;
}

mkdirSync("soirees", { recursive: true });
list.forEach((s, i) => writeFileSync(`soirees/${s.slug}.html`, page(s, i)));
console.log(`${list.length} pages générées dans soirees/`);
list.forEach((s) => console.log(`  ${s.date}  soirees/${s.slug}.html  ${info(s).photos.length} photo(s)`));
