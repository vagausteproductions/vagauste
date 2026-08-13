#!/usr/bin/env bash
# Vagausté auto-deploy watcher — v2 me koi bhi save → auto commit + push → GitHub Pages live
# Usage: bash ~/projects/vagauste-v2/auto-deploy.sh   (background me chalao)
cd ~/projects/vagauste-v2 || exit 1

echo "[auto-deploy] watching v2 — har save pe push hoga (Ctrl+C to stop)"

while true; do
  if [ "$(git status --porcelain | wc -l)" -gt 0 ]; then
    sleep 4  # debounce — consecutive saves ek hi commit me
    git add -A
    if ! git diff --cached --quiet; then
      git commit -q -m "auto: $(date '+%Y-%m-%d %H:%M')"
      git push -q origin main 2>&1 | grep -v "Everything up-to-date" || true
      echo "[auto-deploy] pushed $(date '+%H:%M:%S')"
    fi
  fi
  sleep 3
done
