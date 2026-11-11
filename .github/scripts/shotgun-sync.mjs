/* ==========================================================
   VERSATYL — ajoute les dates Shotgun dans soirees.html
   Lancé par .github/workflows/shotgun-sync.yml (pas besoin de le lancer à la main).

   - lit shotgun-events.json (réponse de l'API Shotgun, téléchargée par le workflow)
   - garde les événements à venir, publiés, non annulés
   - ignore ceux dont la date a déjà une carte écrite à la main dans la page
   - réécrit uniquement la zone entre <!-- SHOTGUN:DEBUT --> et <!-- SHOTGUN:FIN -->

   Les cartes écrites à la main restent prioritaires : pour personnaliser une date
   (texte, tags), écris sa carte à la main, elle remplacera la carte automatique.
   ========================================================== */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "soirees.html";
const START = "<!-- SHOTGUN:DEBUT -->";
const END = "<!-- SHOTGUN:FIN -->";

// Nom du lieu sur Shotgun → clé utilisée par la carte de Marseille (js/soirees-map.js)
const VENUES = [
  [/absolem|voûtes de la major|voutes de la major/i, "absolem", "Absolem", "Club · Marseille 2e"],
  [/danceteria|18,? rue saint-sa/i, "danceteria", "Danceteria", "Club · Marseille 1er"],
  [/man\s?ray/i, "manray", "Manray", "Club · Marseille 1er"],
  [/balkis|traverse|trois rois/i, "traverse", "La Traverse des Balkis", "Bar · Marseille 6e"],
  [/nucl[ée]aire|poggioli/i, "nucleaire", "Le Nucléaire", "Bar · Marseille 6e"],
  [/estaminet/i, "estaminet", "L'Estaminet", "Club · Marseille 6e"],
  [/florida|mireille lauze/i, "florida", "Florida Palace", "Salle · Marseille 10e"]
];
const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const raw = JSON.parse(readFileSync("shotgun-events.json", "utf8"));
const list = Array.isArray(raw) ? raw : raw.data || raw.events || raw.items || raw.results || [];
if (!Array.isArray(list)) throw new Error("Réponse Shotgun inattendue : pas de liste d'événements.");
console.log(`Shotgun : ${list.length} événement(s) à venir reçu(s).`);
for (const e of list) console.log(`  - ${e.startTime || "?"} ${e.name || "?"} @ ${(e.geolocation && e.geolocation.street) || "?"}`);

const pick = (o, ...keys) => { for (const k of keys) { const v = k.split(".").reduce((x, p) => (x == null ? x : x[p]), o); if (v) return v; } return ""; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const strip = (s) => String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const short = (s, n = 220) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);

// Date du soir de l'événement, à l'heure de Marseille (un after à 5h compte pour ce jour-là)
const parisDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const today = parisDay(new Date());

let html = readFileSync(PAGE, "utf8");
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < a) throw new Error(`Repères ${START} / ${END} introuvables dans ${PAGE}.`);
const outside = html.slice(0, a) + html.slice(b);
const handDates = new Set([...outside.matchAll(/class="up-card[^"]*"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]));

const events = list
  // l'API renvoie publishedAt (null = brouillon) et cancelledAt (rempli = annulé)
  .filter((e) => !pick(e, "cancelledAt", "canceledAt", "deletedAt") && !("publishedAt" in e && !e.publishedAt))
  .map((e) => {
    const start = new Date(pick(e, "startTime", "startDate", "start_time", "startsAt", "start"));
    if (isNaN(start)) return null;
    // Shotgun donne l'adresse (geolocation.street), pas toujours le nom du lieu :
    // on cherche le lieu dans le nom du lieu, l'adresse et le nom de l'événement
    const venueTxt = strip(pick(e, "geolocation.venue", "venue.name", "venue", "location.name", "place.name"));
    const where = [venueTxt, pick(e, "geolocation.street"), pick(e, "name", "title")].join(" ");
    const v = VENUES.find(([re]) => re.test(where));
    const slug = pick(e, "slug");
    return {
      date: parisDay(start),
      wd: JOURS[new Date(parisDay(start) + "T12:00:00Z").getUTCDay()],
      name: strip(pick(e, "name", "title")),
      url: pick(e, "url", "eventUrl", "link", "shotgunUrl") || (slug ? `https://shotgun.live/fr/events/${slug}` : ""),
      info: short(strip(pick(e, "description", "summary", "shortDescription"))),
      venueKey: v ? v[1] : "",
      venueName: v ? v[2] : venueTxt || "Marseille",
      venueSub: v ? v[3] : strip(pick(e, "geolocation.city", "city")) || ""
    };
  })
  .filter((e) => e && e.name && e.date >= today && !handDates.has(e.date))
  .sort((x, y) => x.date.localeCompare(y.date));

const card = (e) => {
  const [y, m, d] = e.date.split("-");
  return `      <article class="up-card" id="date-${e.date}" data-date="${e.date}"${e.venueKey ? ` data-venue="${e.venueKey}"` : ""} data-cursor="Soirée" data-shotgun-auto>
        <div class="up-top">
          <span class="up-place">${esc(e.venueName)}</span>
          <span class="up-count"></span>
        </div>
        <div class="up-when">
          <time class="up-date" datetime="${e.date}">${d}.${m}<small>.${y.slice(2)}</small></time>
          <span class="up-wd">${e.wd}</span>
        </div>
        <div class="up-body">
          <h3 class="up-name">${esc(e.name)}</h3>
          <p class="up-venue">${esc(e.venueName)}${e.venueSub ? ` <span>${esc(e.venueSub)}</span>` : ""}</p>
          ${e.info ? `<p class="up-info">${esc(e.info)}</p>\n          ` : ""}<a class="btn" ${e.url ? `href="${esc(e.url)}"` : `data-shotgun href="#"`} target="_blank" rel="noopener">Billetterie Shotgun <span aria-hidden="true">↗</span></a>
        </div>
      </article>
`;
};

const zone = `${START}\n${events.map(card).join("")}      `;
const next = html.slice(0, a) + zone + html.slice(b);
if (next !== html) {
  writeFileSync(PAGE, next);
  console.log(`${events.length} date(s) Shotgun ajoutée(s) automatiquement :`, events.map((e) => `${e.date} ${e.name}`).join(" | ") || "aucune");
} else {
  console.log("Rien de nouveau sur Shotgun.");
}
