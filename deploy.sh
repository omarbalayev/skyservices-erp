#!/usr/bin/env bash
# SkyServices ERP — local-to-server deploy.
# Usage: bash deploy.sh

set -euo pipefail

SERVER="${ERP_SERVER:-116.203.93.158}"
SSH_KEY="${ERP_SSH_KEY:-$HOME/.ssh/hetzner}"
REMOTE="root@$SERVER"
REMOTE_DIR="/var/www/skyservices-erp/app"

log() { printf "\n\033[1;34m[%s]\033[0m %s\n" "$(date +%H:%M:%S)" "$*"; }

log "[1/5] rsync source to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude 'logs' \
  -e "ssh -i $SSH_KEY" \
  ./ "$REMOTE:$REMOTE_DIR/"

log "[2/5] copy .env.production → server .env..."
if [ -f .env.production ]; then
  scp -i "$SSH_KEY" .env.production "$REMOTE:$REMOTE_DIR/.env"
else
  echo "  (no local .env.production — assuming server already has /var/www/skyservices-erp/app/.env)"
fi

log "[3/5] install deps + prisma generate + migrate + build (on server)..."
ssh -i "$SSH_KEY" "$REMOTE" "bash -s" <<EOF
set -e
cd $REMOTE_DIR
npm ci --omit=dev=false
npx prisma generate
npx prisma migrate deploy
npm run build
EOF

log "[4/5] (re)start PM2..."
ssh -i "$SSH_KEY" "$REMOTE" "bash -s" <<EOF
set -e
cd $REMOTE_DIR
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save
EOF

log "[5/5] health check..."
sleep 2
ssh -i "$SSH_KEY" "$REMOTE" "curl -fsS http://127.0.0.1:3002/api/health" || echo "  (health endpoint not OK — check logs)"

log "Done. https://erp.skyservices.az"
