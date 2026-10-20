@echo off
cd /d "%~dp0"
echo === Soumission ST v2 - demarrage ===
if not exist node_modules (
  echo Installation des dependances...
  npm install
)
echo.
echo Serveur sur http://localhost:3100
start "" http://localhost:3100
npm run dev
