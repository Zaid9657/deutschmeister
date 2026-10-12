## 1. Must-fix errors

1. **Exact:** “Since 27 August they have sold **nothing**.”

   **Why:** The measured fact concerns new subscription first orders, not all payments or renewals. The catalogue also includes the €89 telc offer. (`src/data/pricing.js:81`)

   **Corrected:** “No new paid subscription first orders have occurred since August 27; real ticket/course sales remain zero. Renewal payments are counted separately.”

2. **Exact:** “**The bottleneck is qualified traffic, not the website.**”

   **Why:** This excludes unresolved conversion, activation, and fulfillment problems. Zero of 181 trials converted; production checkout mappings remain unverified.

   **Corrected:** “Qualified traffic must grow alongside validated offer conversion, activation, and fulfillment; the evidence does not establish traffic as the sole bottleneck.”

3. **Exact:** “This is gross: `price_paid` is the order total incl. VAT (€9.99 + €11.09 + €11.89).”

   **Why:** That combination explains €32.97 mathematically but was not verified as the actual three subscriptions. Initial creation stores item price; renewal writes invoice total. (`netlify/functions/lemonsqueezy-webhook.mjs:647`, `netlify/functions/lemonsqueezy-webhook.mjs:588`)

   **Corrected:** “The reported €32.97 sums `price_paid`; VAT-inclusive totals can reconcile it, but the actual payer composition is unverified and the column’s write paths mix accounting bases.”

4. **Exact:** “It proves people pay, and it roughly breaks even.”

   **Why:** My round-one B7 scenario required **zero cash CAC**, including commissions, and strict spending ceilings—not merely no advertising. Ten €25 partner commissions change approximately **+€50 to −€200**. The proposed build’s hours and legal quotation were not established.

   **Corrected:** “Ten completed €149 pilot sales would demonstrate willingness to pay; approximately €50 profit requires zero cash acquisition cost and total legal, build, founder-time, and overhead costs no higher than €700—unverified budget ceilings.”

   Apply those qualifications to the month-one table too.

5. **Exact:** “A written FernUSG check must confirm the product may be sold without ZFU approval, or that you need it.”

   **Why:** Knowing approval is required does not authorize sale. Applying is also insufficient; covered contracts require effective approval. [ZFU guidance](https://zfu.de/veranstaltende/faq)

   **Corrected:** “Before paid contracts, obtain a product-specific assessment establishing that approval is unnecessary, or obtain the required effective approval; an assessment or application alone does not authorize sale.”

6. **Exact:** “**§7 UWG.** The 1,165 accounts did not opt in to marketing.”

   **Why:** We established that a recorded consent basis was unavailable, not that every account lacked consent. Current campaign filtering proves confirmation and opt-out handling only. (`netlify/functions/send-campaign.mjs:91`, `netlify/functions/send-campaign.mjs:103`)

   **Corrected:** “Marketing eligibility for the 1,165 confirmed accounts has not been established; send promotional email only where a documented lawful basis exists.”

7. **Exact:** “Für Lernende etwa auf B1-Niveau: 20 Trainingseinheiten, sechs Schreibaufgaben mit KI-Feedback und zehn Sprechübungen.”

   **Why:** The minimal pilot uses **three prompts plus revisions**, not six distinct tasks. The extension’s “sechs Schreibaufgaben” condition repeats that mismatch. (`netlify/functions/_shared/writingTasks.mjs:18`, `:34`, `:50`; my round-one B7)

   **Corrected:** “Für Lernende etwa auf B1-Niveau: 20 Trainingseinheiten, drei Schreibaufgaben mit jeweils einer Überarbeitung und insgesamt sechs KI-Korrekturen sowie zehn Sprechübungen.”

   Apply the same distinction to English copy, card bullets, and extension eligibility; otherwise explicitly build six distinct tasks.

8. **Exact:** “Keine Verlängerung.”

   **Why:** The guarantee explicitly offers a thirty-day extension. My proposed wording excluded **automatic** renewal.

   **Corrected:** “Keine automatische Verlängerung oder weitere Abbuchung.”

9. **Exact:** “€249 wins if it keeps ≥76% of €199’s conversion.”

   **Why:** My round-one B3 threshold was approximately **76.45%**, conditional on equivalent acquisition cost per visitor and the stated delivery/refund assumptions.

   **Corrected:** “Under the stated cost assumptions and equivalent acquisition cost per qualified visitor, €249 produces greater contribution per visitor if it retains more than approximately 76.45% of €199’s conversion.”

10. **Exact:** “This is real feedback capacity, and the page says so.”

    **Why:** Ten was a proposed cap, conditional on genuine capacity—not a measured founder constraint or an existing page claim. My round-one C explicitly said “provided this is genuine feedback capacity.”

    **Corrected:** “Ten buyers is the proposed pilot cap; describe it as capacity-based scarcity only after confirming the resources and feedback process.”

11. **Exact:** “None is proven or lawful yet.”

    **Why:** Lack of validation or legal verification does not establish unlawfulness. My position excluded those revenues because they were unvalidated and subject to applicable preconditions.

    **Corrected:** “None contributes validated revenue to the base model; verify marketing eligibility, payment acceptance, and product legality where applicable.”

## 2. Should-fix

- Replace “One-off fee; protects every euro sold after it” with “A scoped legal assessment informs classification; it does not guarantee legality or eliminate liability.”
- Mark PR fixes as **verified in source; deployment unverified**, matching my round-one C9—not simply “Done.”
- Add verified payment-to-entitlement fulfillment and guest-account claiming to the pre-sale gates.
- Specify that the practice extension applies to retained, non-refunded purchases, with a request method and precisely defined access.
- Add the omitted standard setup scenario: approximately **−€2,014** in month one; the €50 case is the constrained alternative, not the default.

## 3. Sign-off

Codex cannot sign off until the must-fix factual claims, financial qualifications, legal sale condition, and misattributed capacity claim are corrected.
