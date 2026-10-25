# Partner link drafts

Owner drafts only. Agents never send or post these links. The telc B1 offer is
not on sale yet; these examples point to its information page, not a checkout.
Offer start: `[Startdatum]`. Offer price: `[Preis]`.

## Scheme

Append this exact query to the selected destination:

```text
?ref=partner-<slug>&utm_source=partner&utm_medium=referral&utm_campaign=telc-b1-pilot
```

Use a stable lowercase ASCII slug with hyphens and no spaces, following
[tracking-links.md](../tracking-links.md). Replace `<slug>` with an owner-assigned
identifier; the five slugs below are placeholders, not real partners. Keep the
campaign and medium unchanged. Avoid names, email addresses or other personal
data in campaign labels. Keep each field within the parser's 100-character limit
(including the `partner-` prefix).

## Five example links

1. Teacher placeholder: <https://deutsch-meister.de/telc-b1-komplettvorbereitung/?ref=partner-example-teacher-a&utm_source=partner&utm_medium=referral&utm_campaign=telc-b1-pilot>
2. Teacher placeholder: <https://deutsch-meister.de/telc-b1-komplettvorbereitung/?ref=partner-example-teacher-b&utm_source=partner&utm_medium=referral&utm_campaign=telc-b1-pilot>
3. Course-provider placeholder: <https://deutsch-meister.de/telc-b1-komplettvorbereitung/?ref=partner-example-provider-a&utm_source=partner&utm_medium=referral&utm_campaign=telc-b1-pilot>
4. Course-provider placeholder: <https://deutsch-meister.de/telc-b1-komplettvorbereitung/?ref=partner-example-provider-b&utm_source=partner&utm_medium=referral&utm_campaign=telc-b1-pilot>
5. Community placeholder: <https://deutsch-meister.de/telc-b1-komplettvorbereitung/?ref=partner-example-community-a&utm_source=partner&utm_medium=referral&utm_campaign=telc-b1-pilot>

## What the existing capture records

[public/attribution.js](../../public/attribution.js) reads `utm_source` before
`ref`. With the exact scheme above, it records source `partner`, medium
`referral` and campaign `telc-b1-pilot`. It does **not** store `ref` separately;
the saved landing is the pathname without the query. These five links therefore
produce the same attribution labels. Do not report individual-partner conversion
from `ref` alone.

For individual-partner reporting with the existing parser, retain the required
scheme and append `&utm_content=partner-<slug>`. This optional extension stores
the identifier in the touch's `content` field, consistent with the documented
use of `utm_content` to distinguish placements. The owner log should retain
the slug-to-partner mapping.

Capture runs on page load, lowercases and sanitizes labels, and keeps the first
touch unchanged while refreshing the last attributed touch. At signup, the
profile's `acquisition_content` reflects the **first** touch. A partner arriving
after an earlier tagged visit will not replace that first-touch content. Check
first/last-touch semantics before interpreting reports.

Browser capture and signup attribution do not by themselves count qualified
offer views or establish paid sales, refunds or commissions. Use the strategy's
reconciled measurement before judging the pilot. All checks for this kit are
local; no link has been opened or placed by an agent.
