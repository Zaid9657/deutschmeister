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

# HyperFrames (heygen-com/hyperframes) — write HTML, render MP4: the video lane
# for Telegram/social clips. Added 2026-09-27 on the owner's explicit approval.
# Best-effort like every install above it: never fails the session, reinstalled
# each session because the container is ephemeral. Three parts — FFmpeg (the
# encoder), the core skills (the /hyperframes router plus its domain skills;
# creation workflows install on demand), and a background pre-warm of the pinned
# CLI and its headless Chrome so the first render does not pay for the download.
# Pinned to a release tag — bump deliberately, never track main.
# Known trap: scaffolded compositions load GSAP from cdn.jsdelivr.net, which the
# agent proxy blocks, and the render then fails with sub_timeline_script_failure.
# Vendor it instead: `npm i gsap` and point the <script src> at the local copy.
HYPERFRAMES_PIN="0.8.81"
SKILLS_CLI_PIN="skills@1.7.0"
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[session-start] installing ffmpeg…"
  if { apt-get install -y -qq ffmpeg || { apt-get update -qq && apt-get install -y -qq ffmpeg; }; } \
    > "$HOME/.ffmpeg-install.log" 2>&1; then
    echo "[session-start] ffmpeg installed"
  else
    echo "[session-start] ffmpeg install failed — see ~/.ffmpeg-install.log; video rendering unavailable this session"
  fi
fi
if [ -f "$HOME/.claude/skills/hyperframes/SKILL.md" ]; then
  echo "[session-start] hyperframes skills already installed"
else
  echo "[session-start] installing hyperframes skills (v${HYPERFRAMES_PIN})…"
  _hf_skills=""
  for _s in hyperframes hyperframes-core hyperframes-cli hyperframes-animation hyperframes-audio \
    hyperframes-creative hyperframes-keyframes hyperframes-registry hyperframes-studio media-use; do
    _hf_skills="$_hf_skills --skill $_s"
  done
  if _hf_tmp=$(mktemp -d) \
    && git clone -q --depth 1 --filter=blob:none --sparse --branch "v${HYPERFRAMES_PIN}" \
      https://github.com/heygen-com/hyperframes "$_hf_tmp/hf" > "$HOME/.hyperframes-install.log" 2>&1 \
    && git -C "$_hf_tmp/hf" sparse-checkout set skills >> "$HOME/.hyperframes-install.log" 2>&1 \
    && npx -y "$SKILLS_CLI_PIN" add "$_hf_tmp/hf" $_hf_skills -g -a claude-code -y \
      >> "$HOME/.hyperframes-install.log" 2>&1; then
    echo "[session-start] hyperframes skills installed"
  else
    echo "[session-start] hyperframes install failed — see ~/.hyperframes-install.log; /hyperframes unavailable this session"
  fi
  rm -rf "${_hf_tmp:-}" 2>/dev/null || true
fi
(npx -y "hyperframes@${HYPERFRAMES_PIN}" browser ensure || true) >/dev/null 2>&1 &
echo "[session-start] warming hyperframes CLI + Chrome in background"

echo "[session-start] ready."
