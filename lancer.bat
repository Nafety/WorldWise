@echo off
rem Lance le site sur http://localhost:8080 (serveur Python de WSL) et l'ouvre
rem dans le navigateur. Sur localhost, Chrome/Edge proposent d'installer l'application.
rem Fermer la fenetre "Serveur WorldWise" pour arreter.
cd /d "%~dp0"
start "Serveur WorldWise" wsl -d Ubuntu -- python3 -m http.server 8080
timeout /t 2 /nobreak >nul
start "" http://localhost:8080/
