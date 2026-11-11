"""Serveur local du site (lancé par lancer.bat), sur http://localhost:8080.

Le serveur de base de Python laisse le navigateur garder les fichiers en cache
à sa guise : après une modification, l'ancien code peut rester affiché même en
rechargeant. Celui-ci demande de toujours revérifier, comme Cloudflare en ligne.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class Gestionnaire(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".webmanifest": "application/manifest+json"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


print(f"WorldWise sur http://localhost:{PORT}/ (fermer la fenêtre pour arrêter)")
ThreadingHTTPServer(("", PORT), partial(Gestionnaire, directory=str(RACINE))).serve_forever()
