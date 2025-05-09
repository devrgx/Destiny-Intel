#!/bin/bash

# === Konfiguration ===
SERVER_USER="root"
SERVER_IP="217.154.196.66"
REMOTE_PATH="/root/bots/DestinyIntel"
LOG_FILE="deploy.log"

# === Menü anzeigen ===
echo "=== DEPLOY SCRIPT ==="
echo "Wähle eine Option:"
echo "1) Reset GUILD Commands"
echo "2) Reset GLOBAL Commands"
echo "3) Nur Code deployen"
echo "4) Emblem-Scraper ausführen"
echo "5) Alles (Deploy + Reset GUILD + Scraper)"
echo "6) Alles (Deploy + Reset GLOBAL + Scraper)"
echo ""
echo "0) Abbrechen"
echo "======================"
read -p "Deine Wahl: " choice

# === Funktion: Code übertragen + pm2 starten/restart ===
deploy_code() {
  echo "→ Kopiere Code zum Server..."
  rsync -avvv --delete --exclude='.git' --exclude='node_modules' ./ "$SERVER_USER@$SERVER_IP:$REMOTE_PATH"

  echo "→ Installiere dependencies & starte Bot + Webserver via PM2..."
  ssh "$SERVER_USER@$SERVER_IP" << EOF
    set -e
    cd $REMOTE_PATH
    npm install

    if pm2 list | grep -q bot; then
      pm2 restart bot
    else
      pm2 start index.js --name bot
      pm2 startup
      pm2 save
    fi

    if pm2 list | grep -q "oauth-server"; then
      pm2 restart "oauth-server"
    else
      pm2 start server.js --name "oauth-server"
      pm2 startup
      pm2 save
    fi
EOF
}

# === Ausführung je nach Auswahl ===
case "$choice" in
  1)
    echo "→ Führe: npm run reset:guild"
    npm run reset:guild
    deploy_code
    ;;
  2)
    echo "→ Führe: npm run reset:global"
    npm run reset:global
    deploy_code
    ;;
  3)
    echo "→ Nur Code wird deployed."
    deploy_code
    ;;
  4)
    echo "→ Starte Emblem-Scraper lokal..."
    node ./data/scraper_dec.js
    ;;
  5)
    echo "→ Volles Deployment inkl. reset:guild und Scraper..."
    npm run reset:guild
    deploy_code
    echo "→ Starte Emblem-Scraper auf dem Server..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $REMOTE_PATH && node ./data/scraper_dec.js"
    ;;
  6)
    echo "→ Volles Deployment inkl. reset:global und Scraper..."
    npm run reset:global
    deploy_code
    echo "→ Starte Emblem-Scraper auf dem Server..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $REMOTE_PATH && node ./data/scraper_dec.js"
    ;;
  0)
    echo "Abgebrochen."
    exit 0
    ;;
  *)
    echo "❌ Ungültige Eingabe."
    exit 1
    ;;
esac

echo "✅ Vorgang abgeschlossen."