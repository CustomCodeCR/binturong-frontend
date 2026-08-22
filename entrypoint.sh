#!/bin/sh
set -e

: "${VITE_APP_VERSION:=1.0.2}"
: "${VITE_API_URL:=http://200.234.228.70:8080}"
: "${VITE_API_VERSION:=}"
: "${VITE_APP_NAME:=Binturong}"
: "${VITE_FRONTEND_DOMAIN:=http://200.234.228.70}"
: "${SERVER_NAME:=_}"

cat >/usr/share/nginx/html/env.js <<EOF
window.__APP_CONFIG__ = {
  VITE_APP_VERSION: "$VITE_APP_VERSION",
  VITE_API_URL: "$VITE_API_URL",
  VITE_API_VERSION: "$VITE_API_VERSION",
  VITE_APP_NAME: "$VITE_APP_NAME",
  VITE_FRONTEND_DOMAIN: "$VITE_FRONTEND_DOMAIN"
};
EOF

envsubst '${SERVER_NAME}' \
  </etc/nginx/conf.d/default.conf.template \
  >/etc/nginx/conf.d/default.conf

exec "$@"
