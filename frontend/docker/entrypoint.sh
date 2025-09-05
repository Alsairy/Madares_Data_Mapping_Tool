#!/usr/bin/env sh
set -eu

API_BASE_URL="${API_BASE_URL:-}"
TEMPLATE_PATH="/usr/share/nginx/html/config.json.template"
TARGET_PATH="/usr/share/nginx/html/config.json"

if [ -f "$TEMPLATE_PATH" ]; then
  sed "s|__API_BASE_URL__|$API_BASE_URL|g" "$TEMPLATE_PATH" > "$TARGET_PATH"
else
  cp -f /usr/share/nginx/html/config.json "$TARGET_PATH" 2>/dev/null || true
fi

exec nginx -g 'daemon off;'
