// ============================================================
//  AGENDA : c'est ici qu'on ajoute ou modifie les dates.
//  date  : AAAA-MM-JJ (les dates passées disparaissent toutes seules)
//  lien  : billetterie (Shotgun...). Vide = lien vers Instagram.
// ============================================================
var AGENDA = [
  {
    date: '2026-11-20',
    titre: 'Tout Est Permis',
    lieu: 'La Traverse des Balkis',
    infos: 'Sets courts · entrée gratuite',
    lien: ''
  },
  {
    date: '2026-12-04',
    titre: 'Versatyl X AEM2',
    lieu: 'Florida Palace',
    infos: 'Soirée avec les étudiants en médecine · jusqu\'à 2000 personnes',
    lien: ''
  },
  {
    date: '2026-12-12',
    titre: 'Soirée bounce',
    lieu: 'L\'Estaminet',
    infos: 'Édition thématique bounce',
    lien: ''
  },
  {
    date: '2027-01-08',
    titre: 'Versatyl X Label Seven X 5 46',
    lieu: 'Absolem',
    infos: 'Soirée suivie d\'un after · 14 h de son',
    lien: ''
  }
];

var INSTAGRAM = 'https://www.instagram.com/versatyl_marseille/';

(function () {
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

  function parse(d) {
    var p = d.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ----- Agenda -----
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var upcoming = AGENDA
    .map(function (e) { return Object.assign({}, e, { d: parse(e.date) }); })
    .filter(function (e) { return e.d >= today; })
    .sort(function (a, b) { return a.d - b.d; });

  var list = document.getElementById('events');
  if (list) {
    if (!upcoming.length) {
      list.innerHTML = '<li class="event event--empty">Nouvelles dates bientôt annoncées sur Instagram.</li>';
    } else {
      list.innerHTML = upcoming.map(function (e) {
        var href = e.lien || INSTAGRAM;
        var label = e.lien ? 'Billets' : 'Infos';
        return '<li class="event">' +
          '<p class="event__date"><span class="event__day">' + String(e.d.getDate()).padStart(2, '0') + '</span>' +
          '<span class="event__month">' + JOURS[e.d.getDay()] + ' ' + MOIS[e.d.getMonth()] + ' ' + e.d.getFullYear() + '</span></p>' +
          '<div class="event__body"><h3 class="event__title">' + esc(e.titre) + '</h3>' +
          '<p class="event__place">' + esc(e.lieu) + '</p>' +
          (e.infos ? '<p class="event__infos">' + esc(e.infos) + '</p>' : '') + '</div>' +
          '<a class="btn btn--ghost event__cta" href="' + esc(href) + '">' + label + '</a>' +
          '</li>';
      }).join('');
    }
  }

  var next = document.getElementById('hero-next-event');
  if (next && upcoming.length) {
    var n = upcoming[0];
    next.textContent = String(n.d.getDate()).padStart(2, '0') + '.' + String(n.d.getMonth() + 1).padStart(2, '0') + ' · ' + n.titre;
  }

  // ----- Header : logo central qui apparaît après le hero -----
  var header = document.getElementById('header');
  var hero = document.querySelector('.hero');
  function onScroll() {
    var limit = hero ? hero.offsetHeight - 80 : 0;
    header.classList.toggle('is-solid', window.scrollY > limit);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ----- Menu mobile -----
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) setMenu(false);
  });

  // ----- Diaporama du hero -----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var slides = document.querySelectorAll('.hero__slides img');
  if (!reduce && slides.length > 1) {
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 6000);
  }
})();
