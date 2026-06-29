"""Serveur de dev statique pour la preview — désactive le cache navigateur
afin que les modifications de CSS/JS/images soient toujours rechargées.
(Usage local uniquement ; non livré sur le site en production.)"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4599
    HTTPServer(("", port), NoCacheHandler).serve_forever()
