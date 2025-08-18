#!/usr/bin/env bash
# DMT Risk Assessment Platform - Native Ubuntu Installer (Basic Auth Mode)
# This script installs all dependencies and sets up the app as a PM2 service
# Tested on Ubuntu 22.04/24.04. Run as a normal user (not root); it will sudo as needed.

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_VERSION_MAJOR=20

msg() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
ok()  { echo -e "\033[1;32m[OK]  \033[0m $*"; }
warn(){ echo -e "\033[1;33m[WARN]\033[0m $*"; }
err() { echo -e "\033[1;31m[ERR] \033[0m $*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing command: $1"; return 1; }
}

install_deps() {
  msg "Updating apt and installing base packages..."
  sudo apt-get update -y
  sudo apt-get install -y curl git build-essential ca-certificates gnupg jq sqlite3

  if ! command -v node >/dev/null 2>&1; then
    msg "Installing Node.js ${NODE_VERSION_MAJOR}.x..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION_MAJOR}.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    ok "Node.js already present: $(node -v)"
  fi

  if ! command -v pm2 >/dev/null 2>&1; then
    msg "Installing PM2 globally..."
    sudo npm install -g pm2@latest
  else
    ok "PM2 already present: $(pm2 -v)"
  fi
}

setup_project() {
  cd "$APP_DIR"
  msg "Installing npm dependencies..."
  npm ci || npm install

  msg "Building project (vite build)..."
  npm run build

  msg "Preparing runtime directories..."
  mkdir -p "$APP_DIR/logs" "$APP_DIR/database"
  chmod 755 "$APP_DIR/logs" "$APP_DIR/database"
}

init_db() {
  msg "Initializing SQLite database (migrations + seed if empty)..."
  node -e "import('./src/database/sqlite.js').then(m=>m.initializeDatabase()).then(()=>console.log('DB OK')).catch(e=>{console.error(e);process.exit(1)})"
}

create_pm2() {
  cd "$APP_DIR"
  msg "Starting app with PM2..."
  pm2 start ecosystem.config.cjs --only grc-native || true
  pm2 save
  pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null || true
  ok "PM2 service created. To manage: pm2 list | pm2 logs grc-native --nostream"
}

post_checks() {
  sleep 2
  msg "Health check:"
  if curl -fsS http://localhost:3000/health >/dev/null; then
    ok "App is reachable at http://localhost:3000"
  else
    warn "App not yet reachable. Check logs: pm2 logs grc-native --nostream"
  fi
}

main() {
  if [ "$(id -u)" -eq 0 ]; then
    err "Do not run as root. Re-run as a normal user."
    exit 1
  fi
  msg "Installing DMT Risk Assessment Platform (native, basic-auth)..."
  install_deps
  setup_project
  init_db
  create_pm2
  post_checks
  ok "Installation complete. Open http://localhost:3000 and login with admin / demo123"
}

main "$@"
