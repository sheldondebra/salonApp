#!/usr/bin/env bash
# Quick auth smoke test — run from repo root while `php artisan serve` is up.
set -euo pipefail

API="${API_BASE:-http://127.0.0.1:8000}"
EMAIL="${1:-owner@luxebloom.demo}"
PASSWORD="${2:-password}"

echo "==> API: $API"
echo "==> User: $EMAIL"
echo ""

echo "--- 1) Health ---"
HEALTH=$(curl -s -w "\n%{http_code}" "$API/api/v1/health" || true)
HTTP=$(echo "$HEALTH" | tail -1)
BODY=$(echo "$HEALTH" | sed '$d')
if [ "$HTTP" != "200" ]; then
  echo "FAILED (HTTP $HTTP). Is Laravel running?"
  echo "  cd backend-laravel && php artisan serve"
  exit 1
fi
echo "$BODY"
echo "OK"
echo ""

echo "--- 2) Login ---"
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$API/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
HTTP=$(echo "$LOGIN" | tail -1)
BODY=$(echo "$LOGIN" | sed '$d')
if command -v jq >/dev/null 2>&1; then echo "$BODY" | jq .; else echo "$BODY"; fi

if [ "$HTTP" != "200" ]; then
  echo ""
  echo "LOGIN FAILED (HTTP $HTTP). Run: php artisan db:seed"
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  TOKEN=$(echo "$BODY" | jq -r '.token // empty')
else
  TOKEN=$(echo "$BODY" | php -r '$j=json_decode(stream_get_contents(STDIN),true); echo $j["token"]??"";' 2>/dev/null || true)
fi
if [ -z "$TOKEN" ]; then
  echo "LOGIN FAILED: no token in response"
  exit 1
fi
echo "OK (token received)"
echo ""

SLUG="${3:-luxe-bloom}"
echo "--- 3) Tenant abilities ($SLUG) ---"
ABILITIES=$(curl -s -w "\n%{http_code}" "$API/api/v1/$SLUG/auth/abilities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
HTTP=$(echo "$ABILITIES" | tail -1)
BODY=$(echo "$ABILITIES" | sed '$d')
if command -v jq >/dev/null 2>&1; then echo "$BODY" | jq .; else echo "$BODY"; fi

if [ "$HTTP" != "200" ]; then
  echo ""
  echo "ABILITIES FAILED (HTTP $HTTP)"
  exit 1
fi

if echo "$BODY" | grep -qE '"roles"\s*:\s*\[\s*\]'; then
  echo ""
  echo "WARNING: roles are empty. Run: cd backend-laravel && php artisan migrate"
  exit 1
fi

echo ""
echo "All checks passed."
