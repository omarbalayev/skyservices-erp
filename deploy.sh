#!/usr/bin/env bash
# SkyServices ERP — server-side git-pull deploy.
# Works from Windows Git Bash (no local rsync needed) and from CI.
#
# Strategy:
#   1. Push code to GitHub first  (`git push`)
#   2. Run this script — it SSHes in, pulls the latest commit, installs, builds, restarts PM2.
#   3. The first time only, .env is copied from local .env.production.
#
# Usage:  bash deploy.sh

set -euo pipefail

SERVER="${ERP_SERVER:-116.203.93.158}"
SSH_KEY="${ERP_SSH_KEY:-$HOME/.ssh/hetzner}"
REMOTE="root@$SERVER"
REMOTE_APP="/var/www/skyservices-erp/app"
REPO_URL="https://github.com/omarbalayev/skyservices-erp.git"

log() { printf "\n\033[1;34m[%s]\033[0m %s\n" "$(date +%H:%M:%S)" "$*"; }

# 1. Make sure local commits are pushed.
log "[1/6] checking local branch is pushed..."
LOCAL=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse "@{u}" 2>/dev/null || true)
if [ -n "$REMOTE_HEAD" ] && [ "$LOCAL" != "$REMOTE_HEAD" ]; then
  echo "  ! local HEAD ($LOCAL) != upstream HEAD ($REMOTE_HEAD)"
  echo "    Push first:  git push"
  exit 1
fi
echo "  local @ $LOCAL is pushed."

# 2. Clone or fetch + reset on the server.
log "[2/6] git clone / pull on server..."
ssh -i "$SSH_KEY" "$REMOTE" "bash -s" <<EOF
set -e
if [ ! -d "$REMOTE_APP/.git" ]; then
  echo "  cloning fresh..."
  rm -rf "$REMOTE_APP"
  git clone "$REPO_URL" "$REMOTE_APP"
else
  echo "  pulling..."
  cd "$REMOTE_APP"
  git fetch --all --prune
  git reset --hard origin/main
fi
EOF

# 3. Copy .env.production to server (only if local file exists and server doesn't already have one).
log "[3/6] ensure server .env..."
if [ -f .env.production ]; then
  REMOTE_HAS_ENV=$(ssh -i "$SSH_KEY" "$REMOTE" "[ -f $REMOTE_APP/.env ] && echo yes || echo no")
  if [ "$REMOTE_HAS_ENV" = "no" ]; then
    echo "  uploading .env.production -> server .env"
    scp -i "$SSH_KEY" .env.production "$REMOTE:$REMOTE_APP/.env"
  else
    echo "  server already has .env (leaving untouched). Delete it on the server to re-upload."
  fi
else
  echo "  no local .env.production — skipping (assuming server already has .env)"
fi

# 4. Install + migrate + build.
log "[4/6] npm ci + prisma migrate deploy + build (on server)..."
ssh -i "$SSH_KEY" "$REMOTE" "bash -s" <<EOF
set -e
cd "$REMOTE_APP"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
EOF

# 5. (Re)start PM2.
log "[5/6] (re)start PM2..."
ssh -i "$SSH_KEY" "$REMOTE" "bash -s" <<EOF
set -e
cd "$REMOTE_APP"
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save
EOF

# 6. Health check.
log "[6/6] health check..."
sleep 2
ssh -i "$SSH_KEY" "$REMOTE" "curl -fsS http://127.0.0.1:3002/api/health" || echo "  (health endpoint not yet OK — check pm2 logs skyservices-erp)"

log "Done. https://erp.skyservices.az"
