#!/bin/bash
# SessionStart hook — prepare a fresh remote session.
#
# Two jobs, both learned from this session actually needing them:
#
# 1. INSTALL DEPENDENCIES. A fresh clone has no node_modules, and the very first
#    `npm run build` in that state dies inside scripts/optimize-images.cjs with
#    MODULE_NOT_FOUND for sharp — which reads like a broken build script rather
#    than a missing install. The Astro site has its own package.json and its own
#    tree; Netlify installs it separately and so must we, or `astro build` fails
#    the same way.
#
# 2. MATERIALISE GSC CREDENTIALS. The Search Console MCP server declared in
#    .mcp.json needs a service-account key as a file on disk. The key lives in
#    the environment's secrets as GSC_SERVICE_ACCOUNT_JSON — never in git — so
#    the hook writes it out at 600. See docs/seo-routines/README.md.
#
# Neither job may fail the session. A missing SEO secret is normal for local and
# outside contributors; the hook says so and moves on.

set -euo pipefail

# Local sessions manage their own node_modules — only run in the remote/web env.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# umask first, so the key is never world-readable even between write and chmod.
if [ -n "${GSC_SERVICE_ACCOUNT_JSON:-}" ]; then
  (
    umask 077
    printf '%s' "$GSC_SERVICE_ACCOUNT_JSON" > "$HOME/.gsc-credentials.json"
  )
  chmod 600 "$HOME/.gsc-credentials.json"
  echo "[session-start] wrote ~/.gsc-credentials.json (chmod 600)"
else
  echo "[session-start] GSC_SERVICE_ACCOUNT_JSON not set — skipping GSC credentials"
fi

echo "[session-start] installing root dependencies…"
npm install --no-audit --no-fund

# The Astro site is a separate package with its own lockfile. netlify.toml's
# build command runs `cd astro-site && npm install` for exactly this reason.
echo "[session-start] installing astro-site dependencies…"
npm install --prefix astro-site --no-audit --no-fund

echo "[session-start] ready."
