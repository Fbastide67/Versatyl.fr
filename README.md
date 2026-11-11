# versatyl.fr

Site vitrine du collectif techno Versatyl (Marseille). Site statique : HTML, CSS, JS, sans étape de build.

## Mettre en ligne

La publication sur versatyl.fr (OVH) est manuelle : onglet **Actions** → **Publier sur versatyl.fr** → **Run workflow**.
Le workflow envoie ce dépôt à la racine de `www/` sans toucher à `www/shopping/` (la boutique, publiée depuis `versatyl-boutique`).
Il faut le secret `OVH_FTP_PASSWORD` dans *Settings → Secrets and variables → Actions*.

## Modifier

- `js/config.js` : lien boutique, réseaux, e-mail, liste des vidéos qui passent dans le logo.
- `assets/video` : clips Absolem / Danceteria (7 s, sans son).
- `assets/img` : logo, affiches, photos de soirée (@rtphotographie_), cartes des DJ résidents.
- `assets/fonts` : Redband (titres) et Good Times (texte).

## Tester en local

```bash
python -m http.server 8742
```

Puis ouvrir http://localhost:8742. En ouvrant `index.html` directement (double-clic), le navigateur bloque la vidéo dans le logo 3D : le site passe en mode simplifié.

## Dates Shotgun automatiques

Le workflow **Synchro Shotgun** (`.github/workflows/shotgun-sync.yml`) tourne toutes les heures : il lit les événements sur l'API Shotgun et ajoute dans `soirees.html` (entre `<!-- SHOTGUN:DEBUT -->` et `<!-- SHOTGUN:FIN -->`) chaque date à venir qui n'a pas encore de carte. Si la page change, il la commit et envoie `soirees.html` seul sur OVH.

- Secrets nécessaires : `SHOTGUN_TOKEN` et `SHOTGUN_ORGANIZER_ID` (Smartboard → Settings → Integrations → Shotgun APIs), plus `OVH_FTP_PASSWORD`.
- Une carte écrite à la main pour la même date reste prioritaire : écris-la pour ajouter un texte ou des tags, la carte automatique disparaît.
- Le lieu Shotgun est reconnu par son nom (Absolem, Danceteria, Manray, Balkis, Nucléaire, Estaminet, Florida) pour placer le point sur la carte : liste dans `.github/scripts/shotgun-sync.mjs`.

## Pages des soirées passées

Chaque soirée passée a sa page dans `soirees/` (affiche, défilé de cartes photo, infos, line-up, photos).
Ces pages sont générées : on ne les modifie pas à la main.

1. Ajoute ou modifie la soirée dans `tools/soirees-data.mjs`.
2. Mets ses photos dans `assets/img/soirees/<slug>/01.jpg`, `02.jpg`… (900 px de large suffisent).
3. Lance `node tools/build-soirees.mjs` depuis la racine du site.
4. Sur `soirees.html`, la carte de la soirée dans les archives pointe vers `soirees/<slug>.html`.
