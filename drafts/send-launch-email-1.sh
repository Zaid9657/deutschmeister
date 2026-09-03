#!/usr/bin/env bash
# Launch email 1 (Day 0 announcement) — READY TO RUN, staged 2026-09-02.
#
# Why this and not a Resend broadcast: the Resend audience is empty, and the
# site's own send-campaign function is the engineered path — it derives the
# audience from confirmed accounts at send time, applies the exclude rules so
# buyers/subscribers never get later emails, appends the per-user HMAC
# unsubscribe footer, and supports a true test mode. Exporting the user list
# into Resend would duplicate (and freeze) all of that.
#
# HOW TO SEND (two commands, in this order):
#   1. Test to TEST_EMAIL only:   CAMPAIGN_SECRET=… ./drafts/send-launch-email-1.sh test
#   2. The real send:             CAMPAIGN_SECRET=… ./drafts/send-launch-email-1.sh live
#
# CAMPAIGN_SECRET is in the Netlify environment variables (Site settings →
# Environment). Never write it into this file.
#
# PRECONDITIONS (docs/revenue-plan-2026-08-31.md P0 — do NOT send before):
#   - START49 finished in Lemon Squeezy (expiry 2026-09-14, restricted to the
#     product) and the €89→€49 checkout verified by eye.
#   - One test-mode purchase verified end-to-end (ask the agent to check the
#     purchases row + course grant in the DB).
#
# Copy: drafts/launch-emails-telc-b1-2026-09.md · Email 1, verbatim.

set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" != "test" && "$MODE" != "live" ]]; then
  echo "usage: CAMPAIGN_SECRET=… $0 test|live" >&2; exit 1
fi
if [[ -z "${CAMPAIGN_SECRET:-}" ]]; then
  echo "CAMPAIGN_SECRET is not set (find it in the Netlify env vars)" >&2; exit 1
fi

TEST_MODE=true
[[ "$MODE" == "live" ]] && TEST_MODE=false

read -r -d '' BODY <<'HTML' || true
<p>You know the feeling: the telc B1 date is on the calendar, you know you should be practicing — and every evening you open the app, do <em>something</em>, and close it without knowing whether it was the right something.</p>
<p>That's the problem we just built a product for.</p>
<p>The <strong>telc B1 Komplettvorbereitung</strong> is a fixed 4-week plan over everything DeutschMeister already has: 20 daily tasks, in the order that leads to the exam. Grammar lesson by lesson, listening, reading, AI speaking practice — each day one tick-off task, ending with a full exam-orientation week. Three months of full Pro access are included, so there's nothing extra to subscribe to.</p>
<p>And since this week, Pro includes two things built exactly for exam candidates: a <strong>timed telc-style practice test</strong> that scores you against the documented pass threshold, and <strong>AI feedback on your exam letters</strong> — graded on the same four criteria the examiners use, with concrete corrections. Your exam week in the plan uses both.</p>
<p>It's a one-time purchase: <strong>&euro;89</strong>. And because you were here before this existed, the launch code <strong>START49</strong> takes it to <strong>&euro;49</strong> until September 14.</p>
<p><a href="https://deutsch-meister.de/telc-b1-komplettvorbereitung/"><strong>See exactly what's in the 4 weeks &rarr;</strong></a></p>
<p>Not preparing for telc B1? Then simply ignore this — the free daily sentence and everything else stays exactly as it is. And if you're not sure of your level yet, the <a href="https://deutsch-meister.de/level-test/">level test is free</a>.</p>
<p>— Zaid</p>
HTML

PAYLOAD=$(node -e '
  const [subject, body, testMode] = process.argv.slice(1);
  process.stdout.write(JSON.stringify({
    subject,
    body,
    exclude: ["subscribed", "purchased:telc_b1_komplett"],
    testMode: testMode === "true",
  }));
' "The plan I wish existed when I was studying for my German exam" "$BODY" "$TEST_MODE")

echo "Sending (${MODE}: testMode=${TEST_MODE}) …"
curl -sS -X POST https://deutsch-meister.de/.netlify/functions/send-campaign \
  -H "Content-Type: application/json" \
  -H "x-campaign-secret: ${CAMPAIGN_SECRET}" \
  -d "$PAYLOAD"
echo
