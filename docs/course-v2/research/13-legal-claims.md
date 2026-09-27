# 13 — Legal and claims constraints for selling the eight courses

**Date:** 2026-09-26 · **Scope:** paid self-paced courses A1.2–B2.2, the free A1.1 entry, instant AI grading of writing and speaking, sale through Lemon Squeezy (merchant of record) to consumers in Germany and abroad · **Status:** research input for the course-v2 blueprint. This memo is not legal advice. Items 1, 2 and 7 under "Open questions" need counsel before B1/B2 go on sale.

## Method

- **Read in full.**
  - Statutes from gesetze-im-internet.de: FernUSG (last amended 10.08.2021), UWG with its annex, PAngV, BGB §§ 327r, 356, 357a, and MarkenG § 23.
  - BGH III ZR 137/25 (5.2.2026, the court's PDF), the BMBFSFJ Referentenentwurf of 17.08.2026 and the BAMF spouse-visa leaflet.
  - The ZFU's own pages on Fernunterricht, the FAQ and the procedure.
- **Read in summary only.** III ZR 109/24 and III ZR 173/24 (the juris links redirect), the AI Act Omnibus, the draft Commission guidelines on high-risk AI, § 356a BGB and the Lemon Squeezy buyer terms.
- **About 30 web searches**, including searches for rulings on "in X Wochen", guarantee and "lebenslang" claims by language providers. None specific to language courses was found.
- **Local sources.** `docs/course-research-2026-09-03.md` §4 and `docs/research/research-pricing-2026-09-03.md` §5 were treated as claims to check, and a copy audit grepped `src/` and `astro-site/src/`.
- **Snippets.** No MCP tool was called. Anything confirmed only by a search snippet is marked **(unverified)**.

## Findings

### 1. The FernUSG test, and where the course sits

**The statute.** § 1 Abs. 1 FernUSG covers any paid, contract-based "Vermittlung von Kenntnissen und Fähigkeiten, bei der 1. der Lehrende und der Lernende ausschließlich oder überwiegend räumlich getrennt sind und 2. der Lehrende oder sein Beauftragter den Lernerfolg überwachen" ([FernUSG](https://www.gesetze-im-internet.de/fernusg/BJNR025250976.html)).

- **Spatial separation.** Our courses are asynchronous, so separation is given. The BGH now treats a course as separated unless teaching runs through "bidirektionale[…] – synchrone[…] – Kommunikation" (Leitsatz). Recordings of live sessions count as asynchronous ([BGH III ZR 137/25](https://www.bundesgerichtshof.de/SharedDocs/Entscheidungen/DE/Zivilsenate/III_ZS/2025/III_ZR_137-25.pdf?__blob=publicationFile&v=1)).
- **Payment.** The free A1.1 is outside the Act ("entgeltlich"). Every paid half-level turns on Nr. 2 alone.

**What "Überwachung des Lernerfolgs" means in 2026.** The bar is very low.

- **The Fragerecht is enough.** The criterion "ist erfüllt, wenn dem Teilnehmer ein auf das eigene Verständnis des erlernten Stoffs bezogenes Fragerecht vertraglich eingeräumt ist, wodurch er eine persönliche Lernkontrolle herbeiführen und überprüfen kann, ob er die vermittelten Inhalte zutreffend erfasst hat und richtig anwenden kann". An additional "Kontrolle durch den Lehrenden oder seinen Beauftragten" is **not** required (III ZR 137/25 Rn. 34, citing III ZR 109/24 Rn. 28 and III ZR 173/24 Rn. 18).
- **Once is enough, use is irrelevant.** A single opportunity suffices, by e-mail, in a forum or in an online meeting. Whether the learner actually uses it does not matter ([Noerr on III ZR 109/24](https://www.noerr.com/de/insights/bgh-konkretisiert-anwendungsbereich-von-fernunterrichtsschutzgesetz-fuer-digitale-lernangebote); [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/bgh-urteil-fernunterricht-online-coaching.html)).
- **The basis is old.** The BGH read it this broadly as early as 2009 (III ZR 310/08, [Rechtsportal](https://www.rechtsportal.de/Rechtsprechung/Rechtsprechung/2009/BGH/Vertraglich-vereinbarte-Ueberwachung-eines-Lernerfolgs-als-Voraussetzung-fuer-die-Anwendung-des-Fernunterrichtsschutzgesetzes-Weites-Verstaendnis-des-Begriffs-der-Ueberwachung-des-Lernerfolgs)).
- **The contract decides, not the label.** What counts is the contract and the programme description, not the name: "es entscheidet nicht der Name des Angebots, sondern seine Funktion" ([Dogan Pfahler FAQ](https://doganpfahler.de/faq-bgh-fernunterricht-fernusg-online-coaching/)).
- **Businesses are protected too.** The Act protects entrepreneurs as well as consumers (III ZR 109/24, III ZR 173/24; [Dr. Bahr](https://www.dr-bahr.com/news/weitere-grundlagen-entscheidung-zu-online-coaching-vertraegen-im-b2b-bereich-fernusg-anwendbar.html)).
- **No constitutional escape.** The Senate is not convinced that the approval duty and the nullity rule are unconstitutional (III ZR 74/25, cited in III ZR 137/25 Rn. 35).

**Consequences if a paid course falls inside the Act without ZFU approval.**

- **Void contract.** The contract is void (§ 7 Abs. 1), and the full price is repayable under § 812 BGB. Value compensation is rarely granted, and the limitation period is three years ([Dogan Pfahler](https://doganpfahler.de/faq-bgh-fernunterricht-fernusg-online-coaching/)).
- **Fines and suits.** Selling without approval can be fined up to €10,000 (§ 21 Abs. 2). Several OLG cases the BGH lists are reported in WRP (Rn. 22), which suggests competition-law suits (**unverified**).

**Why seeking approval is not a real option for this business.**

- **Our payment model is banned.** "Vorauszahlungen dürfen weder vereinbart noch gefordert werden"; billing runs in instalments of at most three months (§ 2 Abs. 2). We sell a one-time, up-front, lifetime purchase.
- **Learners can cancel with a pro-rata refund** (§ 5).
- **Every substantive content change needs fresh approval** (§ 12 Abs. 1 S. 2). Approval takes "in der Regel … drei Monate" ([ZFU FAQ](https://zfu.de/veranstaltende/faq)).
- **Fees.** Fees are reported as 150 % of the course price, at least €1,050 per course (**unverified**, snippet, [BayernPortal](https://www.bayernportal.de/dokumente/leistung/888088911478)).
- **Precedent.** Goethe's DOI, the incumbent that sells tutor feedback, carries a ZFU number (`08-competitors.md`).

**Conclusion:** stay outside the Act by design.

### 2. Automated and AI feedback: the question no court has answered

**ZFU practice on automated tests.**

- **The ZFU's own page.** Individual learning checks are "bei reinen EDV-gestützten Tests wie Multiple-Choice-Aufgaben in der Regel nicht möglich" ([ZFU](https://zfu.de/veranstaltende/fernunterricht)).
- **The reported position.** Automatically scored MC tests, as "programmierte Unterweisung", are "grundsätzlich keine individuelle Lernerfolgskontrolle". The answer changes where results are evaluated by a teacher or the provider "sich die Ergebnisse zu eigen macht und darauf aufbauend individualisierte Zeugnisse oder Rückmeldungen erteilt" ([Dogan Pfahler](https://doganpfahler.de/faq-bgh-fernunterricht-fernusg-online-coaching/)).
- **The position is in flux.** The ZFU FAQ entries "Sind Multiple-Choice-Fragen bzw. digitale Tests als individuelle Lernerfolgskontrolle zu betrachten?" and "individuelle Lernerfolgskontrolle" both read "Der Inhalt wird zurzeit bearbeitet" (fetched 2026-09-27).

**AI has not been ruled on.**

- **No court yet.** No court has ruled on AI feedback ([Dogan Pfahler](https://doganpfahler.de/faq-bgh-fernunterricht-fernusg-online-coaching/)).
- **Arguments that it counts.** A practitioner piece argues it does, because the AI reacts individually (**unverified**, snippet, [openPR](https://www.openpr.de/news/1305921/Ist-eine-KI-eine-Lernerfolgskontrolle-Neue-Rechtsfrage-bei-Online-Kursen.html)). A vendor asserts the same without a source ([alphabees](https://www.alphabees.de/lernrecht/bgh)).

**My reading.** An AI that scores a learner's text against criteria and says what was applied wrongly does functionally what Rn. 34 describes: it lets the learner check "ob er die vermittelten Inhalte zutreffend erfasst hat und richtig anwenden kann". The only counter-argument is textual: the statute speaks of "der Lehrende oder sein Beauftragter", a person, and ZFU practice treats programmed instruction as outside. That is a real argument, but an untested one.

**Risk ranking of the features the owner wants** (my assessment from the sources above):

| Feature in a paid course | FernUSG exposure | Why |
|---|---|---|
| Deterministic checker (MC, gap-fill, typed answers via `check.js`) | Low | ZFU practice: programmed instruction |
| Automated checkpoints that gate the next unit | Low to medium | Same practice. Practitioner guides advise removing unlock gates as well ([onlinekurshosting.de](https://onlinekurshosting.de/fernunterrichtsgesetz-online-kurs), a conservative view, not law) |
| AI rubric score + corrections on writing and speaking | **Medium, untested** | Individual output, but no person |
| AI chat that answers the learner's questions about the course material | **Medium to high** | This is the BGH's Fragerecht with AI in place of the teacher |
| Any human answer to content questions (support e-mail, forum or Telegram with staff, live Q&A, "Lehrkraft korrigiert") | **High, settled** | III ZR 109/24, 173/24, 137/25 |
| Certificate that records scores or attests a level | **High** | ZFU: individualised "Zeugnisse" |

**Existing exposure.** Course buyers already get 90 days of Pro, including the AI tools (`src/data/pricing.js:82`, `COURSE_PRO_DAYS`). The v2 directive moves AI grading into the course itself, so the exposure the 2026-09-03 doc parked in "Pro" is now in the core course contract.

### 3. The repeal draft moves the horizon, not today's rules

The BMBFSFJ Referentenentwurf "zur Modernisierung und Entbürokratisierung des Fernunterrichts" was released on 17.08.2026 ([PDF](https://www.bmbfsfj.bund.de/resource/blob/293608/e8225cb64f73a15e50603a234651d42d/referentenentwurf-data.pdf); [beck-aktuell, 1.9.2026](https://www.beck-aktuell.de/heute-im-recht/rechtspolitik-gesetzgebung/abschaffung-fernunterrichtsschutzgesetz-referentenentwurf-2026-09-01)).

- **What it repeals, and when.** Art. 1 deletes "§§ 1 bis 26" with effect from **1 July 2027** (Art. 3 Abs. 1). A transitional § 28 lapses at the end of 30 June 2028; press summaries that say "2028" mean this date.
- **It names AI.** The rationale cites a "strukturelle Benachteiligung digitaler – insbesondere KI-unterstützter – Angebote".
- **No retroactive cure.** I found no clause that validates contracts void under § 7, so pre-repeal sales stay under today's law (inference).
- **Not yet law.** It is a ministerial draft that needs Bundesrat consent, so the dates can move.

### 4. AI Act: a second reason to keep AI scores formative

- **The high-risk category.** Annex III 3(b) lists "AI systems intended to be used to evaluate learning outcomes, including when those outcomes are used to steer the learning process of natural persons in educational and vocational training institutions at all levels" ([Annex III](https://artificialintelligenceact.eu/annex/3/)).
- **Deadlines.** The Digital Omnibus (in force 27.07.2026) moved Annex III obligations to **2 December 2027**. The duty to disclose AI interaction (Art. 50(1)) applies from **2 August 2026**, i.e. now ([Lewis Silkin](https://www.lewissilkin.com/insights/2026/07/27/the-digital-omnibus-on-ai-enters-into-force-today-102nedo)).
- **Draft guidelines.** The draft Commission guidelines of 19.05.2026 reportedly treat "AI generating only spelling and grammar feedback without grade" as filter-eligible, and evaluation that steers the learning path as 3(b) ([praxikon](https://www.praxikon.com/en/posts/high-risk-ai-education); **unverified**).
- **Open scope question.** Whether a consumer self-study app is an "institution" is unresolved ([SIIA](https://www.siia.net/siia-seeks-clarification-on-implementation-of-eu-ai-acts-rules-for-high-risk-ai-systems-in-the-educational-context/)).

The design choices that lower FernUSG exposure lower this one too: formative scores, no progression gated on an AI score, no score-bearing certificate.

### 5. UWG: claims

- **Outcome claims.** § 5 Abs. 2 Nr. 1 UWG makes "von der Verwendung zu erwartende Ergebnisse" a head of misleading conduct ([UWG](https://www.gesetze-im-internet.de/uwg_2004/BJNR141400004.html)). Pass promises, pass probabilities and "B1 in 8 Wochen" are result claims, and the advertiser must be able to substantiate them. I found no reported decision specific to language courses.
- **"Official" claims.** Annex Nr. 4 always bans the untrue claim that a product "sei von einer öffentlichen oder privaten Stelle bestätigt, gebilligt oder genehmigt worden". § 5 Abs. 2 Nr. 3/4 cover false "Zulassung", "Beziehungen" and sponsorship claims. "Offiziell", "anerkannt", "zertifiziert" and "Goethe-Partner" fall here unless true.
- **Exam names.**
  - § 23 Abs. 1 Nr. 3 MarkenG allows use of a mark "zum Verweis auf Waren oder Dienstleistungen als die des Inhabers", but only in line with "den anständigen Gepflogenheiten" (§ 23 Abs. 2; [MarkenG § 23](https://www.gesetze-im-internet.de/markeng/__23.html)).
  - The Goethe-Institut says it prosecutes trademark infringement around its certificates (**unverified**, snippet, [goethe.de](https://www.goethe.de/ins/in/en/spr/prf/gzz.html)).
  - A title that *begins* with the mark, like `'Goethe-Zertifikat A2: 30 Tage bis zur Prüfung'` (`src/data/programs/goetheA2Kurs.js:36`), reads as a Goethe product.
- **Guarantees.**
  - Selling the statutory right of withdrawal as a guarantee violates Annex Nr. 10, unless a notice makes clear it is the statutory right (BGH I ZR 185/12, [Plutte](https://www.ra-plutte.de/geld-zurueck-garantie-als-werbung-mit-selbstverstaendlichkeiten/)).
  - Three sources disagree on refunds. `src/data/faqContent.js:85` advertises "a 7-day money-back guarantee" with no terms linked. The LS terms make refunds "at the sole discretion of Lemon Squeezy … and may be refused" ([LS buyer terms](https://www.lemonsqueezy.com/buyer-terms)). The pricing memo recommended 30 days.
- **Price anchoring.**
  - § 11 PAngV (the 30-day lowest price) applies to "Ware" ([PAngV](https://www.gesetze-im-internet.de/pangv_2022/BJNR492110021.html)). Practitioners read it as not covering digital content and services (**unverified**, snippet, [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/faq-werbung-preisermaessigungen-gesamtpreis-preisangabenverordnung.html)).
  - The binding rule for our courses is § 5 Abs. 5 UWG instead: a reduction is presumed misleading if the old price was charged "nur für eine unangemessen kurze Zeit", and the advertiser bears the burden of proof.
  - Prices must be quoted as the total price including VAT (§§ 3, 6 PAngV).
- **Other blacklist items.**
  - Nr. 7: a false time limit, e.g. a fake countdown.
  - Nr. 20: "kostenlos" when costs arise. A1.1 is genuinely free, but its capped AI allowance (`COURSE_WRITING_FREE_LIFETIME = 12`) must be stated.
  - Nr. 23b/23c: reviews.
- **Audio claims.**
  - Public copy says "native-speaker dialogues" (`astro-site/src/pages/index.astro:96, :336`, `pricing.astro:92`, `courses/[level].astro:263`), and `vergleich/[slug].astro:107` says "Dialoge mit Muttersprachlern".
  - v2 audio will be Azure TTS, which the player already labels "Computerstimme" (`src/lib/lesson/strings.js:364`).
  - Calling TTS "Muttersprachler" is untrue under § 5.

### 6. Certificates and visas

- **Participation vs performance.** The ZFU draws the line itself: "Eine Teilnahmebescheinigung bestätigt lediglich die Teilnahme am Lehrgang, ohne eine Bewertung der Leistung. Ein Zeugnis enthält Leistungsbeurteilungen" ([ZFU FAQ](https://zfu.de/veranstaltende/faq)).
- **Our certificate page.** `src/pages/CourseCertificatePage.jsx` prints "Teilnahmebescheinigung — DeutschMeister {code}" and "kein Goethe-/telc-Ergebnis" for rebuilt levels. It also prints "This certifies that … has completed every lesson" and "{testFormat} level". The legacy branch is headed "Certificate of Completion".
- **A contradiction.** `src/data/competitorComparisons.js:224` tells buyers "Deutschmeister stellt kein eigenes Zertifikat aus".
- **What the visa needs.** For the spouse visa, BAMF names "Start Deutsch 1" des Goethe-Instituts oder der telc GmbH, ÖSD "Grundstufe Deutsch 1" and "TestDaF", and says the embassy alone decides ([BAMF leaflet](https://www.bamf.de/SharedDocs/Anlagen/DE/MigrationAufenthalt/Ehegattennachzug/ehegattennachzug.pdf?__blob=publicationFile&v=9)). DTZ is not on that list.

### 7. Withdrawal, digital-content law, checkout

- **Digital content.**
  - The early-expiry rule is now **§ 356 Abs. 6 BGB**. It needs four things: performance has begun; the consumer "ausdrücklich zugestimmt" to it; the consumer "seine Kenntnis davon bestätigt" that the right lapses; and the trader has given a § 312f confirmation ([§ 356](https://www.gesetze-im-internet.de/bgb/__356.html)).
  - No value compensation is owed (§ 357a Abs. 3).
  - One unticked checkbox may carry both declarations (LG Karlsruhe, 3 O 108/21, [shopbetreiber-blog](https://shopbetreiber-blog.de/2022/07/11/lg-karlsruhe-zum-erloeschen-des-widerrufsrechts-bei-digitalen-inhalten)).
- **If the course is a digital service instead.** The right lapses only on *complete* performance (§ 356 Abs. 5), which lifetime access never reaches, so the buyer can withdraw within 14 days and owe pro-rata value (§ 357a Abs. 2). One law-firm guide classes e-learning platforms as services (**unverified**, [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/widerrufsrecht-digitale-inhalte-digitale-dienstleistungen.html)).
- **Lemon Squeezy's waiver.** LS sells as "an authorized reseller", and its waiver is a terms clause: "By downloading or otherwise acquiring the product, you consent … and you acknowledge that you will lose your right of withdrawal" ([LS buyer terms](https://www.lemonsqueezy.com/buyer-terms)). That is not obviously *express* consent, and our pre-checkout UI has no consent checkbox (no "Widerruf" anywhere in `src/`).
- **Withdrawal button.** Since **19 June 2026**, § 356a BGB requires a "Vertrag widerrufen" function for every online distance contract ([Noerr](https://www.noerr.com/de/insights/umsetzungsgesetz-zum-widerrufsbutton-veroeffentlicht)).
- **Changing a paid product.**
  - A change beyond what conformity requires needs a contract clause with "einen triftigen Grund", no extra cost and clear information.
  - If the change impairs access or usability, the buyer may end the contract free within 30 days, unless the unchanged product stays available ([§ 327r BGB](https://www.gesetze-im-internet.de/bgb/__327r.html)).
  - Replacing the courses sold since 2026-09-03 with v2 is such a change.
- **Missing legal pages.** The Impressum is a noindex draft with placeholders (`astro-site/src/pages/impressum.astro`), and there is no terms page.
- **Accessibility law (BFSG).** It exempts service micro-enterprises: fewer than 10 staff and at most €2 m turnover (§ 3 Abs. 3; [Händlerbund](https://ohn.haendlerbund.de/recht/rechtsfragen/kleinstunternehmen-bfsg-ausnahme)).

## Corrections to `docs/course-research-2026-09-03.md` §4 and the pricing memo

| Earlier claim | Status |
|---|---|
| BGH III ZR 109/24, III ZR 173/24 (2025) | **Correct.** Add III ZR 137/25 and III ZR 74/25 (5.2.2026) and the 2009 foundation. I found no BGH FernUSG ruling from 2023 or 2024; those years were an OLG split (III ZR 137/25 Rn. 22). |
| "Needs ZFU approval or the contract is void" | **Correct.** Add the fines, the prepayment ban (§ 2 Abs. 2) and the repeal draft (1.7.2027). |
| "Never promise personal feedback; AI grading worded as an automated tool" | **Necessary but not sufficient.** The courts test function and contract, not wording, and AI is untested. |
| "Delivered via Pro" | **Overtaken.** v2 puts AI grading in the course, and buyers already get 90 days of Pro. |
| "Only Goethe/telc/ÖSD/DTZ count for any visa" | **Partly wrong.** For the spouse visa BAMF lists SD1 (Goethe/telc), ÖSD A1 and TestDaF, not DTZ, and the embassy decides. |
| "Un-earned strike prices (§ 11 PAngV)" | **Wrong basis.** § 11 covers goods; the rule for us is § 5 / § 5 Abs. 5 UWG. The practical rule is the same. |
| "§ 356 Abs. 5 consent at checkout" | **Renumbered.** For digital content it is now § 356 Abs. 6. Abs. 5 is services. |
| BGH I ZR 185/12 on guarantees | **Verified.** |

## Implications for the course blueprint

1. **Define the course as self-study material plus automated practice software.** Nowhere in the product page, checkout, terms, onboarding or e-mail may we promise a right to ask content questions, a correction by a person, or that "we" check the learner's progress. Support is scoped to "Zugang, Technik, Rechnung".
2. **No human in the paid learning loop before the repeal is in force.** That rules out live sessions, a staff-answered forum or Telegram topic, "Lehrkraft prüft", and human rescoring on request. Internal quality sampling of AI output is fine as long as it is not a learner entitlement. Community spaces stay outside the course contract.
3. **AI grading is formative and says so on every surface.** Wording: „Automatische KI-Auswertung — keine Korrektur durch eine Lehrkraft, kein Prüfungsergebnis. Richtwert." Show the criteria, allow retries, and keep results private to the learner.
4. **Never gate progression on an AI score.** Unit gates use deterministic checks only, and the learner can override a gate. This keeps the design out of "steer the learning process" (AI Act 3(b)) and away from the provider "adopting" results (ZFU).
5. **No AI tutor chat for questions about course material in paid courses** until counsel clears it or the repeal is in force. Role-play speaking missions, which grade performance and do not answer questions about the material, are the acceptable form.
6. **Put the full AI experience in the free A1.1.** An unpaid course is outside the FernUSG, so A1.1 can show the moat without contract risk.
7. **The completion document is a „Teilnahmebescheinigung" only.**
   - It lists units completed, with no scores, no "has reached A1/B1" and no "Zertifikat".
   - It carries the fixed line „Kein Sprachzertifikat. Kein Ergebnis des Goethe-Instituts, von telc oder ÖSD. Nicht als Sprachnachweis für Visum, Aufenthalt oder Einbürgerung geeignet."
   - Remove "{testFormat} level" and the legacy "Certificate of Completion", and align `competitorComparisons.js:224` with the page.
8. **Exam names appear only in plain text in a purpose phrase.** The pattern is „Vorbereitung auf das Goethe-Zertifikat B1", „im Stil der Prüfung", „kein offizielles Prüfungsmaterial".
   - No logos.
   - No product title that begins with a mark: rename to „30-Tage-Lernplan zur Vorbereitung auf das Goethe-Zertifikat A2".
   - Link to the official Modellsätze; never copy them.
   - Never write „offiziell", „anerkannt", „zertifiziert" or „Partner" about ourselves.
9. **No outcome claims.**
   - None of: a pass promise, a pass probability, „in X Wochen zu B1", or „prüfungssicher".
   - Allowed: derived content counts; a time budget labelled as a Richtwert; and „Dein Ergebnis in unserer Übungsprüfung" in place of any readiness prediction.
10. **AI claims need evidence.**
    - No „bewertet wie ein Prüfer" and no accuracy percentage until agreement with human raters has been measured and published.
    - Ship a „Wie bewertet die KI?" page that states known limits.
    - Show an AI-interaction notice at first contact (Art. 50(1), in force).
11. **Audio labels follow provenance.** TTS is „Computerstimme". „Muttersprachler" or "native speaker" only for audio verified as human recordings. Fix the existing copy until that provenance is shown.
12. **Price display.**
    - Gross prices including VAT.
    - Strike prices only against a price actually charged for a meaningful period, with the price history kept in the repo.
    - No fake countdowns; a launch discount carries its real end date and ends on it.
13. **Offer one real voluntary refund promise and link its terms.** The recommendation is „30 Tage Geld zurück, ohne Angabe von Gründen", honoured in the LS dashboard. It moots the digital content vs service question. Never present the statutory right of withdrawal as a benefit, and fix `faqContent.js:85`.
14. **Add a pre-checkout checkbox, unticked by default.** It carries the § 356 Abs. 6 consent and the acknowledgment in one sentence, and the order e-mail confirms it. Verify how LS provides the § 356a withdrawal button.
15. **Treat v2 as a free upgrade for existing buyers.** Keep the old content reachable or confirm there is no impairment, and notify buyers on a durable medium (§ 327r).
16. **Legal pages before B1/B2 go live.**
    - Complete the Impressum.
    - Publish Nutzungsbedingungen that contain a § 327r change clause, describe the AI tools as software, and state the nature of the completion document.
    - Define „lebenslanger Zugang" as access for as long as the platform operates (inference).
17. **Re-open human features only after the repeal is enacted.** Human tutoring is a candidate premium add-on for contracts made from 1 July 2027 at the earliest.

**Do / don't at a glance (copy)**

| Do | Don't |
|---|---|
| „Übungsaufgaben mit automatischer KI-Auswertung" | „persönliches Feedback", „Korrektur deiner Texte", „Tutor", „Coach", „Fragen jederzeit" |
| „Vorbereitung auf das Goethe-Zertifikat B1" | „Goethe-Kurs", „offizieller Modelltest", „anerkannt", Goethe/telc logos |
| „Teilnahmebescheinigung — kein Sprachzertifikat" | „Zertifikat", „Niveau B1 erreicht", scores on the certificate |
| „ca. 40 Stunden Lernzeit (Richtwert)" | „B1 in 8 Wochen", „Prüfung bestehen garantiert", „Bestehenschance 90 %" |
| „Computerstimme" on TTS | „Muttersprachler" on TTS |
| „30 Tage Geld zurück" with linked terms | „14 Tage Widerrufsrecht" presented as a bonus |

## Open questions

1. **Counsel, before launch.** Does rubric-based AI feedback in a paid self-study course satisfy § 1 Abs. 1 Nr. 2? Is a binding ZFU enquiry worth making while its FAQ on digital tests is being rewritten?
2. **Who is the "Veranstalter"?** Is it Lemon Squeezy as reseller or the operator, and does § 8 (Umgehungsverbot) apply? Does German law, and the FernUSG with it, apply to buyers resident abroad (Rome I Art. 6), given that most demand is outside Germany (`10-buyers-demand.md`)?
3. **Classification.** Is the course digital content or a digital service for § 356? The answer decides whether a checkout waiver can work at all.
4. **Lemon Squeezy's checkout.** Does it show an explicit withdrawal-waiver checkbox and the § 356a button for German consumers?
5. **Audio provenance.** Are the 480 "native-speaker" dialogue lines human recordings or TTS?
6. **The repeal.** Will it pass as drafted, and on 1 July 2027?
7. **AI Act.** Does 3(b) reach consumer self-study apps, and what do the final Commission guidelines say?
8. **Marks.** Which exam names are registered marks, and do their owners publish usage rules?
9. **Existing exposure.** Does the Pro bundle already create FernUSG exposure for courses sold since 2026-09-03?

## Unverified

- **Rulings in summary only.** III ZR 109/24 and III ZR 173/24 were read in summary only. Their Rn. citations come from III ZR 137/25, and the OLG decisions come from the BGH's own list.
- **ZFU fees** (150 %, minimum €1,050): snippets only.
- **ZFU on automated tests:** the "programmierte Unterweisung" wording and the "individualisierte Zeugnisse" exception come from a law firm. The ZFU page itself has only the "EDV-gestützte Tests" sentence.
- **AI Act:** the Omnibus dates come from law-firm summaries (regulation number reported as 2026/1744), and the draft-guideline content from a secondary summary.
- **Contested readings:** § 11 PAngV not covering digital products, and e-learning as a digital service.
- **Other snippets:** Goethe-Institut trademark enforcement (a snippet; goethe.de returns 403), and that the WRP-reported OLG cases were UWG suits.
- **"Lebenslanger Zugang":** the risk is inference. The only "lebenslang" ruling found (OLG Düsseldorf, I-2 U 3/15) concerned a product guarantee.
