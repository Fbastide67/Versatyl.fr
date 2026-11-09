/* ==========================================================
   VERSATYL — réglages du site
   Modifie seulement ce fichier pour changer les liens.
   ========================================================== */
window.VERSATYL_CONFIG = {
  // Lien de la boutique de vêtements (page GitHub). Tous les boutons
  // "Boutique" / "Collection" du site pointent ici.
  shopUrl: "https://versatyl.fr/shopping",

  instagram: "https://www.instagram.com/versatyl_marseille/",
  tiktok: "https://www.tiktok.com/@versatyl_marseille",
  email: "versatyl.marseille@gmail.com",

  // Billetterie : page organisateur Shotgun (toutes les dates en vente)
  shotgun: "https://shotgun.live/fr/venues/versatyl-marseille",

  // Vidéos qui passent dans le logo (dossier assets/video).
  // Le haut de la page montre Absolem, la suite montre Danceteria.
  videos: {
    absolem: ["absolem-3", "absolem-2", "absolem-6", "absolem-4", "absolem-5", "absolem-1"],
    danceteria: ["danceteria-2", "danceteria-1", "danceteria-4", "danceteria-3", "danceteria-5", "danceteria-6"]
  },

  // Mots qui défilent derrière le gros logo (chaque rangée les mélange).
  // Sans accents : la police Redband ne les a pas.
  heroWords: [
    "Absolem", "Danceteria", "Manray", "Le Nucleaire", "Traverse des Balkis", "Estaminet",
    "Marseille", "Soleil", "Soiree", "After", "Dancefloor", "Versatyl",
    "Techno", "Hardtechno", "Trance", "Indus", "Schranz", "Hardgroove",
    "Acid", "House", "Hardcore", "Minimal", "Indie dance"
  ],

  // Durée d'affichage d'un clip avant de passer au suivant (ms)
  clipDuration: 6500
};
