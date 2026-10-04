#!/usr/bin/env bash
# Sub-level course launch, Email 1 (Day 0 announcement).
# STAGED 2026-09-27 by the revenue agent. NOT SENT. Only the owner runs this.
#
# Work order #2, step (d) in docs/SCORECARD.md. The copy and the payload live
# in drafts/launch-sublevel-1.mjs (Email 1 of
# drafts/launch-sublevel-courses-2026-09.md with the 2026-09-27 audit fixes).
# Every price, the Pro window and the exclude list are computed there from
# src/data/pricing.js at run time: derive, never retype.
#
# Mechanics are those of the retired drafts/send-launch-email-1.sh: the site's
# own send-campaign function derives the audience at send time (confirmed
# accounts that have not opted out; nobody has opted IN, see the consent gate
# below), applies `exclude`, appends the per-user HMAC unsubscribe footer, and
# has a true test mode. Never a Resend broadcast.
#
# CONSENT GATE (added 2026-10-04, revenue agent). This email sells a product,
# so it is advertising by email, and nothing in the product records consent to
# that: there is no opt-in at signup and no consent column (the one email
# preference, profiles.email_daily_sentence, is an opt-out), and /privacy/
# section 8 names account and service messages and requested learning emails,
# not offers. The team rule is "promotional mail needs recorded consent (§7
# UWG)" (docs/agents/PROTOCOL.md). So a live run also needs
# LAUNCH_CONSENT_BASIS: the owner's written basis for mailing this audience,
# copied into the live stamp as the record. Deciding it is a legal call.
#
# Exclude: `subscribed` (any live paid or course Pro period) and
# `purchased:<key>` for every product that already owns a level this email
# sells: course_a1_2, course_a2_1, course_a2_2, and the retired bands
# course_a1, course_a2, course_alle. Run `preview` to see the exact list.
#
# ---------------------------------------------------------------------------
# OWNER, IN ORDER (steps a–c of work order #2 come first):
#   0. From the repo root, on an up-to-date main:
#        ./drafts/send-launch-sublevel-1.sh preview
#      Sends nothing and needs no secret. Read the email.
#   1. CAMPAIGN_SECRET=… ./drafts/send-launch-sublevel-1.sh test
#      One email, to send-campaign's TEST_EMAIL only. Open it, click every link.
#   2. Only after the agent has confirmed the €0 A2.1 test purchase (a
#      `course_a2_1` purchases row + the 90-day plan_type='course' Pro row),
#      you have deactivated the 100% code, and every level the email prices
#      shows a Buy button on /pricing/, and you have decided the consent basis
#      (the gate above):
#        CAMPAIGN_SECRET=… LAUNCH_PRECONDITION_VERIFIED=yes \
#        LAUNCH_CONSENT_BASIS='<who decided, when, on what basis>' \
#          ./drafts/send-launch-sublevel-1.sh live
#      You will be asked to type SEND. Run it ONCE.
#
# CAMPAIGN_SECRET is in the Netlify environment variables. Never write it into
# this file.
#
# !!! A SECOND LIVE RUN RE-MAILS EVERYONE. Nothing on the server records who
# received a campaign. This script writes a local stamp BEFORE the live request
# and refuses a second live run while the stamp exists. If the live request
# errors or times out, do NOT rerun: open Resend → Emails and look for this
# subject first. Emails may already be going out.
#
# Audience, measured 2026-09-27: 1,149 confirmed accounts, 1,088 not opted out,
# 8 excluded as subscribed, 0 as course owners → about 1,080 before
# send-campaign's disposable-domain filter. The live response's `sent` should
# be at or just under that; a much larger number means the exclusions failed.
# ---------------------------------------------------------------------------

set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" != "preview" && "$MODE" != "test" && "$MODE" != "live" ]]; then
  echo "usage: $0 preview" >&2
  echo "       CAMPAIGN_SECRET=… $0 test" >&2
  echo "       CAMPAIGN_SECRET=… LAUNCH_PRECONDITION_VERIFIED=yes LAUNCH_CONSENT_BASIS='…' $0 live" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${DM_LAUNCH_STATE_DIR:-$HOME/.deutschmeister-launch}"
TESTED_STAMP="$STATE_DIR/launch-sublevel-1.tested"
LIVE_STAMP="$STATE_DIR/launch-sublevel-1.live-sent"
ENDPOINT="https://deutsch-meister.de/.netlify/functions/send-campaign"

# {subject, body, exclude, hash} from pricing.js. Fails (and sends nothing) on
# any inconsistency rather than mailing a wrong price.
BUILT=$(node "$REPO_ROOT/drafts/launch-sublevel-1.mjs")
field() {
  node -e 'const o = JSON.parse(process.argv[1]); const v = o[process.argv[2]];
    process.stdout.write(typeof v === "string" ? v : JSON.stringify(v));' "$BUILT" "$1"
}
HASH=$(field hash)

if [[ "$MODE" == "preview" ]]; then
  echo "SUBJECT: $(field subject)"
  echo "EXCLUDE: $(field exclude)"
  echo "HASH:    $HASH"
  echo "----- HTML body (send-campaign appends the unsubscribe footer) -----"
  field body; echo
  if [[ -f "$LIVE_STAMP" ]]; then
    echo "NOTE: a live send is already stamped at $LIVE_STAMP:" >&2
    cat "$LIVE_STAMP" >&2
  fi
  exit 0
fi

if [[ -z "${CAMPAIGN_SECRET:-}" ]]; then
  echo "CAMPAIGN_SECRET is not set (Netlify environment variables)" >&2; exit 1
fi

if [[ "$MODE" == "live" ]]; then
  if [[ "${LAUNCH_PRECONDITION_VERIFIED:-}" != "yes" ]]; then
    cat >&2 <<'EOF'
REFUSING LIVE SEND: LAUNCH_PRECONDITION_VERIFIED=yes is not set.

Set it only when ALL of these are true (docs/SCORECARD.md work order #2):
  (a) a new 100% code exists in Lemon Squeezy, restricted to the A2.1 product;
  (b) you bought A2.1 for €0 on /pricing/ with a FRESH account, and the
      A1.2, A2.1 and A2.2 cards there all show a Buy button (a card whose
      checkout id is unset is hidden; the email must not sell a hidden card);
  (c) the agent confirmed the course_a2_1 purchases row and the 90-day
      plan_type='course' Pro row, and you deactivated the code.
An unverified checkout mailed to ~1,080 people is the one mistake this launch
cannot take back.
EOF
    exit 1
  fi
  # Whitespace alone is no record of a decision (review of 9a2a9a71).
  consent_basis="${LAUNCH_CONSENT_BASIS:-}"
  if [[ -z "${consent_basis//[[:space:]]/}" ]]; then
    cat >&2 <<'EOF'
REFUSING LIVE SEND: LAUNCH_CONSENT_BASIS is not set.

This email sells a product, so it is advertising by email. It goes to every
confirmed account that has not opted out, and nothing records that any of them
agreed to receive offers: signup has no opt-in, the only email preference
(profiles.email_daily_sentence) is an opt-out, and /privacy/ section 8 names
account and service messages and requested learning emails, not offers.
The team rule is "promotional mail needs recorded consent (§7 UWG)".
The general route is prior express consent, provable in practice by double
opt-in. The existing-customer route (§ 7 Abs. 3 UWG) is narrow: the address was
obtained by the seller with a sale, the ad is for the seller's own similar
products, the customer has not objected, and a clear notice that they may
object was given at collection AND is repeated in every mail. On 2026-10-04 at
most 11 of the 1,097 accounts counted had ever paid; the addresses were
collected at a free signup without such a notice, so possibly none qualify.

The basis must cover EVERYONE this script mails: it has no "include only"
filter, so a basis that covers some recipients does not make the send lawful
for the rest.

Decide the basis first (a legal call, not an agent's), then write it down:
  LAUNCH_CONSENT_BASIS='<who decided, when, on what basis>'
The text is copied into the live stamp as the record.
EOF
    exit 1
  fi
  if [[ -f "$LIVE_STAMP" && "${LAUNCH_ALLOW_SECOND_LIVE_SEND:-}" != "yes" ]]; then
    echo "REFUSING LIVE SEND: this email was already sent live (stamp: $LIVE_STAMP)." >&2
    cat "$LIVE_STAMP" >&2
    cat >&2 <<'EOF'

A SECOND LIVE RUN RE-MAILS EVERYONE: nothing on the server records campaign
recipients. If you believe the first run sent nothing, check Resend → Emails
for this subject first. Only if it shows no deliveries to the list, rerun with
LAUNCH_ALLOW_SECOND_LIVE_SEND=yes.
EOF
    exit 1
  fi
  if [[ ! -f "$TESTED_STAMP" ]] || [[ "$(head -n1 "$TESTED_STAMP")" != "$HASH" ]]; then
    echo "REFUSING LIVE SEND: this exact copy has not been sent in test mode yet." >&2
    echo "Run '$0 test' first and read the email. Any edit to the copy or to pricing.js needs a new test." >&2
    exit 1
  fi
  cat >&2 <<'EOF'
============================================================================
 LIVE SEND. This mails every confirmed DeutschMeister account that has not
 opted out (about 1,080 on 2026-09-27) minus subscribers and course owners.
 It can be done once. A second live run re-mails everyone.
============================================================================
EOF
  read -r -p 'Type SEND to mail the whole list: ' CONFIRM
  if [[ "$CONFIRM" != "SEND" ]]; then
    echo "Not sent." >&2; exit 1
  fi
fi

TEST_MODE=true
[[ "$MODE" == "live" ]] && TEST_MODE=false

PAYLOAD=$(node -e '
  const [built, testMode] = process.argv.slice(1);
  const { subject, body, exclude } = JSON.parse(built);
  process.stdout.write(JSON.stringify({ subject, body, exclude, testMode: testMode === "true" }));
' "$BUILT" "$TEST_MODE")

mkdir -p "$STATE_DIR"
if [[ "$MODE" == "live" ]]; then
  # Claim before send, like lifecycle_emails: a crash or timeout after this
  # line leaves the stamp, so the next run stops and asks you to check Resend.
  printf '%s\nlive request started %s\n' "$HASH" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$LIVE_STAMP"
  printf 'consent basis: %s\n' "$LAUNCH_CONSENT_BASIS" >> "$LIVE_STAMP"
fi

echo "Sending (${MODE}: testMode=${TEST_MODE}) …"
set +e
RESPONSE=$(curl -sS --max-time 300 -w $'\n%{http_code}' -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "x-campaign-secret: ${CAMPAIGN_SECRET}" \
  -d "$PAYLOAD")
CURL_EXIT=$?
set -e
STATUS="${RESPONSE##*$'\n'}"
BODY_OUT="${RESPONSE%$'\n'*}"
echo "$BODY_OUT"
echo "HTTP $STATUS (curl exit $CURL_EXIT)"

if [[ "$MODE" == "test" ]]; then
  if [[ "$CURL_EXIT" -eq 0 && "$STATUS" == "200" ]]; then
    printf '%s\ntest sent %s\n' "$HASH" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$TESTED_STAMP"
    echo "Test sent. Read it in the TEST_EMAIL inbox and click every link before going live."
    exit 0
  fi
  echo "Test failed; nothing is stamped. Fix the cause and run test again." >&2
  exit 1
fi

# live
if [[ "$CURL_EXIT" -eq 0 && ( "$STATUS" == "400" || "$STATUS" == "401" ) ]]; then
  # send-campaign returns these before it reads the audience: nothing was sent.
  rm -f "$LIVE_STAMP"
  echo "Rejected before sending (HTTP $STATUS). Nothing was sent; the stamp is cleared." >&2
  exit 1
fi
printf 'live response %s: HTTP %s, curl exit %s, %s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$STATUS" "$CURL_EXIT" "$BODY_OUT" >> "$LIVE_STAMP"
if [[ "$CURL_EXIT" -ne 0 || "$STATUS" != "200" ]]; then
  cat >&2 <<'EOF'
The live request did not return a clean 200. DO NOT RUN IT AGAIN.
Emails may already be going out. Open Resend → Emails, look for this subject,
and count the deliveries before deciding anything.
EOF
  exit 1
fi
echo "Live send finished. Stamp: $LIVE_STAMP. Do not run live again."
