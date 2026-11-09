# WorldWise

Apprendre les drapeaux, les capitales et la carte des pays du monde.
Site 100 % statique (HTML, CSS, JS), installable comme application (PWA) et utilisable hors ligne.

## Lancer en local

Double-cliquer sur `lancer.bat`, ou servir le dossier avec n'importe quel serveur statique :

    python3 -m http.server 8080

## Déployer sur Cloudflare (Workers, depuis GitHub)

1. Pousser ce dossier dans un dépôt GitHub.
2. Tableau de bord Cloudflare → *Workers & Pages* → *Create* → *Import a repository* → choisir le dépôt.
3. Laisser la commande de build vide ; commande de déploiement : `npx wrangler deploy`.
4. Chaque push sur `main` redéploie le site automatiquement.

`wrangler.jsonc` publie le dossier comme fichiers statiques ; `.assetsignore` liste ce qui n'est
pas publié ; `_headers` empêche la page et le service worker de rester bloqués en cache.

Après une modification, augmenter le numéro de `CACHE` dans `sw.js` pour que les téléphones
où l'application est installée récupèrent la nouvelle version.
