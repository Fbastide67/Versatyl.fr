/* ==========================================================
   VERSATYL — les soirées passées (une page chacune dans soirees/)
   Pour ajouter une soirée : copie un bloc, change les infos,
   mets les photos dans assets/img/soirees/<slug>/01.jpg, 02.jpg…
   puis lance :  node tools/build-soirees.mjs
   ========================================================== */

export const VENUES = {
  absolem:    { name: "L'Absolem",              sub: "Club · Marseille 2e", addr: "40 boulevard Jacques Saadé, 13002 Marseille" },
  danceteria: { name: "Danceteria",             sub: "Club · Marseille 1er", addr: "18 rue Saint-Saëns, 13001 Marseille" },
  manray:     { name: "Manray",                 sub: "Club · Marseille 1er", addr: "38 rue Saint-Saëns, 13001 Marseille" },
  traverse:   { name: "La Traverse des Balkis", sub: "Bar · Marseille 6e",   addr: "1 rue des Trois Rois, 13006 Marseille" },
  nucleaire:  { name: "Le Nucléaire",           sub: "Bar · Marseille 6e",   addr: "Rue André Poggioli, 13006 Marseille" },
  estaminet:  { name: "L'Estaminet",            sub: "Club · Marseille 6e",  addr: "Notre-Dame-du-Mont, 13006 Marseille" }
};

// photos: nombre de photos dans assets/img/soirees/<slug>/ (01.jpg → NN.jpg)
// extra:  photos déjà présentes ailleurs sur le site
// stills: true si les images sont des captures de vidéos (qualité plus basse)
export const SOIREES = [
  {
    slug: "after-absolem-3", date: "2026-11-07", title: "After #3", full: "After Versatyl Absolem 3", venue: "absolem",
    hours: "5h – 12h", price: "10 € en prévente · 12 € sur place",
    shotgun: "https://shotgun.live/fr/events/after-versatyl-absolem-3",
    tags: ["Psytrance", "Techno", "Tribe", "Acid techno"],
    lineup: [["DJMX", "Acid techno"], ["Pils", "Psytrance / tribe"], ["Chris Gavin", "Techno"], ["Horace", "Techno"], ["VKNØ", "Psytrance / techno"]],
    text: [
      "Jamais deux sans trois : Versatyl reprend les commandes de l'Absolem dès 5h du matin pour un after jusqu'à midi.",
      "Sept heures de son non-stop, entre kicks acides, textures hypnotiques et envolées mélodiques, pour accompagner les corps et les esprits jusqu'au zénith."
    ],
    photos: 0
  },
  {
    slug: "after-absolem-2", date: "2026-10-25", title: "After Party #2", full: "After Versatyl Absolem 2", venue: "absolem",
    hours: "5h – 12h", price: "10 € en prévente · 12 € sur place",
    shotgun: "https://shotgun.live/fr/events/after-versatyl-absolem-2",
    poster: "after-party-absolem_affiche.jpg",
    tags: ["Mentalcore", "Acid techno", "Techno", "Hypnotic techno", "Hard groove", "Indie dance"],
    lineup: [["Kpitch", "Melodic techno"], ["Horace", "Mental acide"], ["DJMX", "Acid techno"], ["Immek b2b Vesti", "Hypnotique techno / groove"], ["Phred Noir", "Indie dance"], ["Olive Whoc", "Minimal progressive"]],
    text: [
      "Pour prolonger le week-end jusqu'au bout de la matinée, Versatyl réinvestit l'Absolem le dimanche 25 octobre : sept heures de son, de 5h à midi.",
      "Une exploration techno et ses sous-genres : kicks acides, textures hypnotiques, rythmiques indie dance et montées mélodiques."
    ],
    photos: 0
  },
  {
    slug: "versatyl-x-absolem", date: "2026-09-24", title: "Versatyl x L'Absolem", full: "Versatyl X Absolem", venue: "absolem",
    hours: "22h – 4h", capacity: "400 personnes",
    shotgun: "https://shotgun.live/fr/events/versatyl-x-absolem",
    poster: "affiche-absolem-24sept.jpg",
    tags: ["Hard techno", "Techno", "Bounce", "Hard trance", "Trance"],
    lineup: [["Zadix"], ["Les Garçons Pleurent"], ["Djoga"], ["DJMX b2b Nofame"], ["Tetris"], ["Fefoz"]],
    text: [
      "La plus grosse soirée organisée par Versatyl : six heures de son à l'Absolem, avec une line-up progressive qui part de la trance pour finir sur des sonorités industrielles.",
      "Des artistes venus de toute la France, plusieurs pour leur première date à Marseille."
    ],
    photos: 2, stills: true,
    extra: ["photos/absolem_01.jpg", "photos/absolem_02.jpg", "photos/absolem_03.jpg", "photos/absolem_04.jpg", "photos/absolem_05.jpg", "photos/absolem_06.jpg", "photos/absolem_07.jpg", "photos/absolem_08.jpg", "photos/absolem_09.jpg", "photos/absolem_10.jpg"],
    credit: "Photos @rtphotographie_ · captures vidéo"
  },
  {
    slug: "tout-est-permis-2", date: "2026-09-12", title: "Tout est permis²", venue: "traverse",
    capacity: "120 personnes · entrée libre",
    poster: "affiche-tout-est-permis-2.jpg", poster2: "affiche-lineup-tout-est-permis-2.jpg",
    tags: ["Groovy", "Solaire", "Hard techno", "Indus", "Hardcore"],
    lineup: [],
    text: [
      "Deuxième édition de Tout est permis à la Traverse des Balkis : des sets courts, de 30 à 45 minutes, qui s'enchaînent sans temps mort.",
      "La courbe part groovy et solaire, passe par la hard techno et l'indus, et finit en hardcore."
    ],
    photos: 8, credit: "Photos © Shainese Carlevaris"
  },
  {
    slug: "danceteria-chapitre-3", date: "2026-09-03", title: "Danceteria : Chapitre 3", venue: "danceteria",
    hours: "0h – 6h", capacity: "300 personnes · 2 salles",
    poster: "affiche-danceteria-chapitre3.jpg",
    tags: ["House", "Trance", "Techno", "Hardtechno", "Indus"],
    lineup: [["DJ Tiger", "Salle 1 · house"]],
    text: [
      "Troisième Danceteria de Versatyl, sur deux salles de minuit à 6h.",
      "Salle 1 en house, tenue par DJ Tiger. Salle 2 en trance, techno, hardtechno et indus."
    ],
    photos: 12,
    extra: ["photos/danceteria3_01.jpg", "photos/danceteria3_02.jpg", "photos/danceteria3_03.jpg", "photos/danceteria3_04.jpg", "photos/danceteria3_05.jpg", "photos/danceteria3_06.jpg", "photos/danceteria3_07.jpg", "photos/danceteria3_08.jpg", "photos/danceteria3_09.jpg", "photos/danceteria3_10.jpg"],
    credit: "Photos @rtphotographie_"
  },
  {
    slug: "after-party-30-aout", date: "2026-08-30", title: "After Party", full: "After Party · premier after", venue: "absolem",
    hours: "5h – 12h",
    poster: "affiche-after-party-30aout.jpg",
    tags: ["Hardtechno", "Acid", "Mélodique", "Hypnotique", "Solaire"],
    lineup: [["FLVØ"], ["Leko"], ["Anthony Capaldi"], ["P!NKY"], ["DJ Tiger"]],
    text: [
      "Le tout premier after Versatyl, à l'Absolem de 5h à midi.",
      "Le concept : la courbe inversée. On attaque fort en hardtechno et acid, puis on redescend vers le mélodique, l'hypnotique et le solaire à mesure que le jour se lève."
    ],
    photos: 0
  },
  {
    slug: "tout-est-permis", date: "2026-08-21", title: "Tout est permis", venue: "traverse",
    capacity: "120 personnes · entrée libre",
    poster: "_affiche-tout-est-permis-1-rose.jpg",
    tags: ["Groovy", "Solaire", "Hard techno", "Indus", "Hardcore"],
    lineup: [],
    text: [
      "Première édition de Tout est permis à la Traverse des Balkis : des sets courts de 30 à 45 minutes et une courbe qui monte du groovy solaire jusqu'au hardcore."
    ],
    photos: 6
  },
  {
    slug: "danceteria-le-retour", date: "2026-08-13", title: "Danceteria : Le Retour", venue: "danceteria",
    hours: "0h – 6h", capacity: "300 personnes · 2 salles",
    poster: "affiche-danceteria-le-retour-13aout.jpg",
    tags: ["House", "Trance", "Techno", "Hardtechno"],
    lineup: [["DJ Tiger", "Salle 1 · house"]],
    text: [
      "Le retour de Versatyl à la Danceteria, sur deux salles de minuit à 6h : la house de DJ Tiger d'un côté, trance, techno et hardtechno de l'autre."
    ],
    photos: 6, stills: true, credit: "Captures vidéo"
  },
  {
    slug: "traverse-31-juillet", date: "2026-07-31", title: "La Traverse des Balkis", venue: "traverse",
    hours: "19h – 1h", capacity: "120 personnes · entrée libre",
    poster: "affiche-traverse-balkis-31juil.jpg",
    tags: ["Trance bouncy", "Disco", "Hard bounce", "Hard techno"],
    lineup: [],
    text: ["Versatyl au bar de la Traverse des Balkis, de 19h à 1h, entrée libre."],
    photos: 5, stills: true, credit: "Captures vidéo"
  },
  {
    slug: "manray-techno-vibes", date: "2026-07-19", title: "Manray · Techno Vibes", venue: "manray",
    hours: "23h – 4h", capacity: "100 personnes",
    poster: "affiche-manray-after-coupe-du-monde.jpg",
    tags: ["Hard groove", "Hard bounce", "Hard techno"],
    lineup: [["DJMX"], ["ØKLM"]],
    text: ["Un dimanche soir au Manray, le soir de la finale de la Coupe du monde : hard groove, hard bounce et hard techno de 23h à 4h."],
    photos: 0
  },
  {
    slug: "danceteria-16-juillet", date: "2026-07-16", title: "Danceteria · 1re multi-rooms", venue: "danceteria",
    hours: "0h – 6h", capacity: "300 personnes · 2 salles",
    poster: "affiche-danceteria-16juil.jpg",
    tags: ["House", "Trance", "Techno", "Hardtechno"],
    lineup: [["DJ Tiger", "Salle 1 · house"]],
    text: ["La première soirée multi-rooms de Versatyl : deux salles à la Danceteria, la house d'un côté, la trance, la techno et la hardtechno de l'autre."],
    photos: 10, stills: true, credit: "Captures vidéo"
  },
  {
    slug: "traverse-9-juillet", date: "2026-07-09", title: "La Traverse des Balkis", venue: "traverse",
    hours: "19h – 1h", capacity: "120 personnes · entrée libre",
    poster: "affiche-traverse-balkis-9juil-papillon.jpg",
    tags: ["Trance bouncy", "Disco", "Hard bounce", "Hard techno"],
    lineup: [],
    text: ["Versatyl au bar de la Traverse des Balkis, de 19h à 1h, entrée libre."],
    photos: 4, stills: true, credit: "Captures vidéo"
  },
  {
    slug: "immersion-noire", date: "2026-06-28", title: "L'Immersion Noire", venue: "manray",
    hours: "23h – 4h", capacity: "100 personnes",
    poster: "affiche-manray-immersion-noire.jpg",
    tags: ["Hard groove", "Hard bounce", "Hard techno"],
    lineup: [["VOXPOP"], ["DJMX"], ["DigiOxy"]],
    text: ["Première date de Versatyl au Manray, un dimanche soir : une immersion noire en hard groove, hard bounce et hard techno."],
    photos: 0
  },
  {
    slug: "estaminet-24-juin", date: "2026-06-24", title: "L'Estaminet", venue: "estaminet",
    hours: "Jusqu'à 8h", capacity: "100 personnes",
    poster: "affiche-estaminet-24juin.jpg",
    tags: ["Trance", "Hardgroove", "Hard techno", "Schranz", "Hard music"],
    lineup: [["DJMX"], ["Ematrikx"], ["Fefoz"], ["Ma6tek"], ["Nofame"], ["Philiot"], ["Rodin"]],
    text: ["Un marathon jusqu'à 8h du matin à l'Estaminet : trance et hardgroove pour commencer, puis hard techno, schranz et hard music."],
    photos: 0
  },
  {
    slug: "nucleaire-acte-3", date: "2026-06-13", title: "Nucléaire · Acte III", venue: "nucleaire",
    capacity: "100 personnes",
    poster: "affiche-nucleaire-acte3.jpg",
    tags: ["Trance", "Hard techno", "Indus"],
    lineup: [],
    text: ["Troisième édition au Nucléaire, le bar où tout a commencé : trance, hard techno et indus."],
    photos: 0
  },
  {
    slug: "traverse-acte-3", date: "2026-05-21", title: "Traverse · Acte III", venue: "traverse",
    hours: "19h – 1h", capacity: "120 personnes · entrée libre",
    poster: "affiche-acte3-traverse-21mai.jpg",
    tags: ["Trance bouncy", "Disco", "Hard bounce", "Hard techno"],
    lineup: [],
    text: ["Première date de Versatyl à la Traverse des Balkis, avec 89 intéressés sur Shotgun : trance bouncy, disco, hard bounce et hard techno."],
    photos: 3
  },
  {
    slug: "nucleaire-acte-2", date: "2026-05-09", title: "Nucléaire · Acte II", venue: "nucleaire",
    capacity: "100 personnes",
    poster: "affiche-acte2-nucleaire-9mai.jpg",
    tags: ["Trance", "Hard techno", "Indus"],
    lineup: [],
    text: ["Deuxième soirée Versatyl au Nucléaire : trance, hard techno et indus."],
    photos: 6
  },
  {
    slug: "premiere-soiree", date: "2026-03-13", title: "Première soirée", venue: "nucleaire",
    capacity: "100 personnes",
    poster: "affiche-premiere-soiree-nucleaire-13mars.jpg",
    tags: ["Trance", "Hard techno", "Indus"],
    lineup: [["Okram"], ["Fefoz"], ["DJMX"], ["Nofame"]],
    text: ["Là où tout a commencé : la toute première soirée Versatyl, au Nucléaire, devant une centaine de personnes."],
    photos: 0
  }
];
