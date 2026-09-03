# Owner prompts — paste-ready

Steps that only a browser logged in as the owner can do. Each is a prompt for the
**Claude in Chrome extension** (or a local Claude Code session with the Chrome MCP —
the cloud sessions do not have it). Keep them here so the next launch does not
re-derive them.

## Lemon Squeezy (store 309512 — DeutschMeister, NOT MedMeister)

**Create a product with variants** (used 2026-09-03 for product 1336941):
```
In Lemon Squeezy store 309512 create ONE one-time product "<name>" with variants
<name>=€<price>, … , EUR, tax category "SaaS – personal use". Description: <text>.
Publish. For each variant return the numeric variant id and the checkout share-link UUID.
Do not touch any other product.
```
Then paste the ids to the agent: it sets `LEMONSQUEEZY_<KEY>_VARIANT_ID` (numeric,
functions scope) and `VITE_/PUBLIC_LEMONSQUEEZY_<KEY>_VARIANT_ID` (UUID, builds scope)
via the Netlify connector and redeploys.

**Set the post-purchase redirect** (so buyers land on our success page, not LS's receipt):
```
In store 309512, set product <id>'s "Redirect after purchase" URL to
https://deutsch-meister.de/subscription/success and save.
```

**100 % test discount** (used 2026-09-03: DMTEST100, discount 1120253):
```
Create a discount: name "Internal test purchase", code <CODE>, 100 %, restricted to
product <id>, usage limit 3, expires <date> 23:00 UTC. Confirm it shows Active.
```
Deactivate it afterwards: `Deactivate discount <id> in store 309512.`

**Test purchase** (the agent verifies the `purchases` row in Supabase afterwards):
```
Open https://deutsch-meister.de/pricing/ logged in as <email>. Click "Buy <level>",
apply <CODE>, confirm €0.00, complete checkout. Then open /subscription and
/level/<first sub-level> and screenshot both. Report the LS order number.
```
Note: a €0 order cannot be refunded in LS, so the refund → re-lock path is not covered
by this test.
