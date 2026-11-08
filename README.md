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
