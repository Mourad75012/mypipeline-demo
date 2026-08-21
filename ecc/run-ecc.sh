#!/usr/bin/env bash
# run-ecc.sh — Reproducible execution of the ECC harness (github.com/affaan-m/ecc).
#
# Clones (or refreshes) ECC, installs its Node dependencies, runs its lint and
# test suites, then performs a real selective install into a throwaway HOME and
# verifies the result with the CLI's own diagnostics.
#
# Nothing is written outside WORKDIR: the install target is a sandbox HOME, so
# the caller's ~/.claude is never touched.
#
# Usage: ./ecc/run-ecc.sh [workdir]
#   workdir defaults to ./.ecc-run

set -euo pipefail

ECC_REPO="${ECC_REPO:-https://github.com/affaan-m/ecc}"
ECC_REF="${ECC_REF:-}"                 # optional branch/tag/commit
ECC_PROFILE="${ECC_PROFILE:-core}"     # minimal | core | developer | security | research | full
ECC_TARGET="${ECC_TARGET:-claude}"

WORKDIR="${1:-$(pwd)/.ecc-run}"
CHECKOUT="$WORKDIR/ecc"
SANDBOX_HOME="$WORKDIR/sandbox-home"

log() { printf '\n=== %s ===\n' "$*"; }

log "Environment"
command -v git >/dev/null || { echo "git is required" >&2; exit 1; }
command -v node >/dev/null || { echo "node >=18 is required" >&2; exit 1; }
node -v
npm -v
python3 -V || true

log "Checkout"
mkdir -p "$WORKDIR"
if [ -d "$CHECKOUT/.git" ]; then
  git -C "$CHECKOUT" fetch --depth 1 origin "${ECC_REF:-HEAD}"
  git -C "$CHECKOUT" checkout --force FETCH_HEAD
else
  # LFS objects are not needed for the harness itself; skipping the smudge
  # filter keeps the clone working on hosts without git-lfs installed.
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 \
    ${ECC_REF:+--branch "$ECC_REF"} "$ECC_REPO" "$CHECKOUT"
fi
git -C "$CHECKOUT" --no-pager log -1 --format='commit %H%nsubject %s'
echo "version $(cat "$CHECKOUT/VERSION")"

log "Install dependencies"
(cd "$CHECKOUT" && npm install --no-audit --no-fund --loglevel=error)

log "CLI smoke test"
(cd "$CHECKOUT" && node scripts/ecc.js --help | head -5)

log "Lint (eslint + markdownlint)"
(cd "$CHECKOUT" && npm run lint)

# ECC's own hooks refuse to run outside an interactive harness session. When
# this script itself runs inside one, the inherited CLAUDE_CODE_ENTRYPOINT
# leaks into the test subprocesses and makes the continuous-learning hook tests
# exit early, so pin it to the value the suite assumes.
log "Test suite (validators + tests/run-all.js)"
(cd "$CHECKOUT" && CLAUDE_CODE_ENTRYPOINT=cli npm test | tail -8)

log "Harness audit"
(cd "$CHECKOUT" && npm run harness:audit | tail -14)

log "Install plan (dry run): profile=$ECC_PROFILE target=$ECC_TARGET"
(cd "$CHECKOUT" && node scripts/ecc.js plan --profile "$ECC_PROFILE" --target "$ECC_TARGET" | head -20)

log "Install into sandbox HOME: $SANDBOX_HOME"
rm -rf "$SANDBOX_HOME"
mkdir -p "$SANDBOX_HOME"
(cd "$CHECKOUT" && HOME="$SANDBOX_HOME" node scripts/ecc.js install \
  --profile "$ECC_PROFILE" --target "$ECC_TARGET" | tail -3)
echo "installed files: $(find "$SANDBOX_HOME" -type f | wc -l)"

log "Verify install"
(cd "$CHECKOUT" && HOME="$SANDBOX_HOME" node scripts/ecc.js doctor)
(cd "$CHECKOUT" && HOME="$SANDBOX_HOME" node scripts/ecc.js list-installed)
(cd "$CHECKOUT" && HOME="$SANDBOX_HOME" node scripts/ecc.js status | head -12)

log "ECC execution completed"
